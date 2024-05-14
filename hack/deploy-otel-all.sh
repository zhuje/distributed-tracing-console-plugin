# Prerequisites
# 1) OpenShift CLI. To test try `oc version`. 

# Terminal output colors 
GREEN='\033[0;32m'
ENDCOLOR='\033[0m' # No Color
RED='\033[0;31m'

# Creates a output to title each sub-action
add_title()
{
  eval title="$1"
  echo "${GREEN} *** ${title} *** ${ENDCOLOR}\n" 
  echo
}

# Variables
TEMPOSTACK_NS=${TEMPOSTACK_NS:="a-jezhu-tempostack-ns"}

# 1. Deploy Red Hat build of OpenTelemetry 
# https://docs.openshift.com/container-platform/4.15/observability/otel/otel-installing.html#installing-otel-by-using-the-cli_install-otel
title1="Deploy Red Hat build of OpenTelemetry "
add_title "\${title1}"

oc apply -f ./deploy-otel-operator.yaml 

echo "Sleeping for 60 seconds to await OpenTelemetry Operator ready status" 
sleep 60

echo "Verifiy Operator Status" 
oc get csv -n openshift-opentelemetry-operator
echo

# 2. Switch to TempoStack Namespace 

oc project ${TEMPOSTACK_NS}

# 3. Deploy OpenTelemetry Collector 

oc apply -f deploy-otel-collector.yaml

