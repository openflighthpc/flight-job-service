import { useParams } from 'react-router-dom';
import { useRef } from 'react';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
} from 'flight-webapp-components';

import TemplateCard from './TemplateCard';
import { useFetchTemplate } from './api';

function TemplatePage() {
  const { id } = useParams();
  const ref = useRef(id);

  const { data, error, loading } = useFetchTemplate(ref.current);

  if (loading) {
    return <Loading id={ref.current} />;
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
