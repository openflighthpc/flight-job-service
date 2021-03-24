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

function ScriptsPage() {
  const { data, error, loading, get } = useFetchScripts();

  if (error) {
    if (utils.errorCode(data) === 'Unauthorized') {
      return <UnauthorizedError />;
    } else {
      return <DefaultErrorMessage />;
    }
  } else {
    const scripts = data == null ? null : data.data ;
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
