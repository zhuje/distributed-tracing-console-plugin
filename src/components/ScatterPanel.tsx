import React, { useEffect } from 'react';

import { ChartsProvider, generateChartsTheme, getTheme, SnackbarProvider } from "@perses-dev/components";
import {
  DataQueriesProvider,
  dynamicImportPluginLoader, PluginModuleResource,
  PluginRegistry,
  TimeRangeProvider
} from "@perses-dev/plugin-system";
import { TimeSeriesChart, ScatterChart } from '@perses-dev/panels-plugin';
import { makeStyles, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DatasourceStoreProvider, TemplateVariableProvider } from "@perses-dev/dashboards";
import prometheusResource from '@perses-dev/prometheus-plugin/plugin.json';
import panelsResource from '@perses-dev/panels-plugin/plugin.json';
import { DashboardResource, GlobalDatasource, ProjectDatasource } from '@perses-dev/core';
import { DatasourceApi } from '@perses-dev/dashboards';
import tempoResource from '@perses-dev/tempo-plugin/plugin.json';
import { TextInput, Button } from '@patternfly/react-core';

import { TableBasic } from './Table';
import { ScatterChartPanel } from './CloneComponents/ScatterChartPanel';

const fakeDatasource: GlobalDatasource = {
    kind: 'GlobalDatasource',
    metadata: { name: 'hello' },
    spec: {
      default: true,
      plugin: {
        kind: 'TempoDatasource',
        spec: {
          directUrl: "/api/proxy/plugin/distributed-tracing-plugin/backend"
        },
      },
    },
  };

class DatasourceApiImpl implements DatasourceApi {
  getDatasource(): Promise<ProjectDatasource | undefined> {
    return Promise.resolve(undefined);
  }

  getGlobalDatasource(): Promise<GlobalDatasource | undefined> {
    return Promise.resolve(fakeDatasource);
  }

  listDatasources(): Promise<ProjectDatasource[]> {
    return Promise.resolve([]);
  }

  listGlobalDatasources(): Promise<GlobalDatasource[]> {
    return Promise.resolve([fakeDatasource]);
  }

  buildProxyUrl(): string {
    return '/';
  }
}
export const fakeDatasourceApi = new DatasourceApiImpl();
export const fakeDashboard = { kind: 'Dashboard', metadata: {}, spec: {} } as DashboardResource;

function ScatterPanel() {
   const [value, setValue] = React.useState('{}');
    // Use ref to prevent reload on each key tap in TraceQL input box
   const ref = React.useRef<HTMLInputElement>(null);

  const muiTheme = getTheme('light');
  const chartsTheme = generateChartsTheme(muiTheme, {});
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
        <SnackbarProvider anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="default" content="">
          <PluginRegistry
            pluginLoader={pluginLoader}
            defaultPluginKinds={{
                Panel: 'ScatterChart',
                TimeSeriesQuery: 'PrometheusTimeSeriesQuery',
                TraceQuery: 'TempoTraceQuery',
            }}
          >
            <QueryClientProvider client={queryClient}>
              <TimeRangeProvider refreshInterval="0s" timeRange={{ pastDuration: '30m' }}>
                <TemplateVariableProvider>
                  <DatasourceStoreProvider dashboardResource={fakeDashboard} datasourceApi={fakeDatasourceApi}>
                    <DataQueriesProvider
                      definitions={[
                        {
                            kind: 'TempoTraceQuery',
                            spec: { query: value },
                        },
                      ]}
                    >


                    <ScatterChartPanel
                        contentDimensions={{
                        width: 1000,
                        height: 400,
                        }}
                        spec={{
                        legend: {
                            position: 'bottom',
                            size: 'medium',
                        },
                        }}
                    />

                    {/* <ScatterChart.PanelComponent
                        contentDimensions={{
                        width: 1000,
                        height: 400,
                        }}
                        spec={{
                        legend: {
                            position: 'bottom',
                            size: 'medium',
                        },
                        }}
                    /> */}
                                        
                    
                    {/* <TimeSeriesChart.PanelComponent
                        contentDimensions={{
                          width: 0,
                          height: 0,
                        }}
                        spec={{
                          legend: {
                            position: 'bottom',
                            size: 'medium',
                          },
                        }}
                      /> */}
                    <TextInput
                        ref={ref}
                        // value={value}
                        type="text"
                        // onChange={(_event, value) => setValue(value.currentTarget.value)}
                        aria-label="text input example"
                      />
                      <Button
                        variant="primary"
                        onClick={() => {
                          setValue(ref.current.value);
                        }}
                      >
                        Submit
                      </Button>
                      <TableBasic />
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


export default ScatterPanel;