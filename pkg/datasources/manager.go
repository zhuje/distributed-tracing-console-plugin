package datasources

import (
	"net/http/httputil"
	"sync"

	logrus "github.com/sirupsen/logrus"
)

var log = logrus.WithField("module", "datasources")

type ProxiesMap = map[string]*httputil.ReverseProxy

type DatasourceManager struct {
	proxiesMap    *ProxiesMap
	mutex         *sync.Mutex
}

func NewDatasourceManager() *DatasourceManager {
	return &DatasourceManager{
		proxiesMap:    &ProxiesMap{},
		mutex:         &sync.Mutex{}}
}

func (manager *DatasourceManager) GetProxy(datasourceName string) *httputil.ReverseProxy {
	manager.mutex.Lock()
	defer func() {
		manager.mutex.Unlock()
	}()
	return (*manager.proxiesMap)[datasourceName]
}

func (manager *DatasourceManager) SetProxy(datasourceName string, proxy *httputil.ReverseProxy) {
	manager.mutex.Lock()
	(*manager.proxiesMap)[datasourceName] = proxy
	manager.mutex.Unlock()
}

func (manager *DatasourceManager) Delete(datasourceName string) {
	manager.mutex.Lock()
	delete(*manager.proxiesMap, datasourceName)
	manager.mutex.Unlock()
}

func (manager *DatasourceManager) GetMaps() *ProxiesMap {
	return manager.proxiesMap
}