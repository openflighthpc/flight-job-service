import { useParams } from 'react-router-dom';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
} from 'flight-webapp-components';

import JobCard from './JobCard';
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
        <JobCard job={job} />
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
