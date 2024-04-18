package proxy

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"time"

	"github.com/gorilla/mux"
	oscrypto "github.com/openshift/library-go/pkg/crypto"
	"github.com/sirupsen/logrus"
)

var log = logrus.WithField("module", "proxy")

// These headers aren't things that proxies should pass along. Some are forbidden by http2.
// This fixes the bug where Chrome users saw a ERR_SPDY_PROTOCOL_ERROR for all proxied requests.
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

func getProxy(namespace string, name string, serviceCAfile string ) *httputil.ReverseProxy {

	// TODO: allow custom CA per datasource
	serviceCertPEM, err := os.ReadFile(serviceCAfile)
	if err != nil {
		log.Errorf("failed to read certificate file: tried '%s' and got %v", serviceCAfile, err)
	}
	serviceProxyRootCAs := x509.NewCertPool()
	if !serviceProxyRootCAs.AppendCertsFromPEM(serviceCertPEM) {
		log.Error("no CA found for Kubernetes services, proxy to datasources will fail")
	}
	serviceProxyTLSConfig := oscrypto.SecureTLSConfig(&tls.Config{
		RootCAs: serviceProxyRootCAs,
	})

	const (
		dialerKeepalive       = 30 * time.Second
		dialerTimeout         = 5 * time.Minute // Maximum request timeout for most browsers.
		tlsHandshakeTimeout   = 10 * time.Second
		websocketPingInterval = 30 * time.Second
		websocketTimeout      = 30 * time.Second
	)

	dialer := &net.Dialer{
		Timeout:   dialerTimeout,
		KeepAlive: dialerKeepalive,
	}

	transport := &http.Transport{
		Proxy: http.ProxyFromEnvironment,
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			return dialer.DialContext(ctx, network, addr)
		},
		TLSClientConfig:     serviceProxyTLSConfig,
		TLSHandshakeTimeout: tlsHandshakeTimeout,
	}

	
	// http://tempo-$name-query-frontend.$namespace:3200/
	// targetURL := datasource.Spec.Plugin.Spec.DirectURL	

	targetURL := fmt.Sprintf("http://tempo-%s-query-frontend.%s:3200", name, namespace)
	proxyURL, err := url.Parse(targetURL)

	if err != nil {
		log.WithError(err).Error("cannot parse direct URL", targetURL)
		return nil
	} else {
		reverseProxy := httputil.NewSingleHostReverseProxy(proxyURL)
		reverseProxy.FlushInterval = time.Millisecond * 100
		reverseProxy.Transport = transport
		reverseProxy.ModifyResponse = FilterHeaders
		return reverseProxy
	}
}

func CreateProxyHandler(serviceCAfile string) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		namespace := vars["namespace"]
		name := vars["name"]

		if len(namespace) == 0 {
			log.Errorf("cannot proxy request, namespace was not provided")
			http.Error(w, "cannot proxy request, namespace was not provided", http.StatusBadRequest)
			return
		}

		if len(name) == 0 {
			log.Errorf("cannot proxy request, tempostack name was not provided")
			http.Error(w, "cannot proxy request, tempostack name was not provided", http.StatusBadRequest)
			return
		}

		tempoProxy := getProxy(namespace, name, serviceCAfile)
		log.Infoln("CreateProxyHandler > getProxy ", tempoProxy)

		if tempoProxy == nil {
			log.Errorf("cannot proxy request, invalid tempo proxy: %s, %s", namespace, name)
			http.Error(w, "cannot proxy request, invalid tempo proxy", http.StatusNotFound)
			return
		}

		http.StripPrefix(fmt.Sprintf("/proxy/%s/%s", namespace, name), http.HandlerFunc(tempoProxy.ServeHTTP)).ServeHTTP(w, r)
	}
}
