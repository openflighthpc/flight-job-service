import React, { useState } from 'react';
import { Link } from "react-router-dom";
import { Row, Col } from 'reactstrap';

import {
  DefaultErrorMessage,
  Overlay,
  OverlayContainer,
  Spinner,
  UnauthorizedError,
  utils,
} from 'flight-webapp-components';

import ScriptSummary from './ScriptSummary';
import ScriptsTable from './ScriptsTable';
import styles from './index.module.css';
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
  const [selectedScript, setSelectedScript] = useState(null);

  if (scripts == null || !scripts.length) {
    return <NoScriptsFound />;
  }

  return (
    <React.Fragment>
      <IntroCard scripts={scripts} />
      <div>
        <Row>
          <Col>
            <ScriptsTable
              onRowSelect={setSelectedScript}
              scripts={scripts}
            />
          </Col>
          <Col style={{ paddingTop: 'calc(38px + 16px)' }}>
            <ScriptSummary
              reloadScripts={reloadScripts}
              script={selectedScript}
            />
          </Col>
        </Row>
      </div>
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
    <div className={`${styles.IntroCard} ${styles.ScriptsIntroCard} card card-body mb-4`}>
      <p className={`${styles.IntroCardText} card-text`}>
        You have {scripts.length} saved{' '}{scriptOrScripts}.  Select a
        script from the table to view more details about it.
      </p>
    </div>

  );
}

export default ScriptsPage;
