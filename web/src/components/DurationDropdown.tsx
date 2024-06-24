import * as React from 'react';
import {
  Select,
  SelectVariant,
  SelectOption,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { DurationString } from '@perses-dev/prometheus-plugin';

type timeRangeSelectOption = {
  display: string, 
  value: DurationString
}

// The time range selection mirros the options on the Metrics Page 
const timeRangeSelctOptions: timeRangeSelectOption[] = [
  {
    display: 'Last 5 minutes', 
    value: '5m'
  },
  {
    display: 'Last 15 minutes', 
    value: '15m'
  },
  {
    display: 'Last 30 minutes', 
    value: '30m'
  },
  {
    display: 'Last 1 hour', 
    value: '1h'
  },
  {
    display: 'Last 6 hours', 
    value: '6h'
  },
  {
    display: 'Last 12 hours', 
    value: '12h'
  },
  {
    display: 'Last 1 day', 
    value: '1d'
  },
  {
    display: 'Last 7 day', 
    value: '7d'
  },
  {
    display: 'Last 14 day', 
    value: '14d'
  },
]

export const DurationDropdown = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState('30m');

  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');

  const onToggle = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: Duration | undefined,
  ) => {
    if (!value) {
      setSelected(undefined);
    }
    console.log('DurationDropdown > selected Value: ', value);
    setSelected(value.toString());
    setIsOpen(false);
    props.handleDurationChange(value);
  };

  const titleId = 'time-range-select';
  return (
    <Grid component="ul">
      <GridItem component="li">
        <label htmlFor="duration-dropdown">{t('Time Range')}</label>
      </GridItem>
      <GridItem component="li">
        <Select
          id={selected}
          variant={SelectVariant.typeahead}
          typeAheadAriaLabel={t('Select a Time Range')}
          onToggle={onToggle}
          onSelect={onSelect}
          selections={selected}
          isOpen={isOpen}
          aria-labelledby={titleId}
          placeholderText={t('Select a Time Range')}
          width={200}
        >
          {/* <SelectOption key="Option 1" value={Duration.fiveMinutes}>
            Last 5m
          </SelectOption>
          <SelectOption key="Option 2" value="15m">
            Last 15m
          </SelectOption>
          <SelectOption key="Option 3" value="30m">
            Last 30m
          </SelectOption> */}
          {
            timeRangeSelctOptions.map((option)=> (
              <SelectOption key={option.display} value={option.value}>
                t({option.display})
              </SelectOption>
            ))
          }
        </Select>
      </GridItem>
    </Grid>
  );
};
