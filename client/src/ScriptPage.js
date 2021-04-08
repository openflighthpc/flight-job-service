import { Col, Row } from 'reactstrap';
import { useParams } from 'react-router-dom';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
} from 'flight-webapp-components';

import ScriptMetadataCard, { ScriptNotesCard } from './ScriptCard';
import { useFetchScript } from './api';

function ScriptPage() {
  const { id } = useParams();
  const { data, error, loading } = useFetchScript(id);

  if (loading) {
    return <Loading id={id} />;
  } else if (error) {
    return <DefaultErrorMessage />;
  } else {
    const script = data.data;
    if ( script == null) {
      return <DefaultErrorMessage />;
    } else {
      return (
        <Row>
          <Col>
            <ScriptMetadataCard script={script} />
          </Col>
          <Col>
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
