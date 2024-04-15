package server

import (
	"context"
	"crypto/tls"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	// "io"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"

	// v1alpha1 "github.com/grafana/tempo-operator/apis/tempo/v1alpha1"

	// "k8s.io/client-go/kubernetes"

	// "k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"

	"sigs.k8s.io/controller-runtime/pkg/client"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/dynamic"

	"k8s.io/client-go/tools/clientcmd"
)

var c client.Client

var log = logrus.WithField("module", "server")

type Config struct {
	Port             int
	CertFile         string
	PrivateKeyFile   string
	Features         map[string]bool
	StaticPath       string
	ConfigPath       string
	PluginConfigPath string
}

type PluginConfig struct {
	UseTenantInHeader               bool          `json:"useTenantInHeader,omitempty" yaml:"useTenantInHeader,omitempty"`
	IsStreamingEnabledInDefaultPage bool          `json:"isStreamingEnabledInDefaultPage,omitempty" yaml:"isStreamingEnabledInDefaultPage,omitempty"`
	LokiTenanLabelKey               string        `json:"lokiTenanLabelKey,omitempty" yaml:"lokiTenanLabelKey,omitempty"`
	Timeout                         time.Duration `json:"timeout,omitempty" yaml:"timeout,omitempty"`
	LogsLimit                       int           `json:"logsLimit,omitempty" yaml:"logsLimit,omitempty"`
}

func (pluginConfig *PluginConfig) MarshalJSON() ([]byte, error) {
	type Alias PluginConfig
	return json.Marshal(&struct {
		Timeout float64 `json:"timeout,omitempty"`
		*Alias
	}{
		Timeout: pluginConfig.Timeout.Seconds(),
		Alias:   (*Alias)(pluginConfig),
	})
}

func Start(cfg *Config) {
	router := setupRoutes(cfg)
	router.Use(corsHeaderMiddleware(cfg))

	loggedRouter := handlers.LoggingHandler(log.Logger.Out, router)

	// clients must use TLS 1.2 or higher
	tlsConfig := &tls.Config{
		MinVersion: tls.VersionTLS12,
	}

	httpServer := &http.Server{
		Handler:      loggedRouter,
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		TLSConfig:    tlsConfig,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	if cfg.CertFile != "" && cfg.PrivateKeyFile != "" {
		log.Infof("listening on https://:%d", cfg.Port)
		panic(httpServer.ListenAndServeTLS(cfg.CertFile, cfg.PrivateKeyFile))
	} else {
		log.Infof("listening on http://:%d", cfg.Port)
		panic(httpServer.ListenAndServe())
	}
}

func setupRoutes(cfg *Config) *mux.Router {
	r := mux.NewRouter()

	r.PathPrefix("/health").HandlerFunc(healthHandler())

	// serve list of TempoStacks found on the cluster
	// we must version all apis to continue supporting them when v2 comes out
	r.PathPrefix("/api/v1/list-tempostacks").HandlerFunc(TempoStackHandler(cfg))

	// r.PathPrefix("/proxy/{name}/{namespace}").HandlerFunc(fooProxyHandle())
	// see proxy.go in console-dashobard 
	// create without the Watch objects first and 
	// fooProxyHandler 
		// fetch traces
		// 


	// serve plugin manifest according to enabled features
	r.Path("/plugin-manifest.json").Handler(manifestHandler(cfg))

	// serve enabled features list to the front-end
	r.PathPrefix("/features").HandlerFunc(featuresHandler(cfg))

	// serve plugin configuration to the front-end
	r.PathPrefix("/config").HandlerFunc(configHandler(cfg))

	// serve front end files
	r.PathPrefix("/").Handler(filesHandler(http.Dir(cfg.StaticPath)))

	return r
}

func filesHandler(root http.FileSystem) http.Handler {
	fileServer := http.FileServer(root)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		filePath := r.URL.Path

		// disable caching for plugin entry point
		if strings.HasPrefix(filePath, "/plugin-entry.js") {
			w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
			w.Header().Set("Expires", "0")
		}

		fileServer.ServeHTTP(w, r)
	})
}

func healthHandler() http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})
}

func TempoStackHandler(cfg *Config) http.HandlerFunc {

	// see DatasourceManager in console-dashboard-plugin 



	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// w.Write([]byte("TempoStackHandler pinged...\n"))

		// vars := mux.Vars(r)

		// namespace := vars["namespace"]
		// name := vars["name"]

		// tempoStackService := fmt.Sprintf("http://tempo-%s-query-frontend.%s:3200/api/search", name, namespace)
		// log.Infof("tempoStackService = %s\n", tempoStackService)

		// io.WriteString(w, tempoStackService)

		// return a list of tempostacks

		// resources stored in ETCD
		// use K8 api to access ETCD
		// need persmission to access

		// return name and id of tempostack then we can proxy to a specific service

		// Questions for the tracing team (done 11/11 11AM)
		// 1. ask if we can use the license for v1alpha1
		// 2. ask how we obtain the service for querying tempostacks once we got the list of tempostack names

		// Testing
		// 1. Create a mock service that returns the name and namespace for the TempoStackList
		// 2. Create the image and deploy it in a pod

		// config, err := rest.InClusterConfig()
		// if err != nil {
		// 	log.WithError(err).Error("cannot get in cluster config")
		// 	return
		// }

		// c, err := kubernetes.NewForConfig(config)
		// if err != nil {
		// 	log.WithError(err).Error("cannot create k8s client")
		// 	return
		// }

		// ctx := context.Background()

		// tempostacks := &v1alpha1.TempoStackList{}

		// err = client.List(ctx, tempostacks)
		// if err != nil {
		// 	// handle err
		// }
		// for _, tempo := range tempostacks.Items {
		// 	fmt.Printf("%s/%s\n", tempo.Namespace, tempo.Name)
		// }

		// // c is a created client.
		// _ = c.List(ctx, tempostacks)

		// Using a unstructured object.
		// u := &unstructured.UnstructuredList{}
		// u.SetGroupVersionKind(schema.GroupVersionKind{
		// 	Group:   "tempo.grafana.com",
		// 	Kind:    "TempoStack",
		// 	Version: "v1alpha1",
		// })
		// _ = c.List(context.Background(), u)

		// for testing locally
		config, err := clientcmd.BuildConfigFromFlags("", "/Users/jezhu/.kube/config")
		if err != nil {
			w.Write([]byte("[]"))
			log.WithError(err).Errorf("config error")
			return
		}

		dynamicClient, err := dynamic.NewForConfig(config)
		if err != nil {
			w.Write([]byte("[]"))
			log.WithError(err).Errorf("dynamicClient error")
			return
		}

		gvr := schema.GroupVersionResource{
			Group:    "tempo.grafana.com",
			Version:  "v1alpha1",
			Resource: "tempostacks",
		}

		// testing purposes only
		// gvr := schema.GroupVersionResource{
		// 	Group:    "config.openshift.io",
		// 	Version:  "v1",
		// 	Resource: "ingresses",
		// }

		resource, err := dynamicClient.Resource(gvr).List(context.TODO(), metav1.ListOptions{})
		if err != nil {
			w.Write([]byte("[]"))
			log.WithError(err).Errorf("resource error")
			return
		}

		fmt.Printf("%v", resource)

		type TempoStackInfo struct {
			Name      string `json:"name"`
			Namespace string `json:"namespace"`
		}

		var tempoStackList []TempoStackInfo

		for _, tempo := range resource.Items {
			tempoStackList = append(tempoStackList, TempoStackInfo{Name: tempo.GetName(), Namespace: tempo.GetNamespace()})
		}

		marshalledTempoStackList, err := json.Marshal(tempoStackList)
		if err != nil {
			w.Write([]byte("[]"))
			log.WithError(err).Errorf("resource error")
			return
		}
		w.Write(marshalledTempoStackList)

	})
}

func corsHeaderMiddleware(cfg *Config) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			headers := w.Header()
			headers.Set("Access-Control-Allow-Origin", "*")
			next.ServeHTTP(w, r)
		})
	}
}

func featuresHandler(cfg *Config) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		jsonFeatures, err := json.Marshal(cfg.Features)

		if err != nil {
			log.WithError(err).Errorf("cannot marshall, features were: %v", string(jsonFeatures))
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonFeatures)
	})
}

func configHandler(cfg *Config) http.HandlerFunc {
	pluginConfData, err := os.ReadFile(cfg.PluginConfigPath)

	if err != nil {
		log.WithError(err).Warnf("cannot read config file, serving plugin with default configuration, tried %s", cfg.PluginConfigPath)

		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte("{}"))
		})
	}

	var pluginConfig PluginConfig
	err = yaml.Unmarshal(pluginConfData, &pluginConfig)

	if err != nil {
		log.WithError(err).Error("unable to unmarshall config data")
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "unable to unmarshall config data", http.StatusInternalServerError)
		})
	}

	jsonPluginConfig, err := pluginConfig.MarshalJSON()

	if err != nil {
		log.WithError(err).Errorf("unable to marshall, config data: %v", pluginConfig)
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "unable to marshall config data", http.StatusInternalServerError)
		})
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write(jsonPluginConfig)
	})
}
