import { useParams } from 'react-router-dom';

import {
  DefaultErrorMessage,
  Overlay,
  Spinner,
  utils,
} from 'flight-webapp-components';

import JobCard from './JobCard';
import { useFetchJob } from './api';
// import styles from './JobsPage.module.css';

function JobPage() {
  const { id } = useParams();
  const { data, error, loading } = useFetchJob(id);

  if (loading) {
    return <Loading id={id} />;
  } else if (error) {
    return <DefaultErrorMessage />;
  } else {
    const questions = utils.getResourcesFromResponse(data);
    if ( questions == null) {
      return <DefaultErrorMessage />;
    } else {
      return (
        <JobCard
          templateId={id}
          questions={data.data}
        />
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
