package main

import (
        "fmt"
        "net/http"
        "net/http/httputil"
		"time"
		"net/url"

		datasources "github.com/openshift/distributed-tracing-console-plugin/pkg/datasources"

		"github.com/sirupsen/logrus"
)

var log = logrus.WithField("module", "proxy")


type DebugTransport struct{}

func (DebugTransport) RoundTrip(r *http.Request) (*http.Response, error) {
        b, err := httputil.DumpRequestOut(r, false)
        if err != nil {
                return nil, err
        }
		
        fmt.Println(string(b))
        return http.DefaultTransport.RoundTrip(r)
}

func FilterHeaders(r *http.Response) error {
	badHeaders := []string{
		"Connection",
		"Keep-Alive",
		"Proxy-Connection",
		"Transfer-Encoding",
		"Upgrade",
		"Access-Control-Allow-Headers",
		"Access-Control-Allow-Methods",
		"Access-Control-Allow-Origin",
		"Access-Control-Expose-Headers",
	}
	for _, h := range badHeaders {
		r.Header.Del(h)
	}
	return nil
}

func GetProxy(namespace string, name string, serviceCAfile string,  datasourceManager *datasources.DatasourceManager ) *httputil.ReverseProxy {
	
	proxiesMapKey := namespace + "-" + name
	existingProxy := datasourceManager.GetProxy(proxiesMapKey)
	if existingProxy != nil {
		return existingProxy
	}

	// TODO: allow custom CA per datasource
	// serviceCertPEM, err := os.ReadFile(serviceCAfile)
	// if err != nil {
	// 	log.Errorf("failed to read certificate file: tried '%s' and got %v", serviceCAfile, err)
	// }
	// serviceProxyRootCAs := x509.NewCertPool()
	// if !serviceProxyRootCAs.AppendCertsFromPEM(serviceCertPEM) {
	// 	log.Error("no CA found for Kubernetes services, proxy to datasources will fail")
	// }
	// serviceProxyTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{
	// 	RootCAs: serviceProxyRootCAs,
	// })

	// const (
	// 	dialerKeepalive       = 30 * time.Second
	// 	dialerTimeout         = 5 * time.Minute // Maximum request timeout for most browsers.
	// 	tlsHandshakeTimeout   = 10 * time.Second
	// 	websocketPingInterval = 30 * time.Second
	// 	websocketTimeout      = 30 * time.Second
	// )

	// dialer := &net.Dialer{
	// 	Timeout:   dialerTimeout,
	// 	KeepAlive: dialerKeepalive,
	// }

	// transport := &http.Transport{
	// 	Proxy: http.ProxyFromEnvironment,
	// 	DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
	// 		return dialer.DialContext(ctx, network, addr)
	// 	},
	// 	TLSClientConfig:     serviceProxyTLSConfig,
	// 	TLSHandshakeTimeout: tlsHandshakeTimeout,
	// }

	targetURL := fmt.Sprintf("http://tempo-%s-query-frontend.%s:3200", name, namespace)
	proxyURL, err := url.Parse(targetURL)

	if err != nil {
		log.WithError(err).Error("cannot parse direct URL", targetURL)
		return nil
	} else {
		reverseProxy := httputil.NewSingleHostReverseProxy(proxyURL)
		reverseProxy.FlushInterval = time.Millisecond * 100
		// reverseProxy.Transport = transport
		reverseProxy.Transport = DebugTransport{}
		reverseProxy.ModifyResponse = FilterHeaders
		datasourceManager.SetProxy(proxiesMapKey, reverseProxy)
		return reverseProxy
	}
}

func main() {
        // target, _ := url.Parse("http://localhost:3333")

        // log.Printf("forwarding to -> %s\n", target)

        // proxy := httputil.NewSingleHostReverseProxy(target)

        // proxy.Transport = DebugTransport{}

        http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
                req.Host = req.URL.Host

				datasourceManager := datasources.NewDatasourceManager()

				GetProxy("hello", "world", "serviceCAfile", datasourceManager).ServeHTTP(w,req)

                // proxy.ServeHTTP(w, req)
        })

        log.Fatal(http.ListenAndServe(":8989", nil))
}