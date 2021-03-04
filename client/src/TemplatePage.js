import { useParams } from 'react-router-dom';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
} from 'flight-webapp-components';

import TemplateCard from './TemplateCard';
import { useFetchTemplate } from './api';

function TemplatePage() {
  const { id } = useParams();
  const { data, error, loading } = useFetchTemplate(id);

  if (loading) {
    return <Loading id={id} />;
  } else if (error) {
    return <DefaultErrorMessage />;
  } else {
    const template = data.data;
    if ( template == null) {
      return <DefaultErrorMessage />;
    } else {
      return (
        <TemplateCard template={template} />
      );
    }
  }
}

function Loading({ id }) {
  return (
    <Overlay>
      <Spinner text="Loading template..." />
    </Overlay>
  );
}

export default TemplatePage;
