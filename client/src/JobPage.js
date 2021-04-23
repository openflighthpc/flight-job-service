import { Col, Row } from 'reactstrap';
import { useParams } from 'react-router-dom';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
} from 'flight-webapp-components';

import JobMetadataCard, { ErrorOutputCard } from './JobCard';
import { useFetchJob } from './api';

function JobPage() {
  const { id } = useParams();
  const { data, error, loading } = useFetchJob(id);

  if (loading) {
    return <Loading id={id} />;
  } else if (error) {
    return <DefaultErrorMessage />;
  } else {
    const job = data.data;
    if ( job == null) {
      return <DefaultErrorMessage />;
    } else {
      return (
        <Row>
          <Col md={12} lg={5}>
            <JobMetadataCard job={job} />
          </Col>
          <Col md={12} lg={7}>
            <ErrorOutputCard job={job} />
          </Col>
        </Row>
      );
    }
  }
}

function Loading({ id }) {
  return (
    <Overlay>
      <Spinner text="Loading job..." />
    </Overlay>
  );
}

export default JobPage;
