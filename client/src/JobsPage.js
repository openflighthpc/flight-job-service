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

import JobCard from './JobCard';
import { useFetchJobs } from './api';
import styles from './JobsPage.module.css';

function getJobsFromResponse(data) {
  const jobs = utils.getResourcesFromResponse(data);
  if ( jobs == null) { return null };

  jobs.forEach((job) => {
    if (!job.denormalized) {
      Object.defineProperty(job, 'denormalized', { value: true, writable: false });

      Object.keys(job.relationships || {}).forEach((relName) => {
        const relNeedle = job.relationships[relName].data;
        Object.defineProperty(
          job,
          relName,
          {
            get: function() {
              const haystack = data.included || [];
              return haystack.find((hay) => {
                return hay.type === relNeedle.type && hay.id === relNeedle.id;
              });
            },
          },
        );
      });
    }
  });

  return jobs;
}

function JobsPage() {
  const { data, error, loading, get } = useFetchJobs();

  if (error) {
    if (utils.errorCode(data) === 'Unauthorized') {
      return <UnauthorizedError />;
    } else {
      return <DefaultErrorMessage />;
    }
  } else {
    const jobs = getJobsFromResponse(data);
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
        { jobs != null && <JobsList reloadJobs={get} jobs={jobs} /> }
      </React.Fragment>
    );
  }
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

function JobsList({ reloadJobs, jobs }) {
  const sortedJobs = ( jobs || [] ).sort((a, b) => {
    const aName = a.attributes.createdAt;
    const bName = b.attributes.createdAt;
    if (aName < bName) {
      return -1;
    } else if (aName > bName) {
      return 1;
    } else {
      return 0
    }
  });
  if (jobs == null || !jobs.length) {
    return <NoJobsFound />;
  }

  const cards = sortedJobs.map(job => (
    <JobCard
      key={job.id}
      reloadJobs={reloadJobs}
      job={job}
    />
  ));

  return (
    <>
    <IntroCard jobs={jobs} />
    <div className={`card-deck ${styles.JobsList}`}>
      {cards}
    </div>
    </>
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
