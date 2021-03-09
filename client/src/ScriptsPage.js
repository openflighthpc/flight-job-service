import React from 'react';
import { Link } from "react-router-dom";

import {
  DefaultErrorMessage,
  Overlay,
  OverlayContainer,
  Spinner,
  UnauthorizedError,
  utils,
} from 'flight-webapp-components';

import ScriptsTable from './ScriptsTable';
import styles from './ScriptsPage.module.css';
import { useFetchScripts } from './api';

function getScriptsFromResponse(data) {
  const scripts = utils.getResourcesFromResponse(data);
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
    if (utils.errorCode(data) === 'Unauthorized') {
      return <UnauthorizedError />;
    } else {
      return <DefaultErrorMessage />;
    }
  } else {
    const scripts = getScriptsFromResponse(data);
    return (
      <React.Fragment>
        {
          loading && (
            <OverlayContainer>
              <Overlay>
                <Spinner text="Loading scripts..."/>
              </Overlay>
            </OverlayContainer>
          )
        }
        { scripts != null && <Layout reloadScripts={get} scripts={scripts} /> }
      </React.Fragment>
    );
  }
}

function Layout({ reloadScripts, scripts }) {
  if (scripts == null || !scripts.length) {
    return <NoScriptsFound />;
  }

  return (
    <React.Fragment>
      <IntroCard scripts={scripts} />
      <ScriptsTable reloadScripts={reloadScripts} scripts={scripts} />
    </React.Fragment>
  );
}

function NoScriptsFound() {
  return (
    <div>
      <p>
        No scripts found.  You may want to <Link to="/templates">create a
          new script</Link>.
      </p>
    </div>
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
