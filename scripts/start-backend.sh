# Objectives 
# This allow the plugin's backend to be served from the pod. This lets us use the K8 apis 
# and use hot reloading from our localhost instead of redeploy for each change. 

# Prerequisites
# The distirbuted-tracing-console-plugin needs to be deployed on a cluster to use this script
# The namespace/project match the resources found in /hack file 

# Switch in to the namespace with the distributed-tracing-console-plugin
oc project openshift-tracing 

# Find the pod name (e.g. distirbuted-tracing-console-plugin-123456)
TRACING_PLUGIN=$(oc get pods -l app=distributed-tracing-console-plugin -o jsonpath='{.items[0].metadata.name}')

# Port-forward the plugin's remote port 9443 to localhost 9002 
oc port-forward $TRACING_PLUGIN 9002:9443

# Manually start the frontend server in another terminal from the root of the project 
# make start-frontend 

# Manually start console  
# make start-console


