oc apply -f - << EOF
apiVersion: project.openshift.io/v1
kind: Project
metadata:
  name: openshift-tracing
EOF

oc apply -f - << EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: openshift-tracing-deployment
  namespace: openshift-tracing
EOF

oc apply -f - << EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: list-tempostacks
  namespace: openshift-tracing
rules:
- apiGroups: ["tempo.grafana.com"]
  resources: ["tempostacks"]
  verbs: ["list"]
EOF

oc apply -f - << EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: list-tempostacks
subjects:
- kind: ServiceAccount
  name: openshift-tracing-deployment
  namespace: openshift-tracing
roleRef:
  kind: ClusterRole
  name: list-tempostacks
  apiGroup: rbac.authorization.k8s.io
EOF

oc apply -f - << EOF
apiVersion: v1
kind: Service
metadata:
  annotations:
    service.alpha.openshift.io/serving-cert-secret-name: plugin-serving-cert
  name: distributed-tracing-console-plugin
  namespace: openshift-tracing
  labels:
    app: distributed-tracing-console-plugin
    app.kubernetes.io/component: distributed-tracing-console-plugin
    app.kubernetes.io/instance: distributed-tracing-console-plugin
    app.kubernetes.io/part-of: distributed-tracing-console-plugin
spec:
  ports:
    - name: 9443-tcp
      protocol: TCP
      port: 9443
      targetPort: 9443
  selector:
    app: distributed-tracing-console-plugin
  type: ClusterIP
  sessionAffinity: None
EOF

oc apply -f - << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: distributed-tracing-console-plugin
  namespace: openshift-tracing
  labels:
    app: distributed-tracing-console-plugin
    app.kubernetes.io/component: distributed-tracing-console-plugin
    app.kubernetes.io/instance: distributed-tracing-console-plugin
    app.kubernetes.io/part-of: distributed-tracing-console-plugin
    app.openshift.io/runtime-namespace: openshift-tracing
spec:
  replicas: 1
  selector:
    matchLabels:
      app: distributed-tracing-console-plugin
  template:
    metadata:
      labels:
        app: distributed-tracing-console-plugin
    spec:
      serviceAccountName: openshift-tracing-deployment
      containers:
        - name: distributed-tracing-console-plugin
          image: ${DISTRIBUTED_TRACING_CONSOLE_PLUGIN_TEST_DEPLOY_IMAGE}
          args:
            - "-port=9443"
            - "-cert=/var/serving-cert/tls.crt"
            - "-key=/var/serving-cert/tls.key"
            - "-plugin-config-path=/etc/plugin/config.yaml"
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL
          ports:
            - containerPort: 9443
              protocol: TCP
          imagePullPolicy: Always
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 100m
              memory: 128Mi
          volumeMounts:
            - name: plugin-serving-cert
              readOnly: true
              mountPath: /var/serving-cert
            - name: plugin-config
              readOnly: true
              mountPath: /etc/plugin/config.yaml
              subPath: config.yaml
      volumes:
        - name: plugin-serving-cert
          secret:
            secretName: plugin-serving-cert
            defaultMode: 420
        - name: plugin-config
          configMap:
            name: distributed-tracing-console-plugin-config
            defaultMode: 420
      restartPolicy: Always
      dnsPolicy: ClusterFirst
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 25%
      maxSurge: 25%
EOF

oc apply -f - << EOF
apiVersion: console.openshift.io/v1
kind: ConsolePlugin
metadata:
  name: distributed-tracing-console-plugin
  namespace: openshift-tracing
spec:
  displayName: "Distributed Tracing Console Plugin"
  backend:
    type: Service
    service:
      name: distributed-tracing-console-plugin
      namespace: openshift-tracing
      basePath: "/"
      port: 9443
  proxy:
  - alias: backend
    authorization: UserToken
    endpoint:
      service:
        name: distributed-tracing-console-plugin
        namespace: openshift-tracing
        port: 9443
      type: Service
EOF

oc apply -f - << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: distributed-tracing-console-plugin-config
  namespace: openshift-tracing
  labels:
    app: distributed-tracing-console-plugin
    app.kubernetes.io/part-of: distributed-tracing-console-plugin
data:
  config.yaml: |-
    logsLimit: 100
    timeout: "30s"
EOF
