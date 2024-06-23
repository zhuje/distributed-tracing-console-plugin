import * as React from 'react';
import {
  Select,
  SelectVariant,
  SelectOption,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

enum Duration {
  fiveMinutes = '5m',
  fifteenMinutes = '15m',
  thirtyMinutes = '30m',
  oneHour = '1h',
  twoHours = '2h',
  sixHours = '6h',
  twelveHours = '12h',
  oneDay = '24h',
  sevenDays = '168h',
  fourteenDays = '336h',
}

const DurationMap = new Map<string, string>([
  ['fiveMinutes', '5m'],
  ['fifteenMinutes', '15m'],
]);

export const DurationDropdown = (props) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selected, setSelected] = React.useState(Duration.thirtyMinutes);

  props.handleDurationChange(selected);

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
    console.log('Selected Value: ', value);
    setSelected(value);
    setIsOpen(false);
  };

  const clearSelection = () => {
    setSelected(null);
    setIsOpen(false);
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
          <SelectOption key="Option 1" value="5m">
            {' '}
            Last 5m{' '}
          </SelectOption>
          <SelectOption key="Option 2" value="15m">
            {' '}
            Last 15m
          </SelectOption>
          <SelectOption key="Option 3" value="30m">
            {' '}
            Last 30m{' '}
          </SelectOption>
        </Select>
      </GridItem>
    </Grid>
  );
};
