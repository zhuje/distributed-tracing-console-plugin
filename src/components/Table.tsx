import React from 'react';
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  TableVariant,
  TableGridBreakpoint,
} from '@patternfly/react-table';
import { useDataQueries } from '@perses-dev/plugin-system';
import {
  Title,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
} from '@patternfly/react-core';
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

const EmptyTable = () => (
  <EmptyState>
    <EmptyStateIcon icon={CubesIcon} />
    <Title headingLevel="h4" size="lg">
      Empty state
    </Title>
    <EmptyStateBody>No Data</EmptyStateBody>
  </EmptyState>
);
const LoadingTable = () => (
  <svg
    className="pf-v5-c-spinner"
    role="progressbar"
    viewBox="0 0 100 100"
    aria-label="Loading..."
  >
    <circle
      className="pf-v5-c-spinner__path"
      cx="50"
      cy="50"
      r="45"
      fill="none"
    />
  </svg>
);

export const TraceTable: React.FunctionComponent = () => {
  // Get trace data from Perses's DataQueriesProvider
  const traceData = useDataQueries('TraceQuery');

  if (!traceData?.isLoading && traceData?.queryResults?.length < 1) {
    return <EmptyTable />;
  } else if (traceData?.isLoading) {
    return <LoadingTable />;
  }

  const traces = traceData.queryResults[0].data.traces;
  if (traces.length < 1) {
    return <EmptyTable />;
  }

  const columnNames = {
    traceId: 'Trace ID',
    durationMs: 'Duration (ms)',
    spanCount: 'Span count',
    errorCount: 'Error count',
    startTime: 'Start time',
  };

  return (
    <Table
      aria-label="traces query result table"
      variant={TableVariant.compact}
      gridBreakPoint={TableGridBreakpoint.none}
      borders={true}
    >
      <Thead>
        <Tr>
          <Th modifier="wrap">{columnNames.traceId}</Th>
          <Th modifier="wrap">{columnNames.durationMs}</Th>
          <Th modifier="wrap">{columnNames.spanCount}</Th>
          <Th modifier="wrap">{columnNames.errorCount}</Th>
          <Th modifier="wrap">{columnNames.startTime}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {traces.map((trace) => (
          <Tr key={trace.traceId}>
            <Td dataLabel={columnNames.traceId}>{trace.traceId}</Td>
            <Td dataLabel={columnNames.durationMs}>{trace.durationMs}</Td>
            <Td dataLabel={columnNames.spanCount}>{trace.spanCount}</Td>
            <Td dataLabel={columnNames.errorCount}>{trace.errorCount}</Td>
            <Td dataLabel={columnNames.startTime}>
              {new Date(trace.startTimeUnixMs).toString()}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
