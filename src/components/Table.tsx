import React from 'react';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { useDataQueries } from '@perses-dev/plugin-system';
import {
  Title,
  Button,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  EmptyStateSecondaryActions
} from '@patternfly/react-core';
import CubesIcon from '@patternfly/react-icons/dist/esm/icons/cubes-icon';

type ExampleType = 'default' | 'compact' | 'compactBorderless';



const EmptyTable = () => (
  <EmptyState>
    <EmptyStateIcon icon={CubesIcon} />
    <Title headingLevel="h4" size="lg">
      Empty state
    </Title>
    <EmptyStateBody>
      This represents an the empty state pattern in Patternfly 4. Hopefully it's simple enough to use but flexible
      enough to meet a variety of needs.
    </EmptyStateBody>
    <Button variant="primary">Primary action</Button>
    <EmptyStateSecondaryActions>
      <Button variant="link">Multiple</Button>
      <Button variant="link">Action Buttons</Button>
      <Button variant="link">Can</Button>
      <Button variant="link">Go here</Button>
      <Button variant="link">In the secondary</Button>
      <Button variant="link">Action area</Button>
    </EmptyStateSecondaryActions>
  </EmptyState>
)
const LoadingTable = () => (
  <svg
    className="pf-v5-c-spinner"
    role="progressbar"
    viewBox="0 0 100 100"
    aria-label="Loading..."
  >
    <circle className="pf-v5-c-spinner__path" cx="50" cy="50" r="45" fill="none" />
  </svg>
);
    




export const TableBasic: React.FunctionComponent = () => {
  // Get trace data from Perses's DataQueriesProvider 
  const traceData = useDataQueries('TraceQuery');
  console.log('Table > traceData : ', traceData);
  
  if (!traceData?.isLoading && traceData?.queryResults?.length < 1 ) {
    return <EmptyTable /> 
  } 
  else if (traceData?.isLoading ) {
    return  <LoadingTable />
  } 

  const traces = traceData.queryResults[0].data.traces; 
  if (traces.length < 1 ){
    return <EmptyTable /> 
  } 

  const columnNames = {
    traceId: 'Trace ID',
    durationMs: 'Duration (ms)',
    spanCount: 'Span count',
    errorCount: 'Error count',
    startTime: 'Start time'
  };

  // This state is just for the ToggleGroup in this example and isn't necessary for Table usage.
  const [exampleChoice, setExampleChoice] = React.useState<ExampleType>('default');

  return (

      <Table
        aria-label="Simple table"
        variant={exampleChoice !== 'default' ? 'compact' : undefined}
        borders={exampleChoice !== 'compactBorderless'}
      >
        <Thead>
          <Tr>
            <Th>{columnNames.traceId}</Th>
            <Th>{columnNames.durationMs}</Th>
            <Th>{columnNames.spanCount}</Th>
            <Th>{columnNames.errorCount}</Th>
            <Th>{columnNames.startTime}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {traces.map((trace) => (
            <Tr key={trace.traceId}>
              <Td dataLabel={columnNames.traceId}>{trace.traceId}</Td>
              <Td dataLabel={columnNames.durationMs}>{trace.durationMs}</Td>
              <Td dataLabel={columnNames.spanCount}>{trace.spanCount}</Td>
              <Td dataLabel={columnNames.errorCount}>{trace.errorCount}</Td>
              <Td dataLabel={columnNames.startTime}>{new Date(trace.startTimeUnixMs).toString()}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
  );
};