import React from 'react';
import {
  Title,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon
} from '@patternfly/react-core';
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

export const TraceEmptyState: React.FunctionComponent = () => {
  return (
    <EmptyState>
      <EmptyStateIcon icon={CubesIcon} />
      <Title headingLevel="h4" size="lg">
        Empty state
      </Title>
      <EmptyStateBody>
        No a TempoStack instance has been selected. 
      </EmptyStateBody>
  </EmptyState>
  )
};
