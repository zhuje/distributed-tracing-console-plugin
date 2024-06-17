import React from 'react';
import {
  Title,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
} from '@patternfly/react-core';
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

import { useTranslation } from 'react-i18next';

export const TraceEmptyState: React.FunctionComponent = () => {
  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');

  return (
    <EmptyState>
      <EmptyStateIcon icon={CubesIcon} />
      <Title headingLevel="h4" size="lg">
        {t('No data source selected')}
      </Title>
      <EmptyStateBody>
        {t('Select a Tempo Stack instance to explore data')}
      </EmptyStateBody>
    </EmptyState>
  );
};
