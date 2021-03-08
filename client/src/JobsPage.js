import React from 'react';
import { Link } from "react-router-dom";

import {
  DefaultErrorMessage,
  Overlay,
  OverlayContainer,
  Spinner,
  UnauthorizedError,
  utils,
} from 'flight-webapp-components';

import JobsTable from './JobsTable';
import styles from './JobsPage.module.css';
import { useFetchJobs } from './api';

// function getJobsFromResponse(data) {
//   const jobs = utils.getResourcesFromResponse(data);
//   if ( jobs == null) { return null };

//   jobs.forEach((job) => {
//     if (!job.denormalized) {
//       Object.defineProperty(job, 'denormalized', { value: true, writable: false });

//       Object.keys(job.relationships || {}).forEach((relName) => {
//         const relNeedle = job.relationships[relName].data;
//         Object.defineProperty(
//           job,
//           relName,
//           {
//             get: function() {
//               const haystack = data.included || [];
//               return haystack.find((hay) => {
//                 return hay.type === relNeedle.type && hay.id === relNeedle.id;
//               });
//             },
//           },
//         );
//       });
//     }
//   });

//   return jobs;
// }

function JobsPage() {
  const { data, error, loading, get } = useFetchJobs();

  console.log('data:', data);  // eslint-disable-line no-console
  console.log('error:', error);  // eslint-disable-line no-console
  console.log('loading:', loading);  // eslint-disable-line no-console

  if (error) {
    if (utils.errorCode(data) === 'Unauthorized') {
      return <UnauthorizedError />;
    } else {
      return <DefaultErrorMessage />;
    }
  } else {
    // const jobs = getJobsFromResponse(data);
    const jobs = data == null ? null : data.data ;
    return (
      <React.Fragment>
        {
          loading && (
            <OverlayContainer>
              <Overlay>
                <Spinner text="Loading jobs..."/>
              </Overlay>
            </OverlayContainer>
          )
        }
        { jobs != null && <Layout reloadJobs={get} jobs={jobs} /> }
      </React.Fragment>
    );
  }
}

function Layout({ reloadJobs, jobs }) {
  if (jobs == null || !jobs.length) {
    return <NoJobsFound />;
  }

  return (
    <React.Fragment>
      <IntroCard jobs={jobs} />
      <JobsTable reloadJobs={reloadJobs} jobs={jobs} />
    </React.Fragment>
  );
}

function NoJobsFound() {
  return (
    <div>
      <p>
        No jobs found.  You may want to <Link to="/scripts">submit a
          script</Link>.
      </p>
    </div>
  );
}

function IntroCard({ jobs }) {
  const jobOrJobs = jobs.length === 1 ? 'job' : 'jobs';

  return (
    <div className={`${styles.IntroCard} card card-body mb-4`}>
      <p className={`${styles.IntroCardText} card-text`}>
        You have {jobs.length} {jobOrJobs}.
      </p>
    </div>

  );
}

export default JobsPage;
