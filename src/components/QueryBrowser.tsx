import React from 'react';

import {
  ChartsProvider,
  generateChartsTheme,
  getTheme,
  SnackbarProvider,
} from '@perses-dev/components';
import {
  DataQueriesProvider,
  dynamicImportPluginLoader,
  PluginModuleResource,
  PluginRegistry,
  TimeRangeProvider,
} from '@perses-dev/plugin-system';
import { ThemeProvider } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  DatasourceStoreProvider,
  TemplateVariableProvider,
} from '@perses-dev/dashboards';
import prometheusResource from '@perses-dev/prometheus-plugin/plugin.json';
import panelsResource from '@perses-dev/panels-plugin/plugin.json';
import {
  DashboardResource,
  GlobalDatasource,
  ProjectDatasource,
} from '@perses-dev/core';
import { DatasourceApi } from '@perses-dev/dashboards';
import tempoResource from '@perses-dev/tempo-plugin/plugin.json';
import { TextInput, Button } from '@patternfly/react-core';

import { TableBasic } from './Table';
import { PersesChartsTheme } from '@perses-dev/components';
import { Stack, StackItem } from '@patternfly/react-core';
import './QueryBrowser.css';

// for testing only
import { ScatterChartPanel } from './CloneScatterPlot/ScatterChartPanel';

const proxyDatasource: GlobalDatasource = {
  kind: 'GlobalDatasource',
  metadata: { name: 'TempoProxy' },
  spec: {
    default: true,
    plugin: {
      kind: 'TempoDatasource',
      spec: {
        directUrl: '/api/proxy/plugin/distributed-tracing-plugin/backend',
      },
    },
  },
};

class DatasourceApiImpl implements DatasourceApi {
  getDatasource(): Promise<ProjectDatasource | undefined> {
    return Promise.resolve(undefined);
  }
  getGlobalDatasource(): Promise<GlobalDatasource | undefined> {
    return Promise.resolve(proxyDatasource);
  }
  listDatasources(): Promise<ProjectDatasource[]> {
    return Promise.resolve([]);
  }
  listGlobalDatasources(): Promise<GlobalDatasource[]> {
    return Promise.resolve([proxyDatasource]);
  }
  buildProxyUrl(): string {
    return '/';
  }
}
export const datasourceApi = new DatasourceApiImpl();
export const dashboard = {
  kind: 'Dashboard',
  metadata: {},
  spec: {},
} as DashboardResource;

function QueryBrowser() {
  const [value, setValue] = React.useState('{}');
  // Use ref to prevent reload on each key tap in TraceQL input box
  const ref = React.useRef<HTMLInputElement>(null);

  const patternflyBlue300 = '#2b9af3';
  const patternflyBlue400 = '#0066cc';
  const patternflyBlue500 = '#004080';
  const patternflyBlue600 = '#002952';
  const defaultPaletteColors = [
    patternflyBlue400,
    patternflyBlue500,
    patternflyBlue600,
  ];
  const muiTheme = getTheme('light');
  const chartsTheme: PersesChartsTheme = generateChartsTheme(muiTheme, {
    thresholds: {
      defaultColor: patternflyBlue300,
      palette: defaultPaletteColors,
    },
  });

  const pluginLoader = dynamicImportPluginLoader([
    {
      resource: prometheusResource as PluginModuleResource,
      importPlugin: () => import('@perses-dev/prometheus-plugin'),
    },
    {
      resource: panelsResource as PluginModuleResource,
      importPlugin: () => import('@perses-dev/panels-plugin'),
    },
    {
      resource: tempoResource as PluginModuleResource,
      importPlugin: () => import('@perses-dev/tempo-plugin'),
    },
  ]);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 0,
      },
    },
  });

  return (
    <ThemeProvider theme={muiTheme}>
      <ChartsProvider chartsTheme={chartsTheme}>
        <SnackbarProvider
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="default"
          content=""
        >
          <PluginRegistry
            pluginLoader={pluginLoader}
            defaultPluginKinds={{
              Panel: 'ScatterChart',
              TimeSeriesQuery: 'PrometheusTimeSeriesQuery',
              TraceQuery: 'TempoTraceQuery',
            }}
          >
            <QueryClientProvider client={queryClient}>
              <TimeRangeProvider
                refreshInterval="0s"
                timeRange={{ pastDuration: '30m' }}
              >
                <TemplateVariableProvider>
                  <DatasourceStoreProvider
                    dashboardResource={dashboard}
                    datasourceApi={datasourceApi}
                  >
                    <DataQueriesProvider
                      definitions={[
                        {
                          kind: 'TempoTraceQuery',
                          spec: { query: value },
                        },
                      ]}
                    >
                      <Stack hasGutter>
                        <StackItem
                          className='query-browser-stack'
                        >
                          <ScatterChartPanel
                            contentDimensions={{
                              width: 1100,
                              height: 400,
                            }}
                            spec={{
                              legend: {
                                position: 'bottom',
                                size: 'medium',
                              },
                            }}
                          />
                        </StackItem>
                        <StackItem>
                          <TextInput
                            aria-label="trace query input"
                            ref={ref}
                            type="text"
                          />
                          <Button
                            aria-label="trace query button"
                            className="query-browser-input"
                            variant="primary"
                            onClick={() => {
                              setValue(ref.current.value);
                            }}
                          >
                            Run Query
                          </Button>
                        </StackItem>
                        <StackItem>
                          <TableBasic />
                        </StackItem>
                      </Stack>
                    </DataQueriesProvider>
                  </DatasourceStoreProvider>
                </TemplateVariableProvider>
              </TimeRangeProvider>
            </QueryClientProvider>
          </PluginRegistry>
        </SnackbarProvider>
      </ChartsProvider>
    </ThemeProvider>
  );
}

export default QueryBrowser;