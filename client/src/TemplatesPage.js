import React from 'react';
import { Jumbotron } from 'reactstrap';

import {
  DefaultErrorMessage,
  Overlay,
  OverlayContainer,
  Spinner,
  UnauthorizedError,
  useMediaGrouping,
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
        <TemplateCardDeck templates={templates || []} />
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

  const { groupedItems: groupedTemplates } = useGrouping(sortedTemplates);
  const decks = groupedTemplates.map(
    (group, index) => (
      <div key={index} className="card-deck">
        {
          group.map((template) => {
            if (template == null) {
              // The `key` attribute is intentionally omitted.
              return <BlankCard />;
            } else {
            return <TemplateCard className="mb-2" key={template.id} template={template} />;
            }
          })
        }
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

function useGrouping(templates) {
  const { groupedItems, perGroup } = useMediaGrouping(
    ['(min-width: 1200px)', '(min-width: 992px)', '(min-width: 768px)', '(min-width: 576px)'],
    [2, 2, 1, 1],
    1,
    templates,
  );
  if (groupedItems.length) {
    const lastGroup = groupedItems[groupedItems.length - 1];
    if (lastGroup.length < perGroup) {
      const requiredBlanks = perGroup - lastGroup.length;
      for (let i=0; i<requiredBlanks; i++) {
        lastGroup.push(null);
      }
    }
  }
  return { groupedItems, perGroup };
}

function BlankCard() {
  return <div className="card invisible"></div>;
}

export default TemplatesPage;
