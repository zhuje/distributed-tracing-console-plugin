package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/sirupsen/logrus"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
)

var log = logrus.WithField("module", "api.tempo")

type TempoResource struct {
	Kind      KindType `json:"kind"`
	Namespace string   `json:"namespace"`
	Name      string   `json:"name"`
	// A list of tenant names for multi-tenant instances, or an empty list for single-tenant instances.
	Tenants []string `json:"tenants,omitempty"`
}

type KindType string

const (
	KindTempoStack      KindType = "TempoStack"
	KindTempoMonolithic KindType = "TempoMonolithic"
)

type ListTempoResourcesResponse struct {
	Status    StatusType      `json:"status"`
	Data      []TempoResource `json:"data"`
	ErrorType string          `json:"errorType,omitempty"`
	Error     string          `json:"error,omitempty"`
}

type StatusType string

const (
	StatusSuccess StatusType = "success"
	StatusError   StatusType = "error"
)

var (
	tempostackGVR = schema.GroupVersionResource{
		Group:    "tempo.grafana.com",
		Version:  "v1alpha1",
		Resource: "tempostacks",
	}
	tempomonolithicGVR = schema.GroupVersionResource{
		Group:    "tempo.grafana.com",
		Version:  "v1alpha1",
		Resource: "tempomonolithics",
	}
)

func writeResponse(w http.ResponseWriter, code int, r ListTempoResourcesResponse) {
	if r.Status == StatusError {
		log.Error(fmt.Sprintf("type=%s, error=%s", r.ErrorType, r.Error))
	}

	bytes, err := json.Marshal(r)
	if err != nil {
		log.Error(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(bytes)
}

func ListTempoResourcesHandler(k8sclient *dynamic.DynamicClient) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		resources, err := ListTempoResources(r.Context(), k8sclient)
		if err != nil {
			if apierrors.IsNotFound(err) {
				writeResponse(w, http.StatusNotFound, ListTempoResourcesResponse{
					Status:    StatusError,
					ErrorType: "TempoCRDNotFound",
					Error:     err.Error(),
				})
				return
			}

			writeResponse(w, http.StatusInternalServerError, ListTempoResourcesResponse{
				Status: StatusError,
				Error:  err.Error(),
			})
			return
		}

		writeResponse(w, http.StatusOK, ListTempoResourcesResponse{
			Status: StatusSuccess,
			Data:   resources,
		})
	})
}

func ListTempoResources(ctx context.Context, k8sclient *dynamic.DynamicClient) ([]TempoResource, error) {
	tempostacks, err := listTempos(ctx, k8sclient, tempostackGVR)
	if err != nil {
		return nil, err
	}

	tempomonolithics, err := listTempos(ctx, k8sclient, tempomonolithicGVR)
	if err != nil {
		return nil, err
	}

	return append(tempostacks, tempomonolithics...), nil
}

func listTempos(ctx context.Context, k8sclient *dynamic.DynamicClient, gvr schema.GroupVersionResource) ([]TempoResource, error) {
	resources := []TempoResource{}

	resourceList, err := k8sclient.Resource(gvr).List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("cannot list %s resource: %w", gvr.String(), err)
	}
	for _, resource := range resourceList.Items {
		itemLogger := log.WithFields(logrus.Fields{"namespace": resource.GetNamespace(), "tempo": resource.GetName()})

		tenants, err := readTenantsFromCR(&resource)
		if err != nil {
			itemLogger.Error(err)
			continue
		}

		// Fix for https://issues.redhat.com/browse/OU-467
		if len(tenants) == 0 {
			itemLogger.Debug("skipping Tempo instance without multi-tenancy")
			continue
		}

		resources = append(resources, TempoResource{
			Kind:      KindType(resource.GetKind()),
			Namespace: resource.GetNamespace(),
			Name:      resource.GetName(),
			Tenants:   tenants,
		})
	}

	return resources, nil
}

func readTenantsFromCR(spec *unstructured.Unstructured) ([]string, error) {
	switch KindType(spec.GetKind()) {
	case KindTempoStack:
		found, err := validateTenancyMode(spec, "spec", "tenants", "mode")
		if err != nil {
			return nil, err
		}
		if !found {
			// no tenants mode set: instance without multitenancy
			return []string{}, nil
		}

		tenants, err := extractTenantNames(spec, "spec", "tenants", "authentication")
		if err != nil {
			return nil, err
		}
		return tenants, nil

	case KindTempoMonolithic:
		enabled, found, err := unstructured.NestedBool(spec.Object, "spec", "multitenancy", "enabled")
		if err != nil {
			return nil, err
		}
		if !found || !enabled {
			return []string{}, nil
		}

		found, err = validateTenancyMode(spec, "spec", "multitenancy", "mode")
		if err != nil {
			return nil, err
		}
		if !found {
			// multitenancy enabled but mode not set.
			// mode is a required field, this condition should not happen.
			return []string{}, nil
		}

		tenants, err := extractTenantNames(spec, "spec", "multitenancy", "authentication")
		if err != nil {
			return nil, err
		}
		return tenants, nil

	default:
		return nil, fmt.Errorf("invalid Tempo resource with kind '%s'", spec.GetKind())
	}
}

func validateTenancyMode(spec *unstructured.Unstructured, fields ...string) (bool, error) {
	mode, found, err := unstructured.NestedString(spec.Object, fields...)
	if err != nil {
		return false, err
	}
	if !found {
		// instance without multitenancy
		return false, nil
	}
	if mode == "openshift" {
		return true, nil
	}
	return true, fmt.Errorf("multitenancy mode '%s' is not supported", mode)
}

func extractTenantNames(spec *unstructured.Unstructured, fields ...string) ([]string, error) {
	tenants, found, err := unstructured.NestedSlice(spec.Object, fields...)
	if err != nil {
		return nil, err
	}
	if !found {
		return []string{}, nil
	}

	// iterate over spec.tenants.authentication[].tenantName (TempoStack) or spec.multitenancy.authentication[].tenantName (TempoMonolithic)
	// https://github.com/grafana/tempo-operator/blob/bf2ef62df9784947edd668195c8fda00a35eb02b/docs/spec/tempo.grafana.com_tempostacks.yaml#L208-L218
	// https://github.com/grafana/tempo-operator/blob/bf2ef62df9784947edd668195c8fda00a35eb02b/docs/spec/tempo.grafana.com_tempomonolithics.yaml#L59-L70
	tenantNames := []string{}
	for _, tenant := range tenants {
		tenantMap, ok := tenant.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("invalid tenant spec: %v", tenant)
		}

		name, ok := tenantMap["tenantName"]
		if !ok {
			return nil, fmt.Errorf("tenantName not found in tenant spec: %v", tenant)
		}

		str, ok := name.(string)
		if !ok {
			return nil, fmt.Errorf("tenantName is not a string in tenant spec: %v", tenant)
		}

		tenantNames = append(tenantNames, str)
	}
	return tenantNames, nil
}
