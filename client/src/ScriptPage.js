import { Col, Row } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { useRef } from 'react';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
} from 'flight-webapp-components';

import ScriptContentCard from './ScriptContentCard';
import ScriptMetadataCard from './ScriptCard';
import ScriptNotesCard from './ScriptNotesCard';
import { useFetchScript } from './api';

function ScriptPage() {
  const { id } = useParams();
  const ref = useRef(id);
  const { data, error, loading } = useFetchScript(ref.current);

  if (loading) {
    return <Loading id={ref.current} />;
  } else if (error) {
    return <DefaultErrorMessage />;
  } else {
    const script = data.data;
    if ( script == null) {
      return <DefaultErrorMessage />;
    } else {
      return (
        <Row>
          <Col md={12} lg={6}>
            <ScriptMetadataCard script={script} />
            <ScriptContentCard className="mt-4" script={script} />
          </Col>
          <Col md={12} lg={6}>
            <ScriptNotesCard script={script} />
          </Col>
        </Row>
      );
    }
  }
}

function Loading({ id }) {
  return (
    <Overlay>
      <Spinner text="Loading script..." />
    </Overlay>
  );
}

export default ScriptPage;
