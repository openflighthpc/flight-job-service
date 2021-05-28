import React from 'react';
import { Col, Row } from 'reactstrap';
import { useParams } from 'react-router-dom';
import { useRef } from 'react';

import {
  DefaultErrorMessage,
  Overlay,
  OverlayContainer,
  Spinner,
} from 'flight-webapp-components';

import JobMetadataCard from './JobMetadataCard';
import JobOutputsCard from './JobOutputsCard';
import SubmissionFailureOutputCard from './SubmissionFailureOutputCard';
import { useFetchJob } from './api';
import { useInterval } from './utils';

function JobPage() {
  const { id } = useParams();
  const ref = useRef(id);
  const { data, error, loading, get } = useFetchJob(ref.current);
  useInterval(get, 1 * 60 * 1000);

  if (error) {
    return <DefaultErrorMessage />;
  } else {
    const job = data == null ? null : data.data;
    return (
      <React.Fragment>
        { loading && <Loading /> }
        { job != null && <Layout job={job} loading={loading} /> }
      </React.Fragment>
    );
  }
}

function Loading() {
  return (
    <OverlayContainer>
      <Overlay>
        <Spinner text="Loading job..."/>
      </Overlay>
    </OverlayContainer>
  );
}

function Layout({ job, loading }) {
  if (job == null && !loading) {
    return <DefaultErrorMessage />;
  }
  const submissionFailed = job.attributes.submitStatus !== 0;

  return (
    <>
    <Row>
      <Col md={12} lg={5}>
        <JobMetadataCard job={job} />
      </Col>
      <Col md={12} lg={7}>
        {
          submissionFailed ?
            <SubmissionFailureOutputCard job={job} /> :
            <JobOutputsCard job={job} />
        }
      </Col>
    </Row>
    </>
  );
}

export default JobPage;
