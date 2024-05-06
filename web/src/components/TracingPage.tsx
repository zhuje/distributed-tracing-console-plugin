import * as React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import {
  Page,
  PageSection,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';
import { TempoStackDropdown } from './TempoStackDropdown';
import { useURLState } from '../hooks/useURLState';
import { useTranslation } from 'react-i18next';
import PersesWrapper from './PersesWrapper';

// testing 
import { useTempoStack2 } from '../hooks/useTempoStack2';

import './example.css';

export default function TracingPage() {
  const { tempoStack, namespace, setTempoStackInURL } = useURLState();
  
  const { tempoStackList2 } = useTempoStack2();

  const { t } = useTranslation('plugin__distributed-tracing-console-plugin');

  if (!tempoStackList2) {
    return <div>{t('Loading...')}</div>;
  }

  return (
    <>
      <HelmetProvider>
        <Helmet>
          <title data-test="distributed-tracing-page-title">
            {t('Tracing')}
          </title>
        </Helmet>
      </HelmetProvider>
      <Page>
        <PageSection variant="light">
          <Title headingLevel="h1"> {t('Tracing')} </Title>
        </PageSection>
        <PageSection variant="light">
          <label htmlFor="tempostack-dropdown">
            {t('Select a TempoStack')}
          </label>
          <TempoStackDropdown
            id="tempostack-dropdown"
            tempoStackOptions={tempoStackList2}
            selectedTempoList={tempoStack}
            selectedNamespace={namespace}
            setTempoList={setTempoStackInURL}
          />
          {tempoStackList2.find(
            (listItem) =>
              listItem.namespace === namespace &&
              listItem.name === tempoStack,
          ) && (
            <TextContent>
              <Text component="p">
                {t('You have selected')} {tempoStack}
              </Text>
            </TextContent>
          )}
          <PersesWrapper />
        </PageSection>
      </Page>
    </>
  );
}
