import classNames from 'classnames';
import { Badge } from 'reactstrap';
import { Link } from 'react-router-dom';

import MetadataEntry from './MetadataEntry';
import TimeAgo from './TimeAgo';
import styles from './JobCard.module.css';
import { stateColourMap } from './utils';

function JobCard({ reloadJobs, job }) {
  const colour = stateColourMap[job.attributes.state];
  const outputMerged = job.attributes.stdoutPath === job.attributes.stderrPath;

  return (
    <div
      className={classNames("card", `border-${colour}`)}
    >
      <h5
        className="card-header text-truncate justify-content-between d-flex"
        title={job.script ? job.script.attributes.name : 'Unknown'}
      >
        <span>
          Job <code>{job.id}</code>
        </span>
        <span>
          <Badge color={colour}>{job.attributes.state}</Badge>
        </span>
      </h5>
      <div className={classNames("card-body", styles.JobCardBody)}>
        <dl className={styles.MetadataEntryDL}>
          <MetadataEntry
            format={(value) => <code>{value}</code>}
            name="ID"
            value={job.id}
          />
          <MetadataEntry
            name="Scheduler ID"
            value={job.attributes.schedulerId}
            format={(value) => (
              value == null ? <span>&mdash;</span> : <code>{value}</code>
            )}
          />
          <MetadataEntry
            format={(value) => <Badge color={colour}>{value}</Badge>}
            name="State"
            value={job.attributes.state}
          />
          <MetadataEntry
            name="Script"
            value={job.script ? job.script.attributes.name : null}
            format={(value) => (
              value == null ? <i>Unknown</i> : (
                <Link
                  to={`/scripts/${job.script.id}`}
                  title="View script"
                >
                  {value}
                </Link>
              )
            )}
          />
          <MetadataEntry
            name="Submitted"
            value={job.attributes.createdAt}
            format={(value) => <TimeAgo date={value} />}
          />
          <MetadataEntry
            format={(value) => <TimeAgo date={value} />}
            hideWhenNull
            name="Started"
            value={job.attributes.startTime}
          />
          <MetadataEntry
            format={(value) => <TimeAgo date={value} />}
            hideWhenNull
            name="Completed"
            value={job.attributes.endTime}
          />
          <MetadataEntry
            format={(value) => <code>{value}</code>}
            hideWhenNull
            name={outputMerged ? "Output file" : "Standard output"}
            value={job.attributes.stdoutPath}
          />
          <MetadataEntry
            format={(value) => <code>{value}</code>}
            hideWhenNull
            name="Standard error"
            value={outputMerged ?  null : job.attributes.stderrPath}
          />
        </dl>
        <ErrorOutput job={job} />
      </div>
    </div>
  );
}

function ErrorOutput({ job }) {
  const failedStates = ['FAILED', 'TERMINATED'];
  if (!failedStates.includes(job.attributes.state)) {
    return null;
  }
  const error = job.attributes.schedulerId == null ?
    job.attributes.submitStderr :
    job.attributes.reason;
  return (
    <div className={styles.ErrorOutput}>
      <span className="font-weight-bold">
        Error output
      </span>
      <pre className={styles.PreCode}><code>{error}</code></pre>
    </div>
  );
}

export default JobCard;
