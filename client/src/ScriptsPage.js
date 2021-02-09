import React from 'react';

import Overlay, { OverlayContainer } from './Overlay';
import ScriptCard from './ScriptCard';
import Spinner from './Spinner';
import UnauthorizedError from './UnauthorizedError';
import { DefaultErrorMessage } from './ErrorBoundary';
import { errorCode, getResourcesFromResponse } from './utils';
import { useFetchScripts } from './api';
import styles from './ScriptsPage.module.css';

function getScriptsFromResponse(data) {
  const scripts = getResourcesFromResponse(data);
  if ( scripts == null) { return null };

  scripts.forEach((script) => {
    if (!script.denormalized) {
      Object.defineProperty(script, 'denormalized', { value: true, writable: false });

      Object.keys(script.relationships || {}).forEach((relName) => {
        const relNeedle = script.relationships[relName].data;
        Object.defineProperty(
          script,
          relName,
          {
            get: function() {
              const haystack = data.included || [];
              return haystack.find((hay) => {
                return hay.type === relNeedle.type && hay.id === relNeedle.id;
              });
            },
          },
        );
      });
    }
  });

  return scripts;
}

function ScriptsPage() {
  const { data, error, loading, get } = useFetchScripts();

  if (error) {
    if (errorCode(data) === 'Unauthorized') {
      return <UnauthorizedError />;
    } else {
      return <DefaultErrorMessage />;
    }
  } else {
    const scripts = getScriptsFromResponse(data);
    if (scripts == null) {
      return <DefaultErrorMessage />;
    } else {
      return (
        <React.Fragment>
          {
            loading && (
              <OverlayContainer>
                <Overlay>
                  <Spinner text="Loading desktops..."/>
                </Overlay>
              </OverlayContainer>
            )
          }
          { scripts != null && <ScriptsList reloadScripts={get} scripts={scripts} /> }
        </React.Fragment>
      );
    }
  }
}

function ScriptsList({ reloadScripts, scripts }) {
  const sortedScripts = scripts.sort((a, b) => {
    const aName = a.attributes.name.toUpperCase();
    const bName = b.attributes.name.toUpperCase();
    if (aName < bName) {
      return -1;
    } else if (aName > bName) {
      return 1;
    } else {
      return 0
    }
  });

  const cards = sortedScripts.map(script => (
    <ScriptCard
      key={script.id}
      reloadScripts={reloadScripts}
      script={script}
    />
  ));

  return (
    <>
    <IntroCard scripts={scripts} />
    <div className={`card-deck ${styles.ScriptsList}`}>
      {cards}
    </div>
    </>
  );
}

function IntroCard({ scripts }) {
  const scriptOrScripts = scripts.length === 1 ? 'script' : 'scripts';

  return (
    <div className={`${styles.IntroCard} card card-body mb-4`}>
      <p className={`${styles.IntroCardText} card-text`}>
        You have {scripts.length} saved{' '}{scriptOrScripts}.  Use the
        {' '}<i>Submit</i> button to submit a script to your cluster.
      </p>
    </div>

  );
}

export default ScriptsPage;
