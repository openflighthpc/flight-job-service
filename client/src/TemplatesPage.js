import React from 'react';
import { Jumbotron } from 'reactstrap';

import TemplateCard from './TemplateCard';
import Overlay, { OverlayContainer } from './Overlay';
import Spinner from './Spinner';
import { errorCode, isObject } from './utils';
import UnauthorizedError from './UnauthorizedError';
import { DefaultErrorMessage } from './ErrorBoundary';
import { useFetchTemplates } from './api';
import { useMediaGrouping } from './useMedia';
import styles from './TemplatesPage.module.css';

function TemplatesPage() {
  const { data, error, loading } = useFetchTemplates();

  if (error) {
    if (errorCode(data) === 'Unauthorized') {
      return <UnauthorizedError />;
    } else {
      return <DefaultErrorMessage />;
    }
  } else {
    const templates = getResourceFromResponse(data);
    if (templates == null) {
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
          { templates != null && <TemplatesList templates={templates} /> }
        </React.Fragment>
      );
    }
  }
}

function TemplatesList({ templates }) {
  const { groupedItems: groupedTemplates } = useMediaGrouping(
    ['(min-width: 1200px)', '(min-width: 992px)', '(min-width: 768px)', '(min-width: 576px)'],
    [3, 2, 2, 1],
    1,
    templates,
  );
  const decks = groupedTemplates.map(
    (group, index) => (
      <div key={index} className="card-deck">
        {group.map((template) => <TemplateCard key={template.id} template={template} />)}
      </div>
    )
  );

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
      {decks}
    </React.Fragment>
  );
}

export default TemplatesPage;
