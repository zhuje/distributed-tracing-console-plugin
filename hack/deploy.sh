oc apply -f ../distributed-tracing-console-plugin-resources.yaml

# Once deployed, patch the Console operator config to enable the plugin.
oc patch consoles.operator.openshift.io cluster \
  --patch '{ "spec": { "plugins": ["distributed-tracing-console-plugin"] } }' --type=merge
console.operator.openshift.io/cluster patched