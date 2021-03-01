import React from 'react';
import { Jumbotron } from 'reactstrap';

import {
  DefaultErrorMessage,
  Overlay,
  OverlayContainer,
  Spinner,
  UnauthorizedError,
  utils,
} from 'flight-webapp-components';

import TemplateCard from './TemplateCard';
import { useFetchTemplates } from './api';
import styles from './TemplatesPage.module.css';

function TemplatesPage() {
  const { data, error, loading } = useFetchTemplates();

  if (error) {
    if (utils.errorCode(data) === 'Unauthorized') {
      return <UnauthorizedError />;
    } else {
      return <DefaultErrorMessage />;
    }
  } else {
    const templates = utils.getResourcesFromResponse(data);
    return (
      <React.Fragment>
        {
          loading && (
            <OverlayContainer>
              <Overlay>
                <Spinner text="Loading templates..."/>
              </Overlay>
            </OverlayContainer>
          )
        }
        { <TemplateCardDeck templates={templates || []} /> }
      </React.Fragment>
    );
  }
}

function TemplateCardDeck({ templates }) {
  const sortedTemplates = templates.sort((a, b) => {
    const aSynopsis = a.attributes.synopsis.toUpperCase();
    const bSynopsis = b.attributes.synopsis.toUpperCase();
    if (aSynopsis < bSynopsis) {
      return -1;
    } else if (aSynopsis > bSynopsis) {
      return 1;
    } else {
      return 0
    }
  });

  const cards = sortedTemplates.map(template => (
    <TemplateCard
      key={template.id}
      template={template}
    />
  ));

  return (
    <React.Fragment>
      <Jumbotron className={`${styles.Jumbotron} bg-white py-4`}>
        <h1>
          Create a job script from a template
        </h1>
        <ul>
          <li>Select a job script template from the list below.</li>
          <li>Click "Create script".</li>
          <li>Answer the questions.</li>
          <li>Download your customized script.</li>
          <li>Submit your script to the cluster's scheduler.</li>
        </ul>
      </Jumbotron>
      <div className={`card-deck ${styles.TemplateCardDeck}`}>
        {cards}
      </div>
    </React.Fragment>
  );
}

export default TemplatesPage;
