import * as React from 'react';
import {
  K8sResourceCommon,
  k8sList,
} from '@openshift-console/dynamic-plugin-sdk';

const RouteModel = {
  kind: 'Route',
  label: 'Route',
  labelKey: 'public~Route',
  labelPlural: 'Routes',
  labelPluralKey: 'public~Routess',
  apiGroup: 'route.openshift.io',
  apiVersion: 'v1',
  abbr: 'RT',
  namespaced: true,
  plural: 'routes',
};

const TempoModel = {
  kind: 'TempoStack',
  label: 'TempoStack',
  labelKey: 'public~TempoStack',
  labelPlural: 'TempoStacks',
  labelPluralKey: 'public~TempoStacks',
  apiGroup: 'tempo.grafana.com',
  apiVersion: 'v1alpha1',
  abbr: 'TS',
  namespaced: true,
  plural: 'tempostacks',
};

export const useTempoStack = () => {
  const [tempoStackList, setTempoStackList] = React.useState<
    Array<K8sResourceCommon>
  >([]);

  const [routeList, setRouteList] = React.useState<
  Array<K8sResourceCommon>
>([]);

  React.useEffect(() => {
    k8sList({ model: TempoModel, queryParams: [] }).then((list) => {
      let tempoList: Array<K8sResourceCommon> = [];
      if (Array.isArray(list)) {
        tempoList = list;
      } else {
        tempoList = list.items;
      }
      setTempoStackList(tempoList);
    });
  }, []);

  React.useEffect(() => {
    k8sList({ model: RouteModel, queryParams: [] }).then((list) => {
      let rList: Array<K8sResourceCommon> = [];
      if (Array.isArray(list)) {
        rList = list;
      } else {
        rList = list.items;
      }
      setRouteList(rList)
    });
  }, []);

  console.log('/jz RouteList: ', routeList);

  console.log("/jz tempoStackList: ", tempoStackList)

  return {
    tempoStackList,
  };
};
