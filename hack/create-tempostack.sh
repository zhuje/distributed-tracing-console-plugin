#!/usr/bin/env bash

set -euo pipefail

# Prerequisites
# 1) AWS CLI. To test try `aws --version`. 
# 2) AWS configurations for `access_key`, `secret_key`, and `region` should be configured.
# This is for the creation of a Secret to access AWS S3 bucket. To test try `aws configure list`.
# 3) OpenShift CLI. To test try `oc version`. 

# Variables
TEMPOSTACK_NS=${TEMPOSTACK_NS:="a-jezhu-tempostack-ns"}
BUCKET_NAME=${BUCKET_NAME:="a-jezhu-bucket"}
SECRET_NAME=${SECRET_NAME:="a-jezhu-secret"}

# Create AWS bucket 
aws s3api create-bucket --bucket a-jezhu-bucket

# Install Tempo Operator Namespace/Project 
oc apply -f - << EOF
apiVersion: project.openshift.io/v1
kind: Project
metadata:
  labels:
    kubernetes.io/metadata.name: openshift-tempo-operator
    openshift.io/cluster-monitoring: "true"
  name: openshift-tempo-operator
EOF

# Install Tempo Operator 
oc apply -f - << EOF
apiVersion: operators.coreos.com/v1
kind: OperatorGroup
metadata:
  name: openshift-tempo-operator
  namespace: openshift-tempo-operator
spec:
  upgradeStrategy: Default
EOF

# Install Tempo Operator Subscription
oc apply -f - << EOF
apiVersion: operators.coreos.com/v1alpha1
kind: Subscription
metadata:
  name: tempo-product
  namespace: openshift-tempo-operator
spec:
  channel: stable
  installPlanApproval: Automatic
  name: tempo-product
  source: redhat-operators
  sourceNamespace: openshift-marketplace
EOF


# Check if Tempo operator is installed
echo "** sleeping for 20s to await Tempo Operator ready status **"
sleep 20
echo "** Checking Tempo Operator Status... **"
oc get csv -n openshift-tempo-operator

# Create TempoStack Namespace/Project 
oc apply -f - << EOF
apiVersion: project.openshift.io/v1
kind: Project
metadata:
  name: a-jezhu-tempostack-ns
EOF

# Create Secret for AWS Object storage 
oc apply -f - << EOF
apiVersion: v1
kind: Secret
metadata:
  name: a-jezhu-secret
  namespace: a-jezhu-tempostack-ns
stringData:
  endpoint: https://s3.$(aws configure get region).amazonaws.com
  bucket: a-jezhu-bucket
  access_key_id: $(aws configure get aws_access_key_id)
  access_key_secret: $(aws configure get aws_secret_access_key)
type: Opaque
EOF

# wait for other components to be ready before continuing
echo "** SECOND CHECK: sleeping for 20s to await Tempo Operator ready status **"
sleep 20
echo "** Checking Tempo Operator Status... **"
oc get csv -n openshift-tempo-operator

# Create TempoStack as Custom Resource 
oc apply -f - <<EOF
apiVersion: tempo.grafana.com/v1alpha1
kind: TempoStack
metadata:
  name: simplest
  namespace: a-jezhu-tempostack-ns
spec:
  storage:
    secret:
      name: a-jezhu-secret
      type: s3
  storageSize: 1Gi
  resources:
    total:
      limits:
        memory: 2Gi
        cpu: 2000m
  template:
    queryFrontend:
      jaegerQuery:
        enabled: true
        ingress:
          route:
            termination: edge
          type: route
EOF

                                                                          
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: list-tempostacks
rules:
- apiGroups: ["tempo.grafana.com"]
  resources: ["tempostacks"]
  verbs: ["list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: list-tempostacks
subjects:
- kind: ServiceAccount
  name: default
  namespace: openshift-tracing
roleRef:
  kind: ClusterRole
  name: list-tempostacks
  apiGroup: rbac.authorization.k8s.io
clusterrole.rbac.authorization.k8s.io/list-tempostacks created
clusterrolebinding.rbac.authorization.k8s.io/list-tempostacks created


# Forward Mock Traces to TempoStack 
oc apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: tracegen
  namespace: a-jezhu-tempostack-ns
spec:
  template:
    spec:
      containers:
        - name: tracegen
          image: ghcr.io/open-telemetry/opentelemetry-collector-contrib/tracegen:latest
          command:
            - "./tracegen"
          args:
            - -otlp-endpoint=tempo-simplest-distributor:4317
            - -otlp-insecure
            - -duration=30s
            - -workers=1
      restartPolicy: Never
  backoffLimit: 4
EOF

# Will need to add sleep here too 
echo "** sleeping for 20s to await TempoStack ready status **"
sleep 20
echo "** continuing... ** "

# Go to Jaeger UI 
export TEMPO_URL=$(oc get route -n a-jezhu-tempostack-ns tempo-simplest-query-frontend -o jsonpath='{.spec.host}')
echo "TEMPO_URL: $TEMPO_URL"
open https://$TEMPO_URL