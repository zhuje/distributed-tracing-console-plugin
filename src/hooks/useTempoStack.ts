import * as React from 'react';
import {
  K8sResourceCommon,
  k8sList,
} from '@openshift-console/dynamic-plugin-sdk';

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

  React.useEffect(() => {
    k8sList({ model: TempoModel, queryParams: [] }).then((list) => {
      const tempoList: Array<K8sResourceCommon> = [];
      if (Array.isArray(list)) {
        list.forEach((tempoStack) => {
          tempoList.push(tempoStack);
        });
      } else {
        list.items.forEach((tempoStack) => {
          tempoList.push(tempoStack);
        });
      }
      setTempoStackList(tempoList);
    });
  }, []);

  return {
    tempoStackList,
  };
};
