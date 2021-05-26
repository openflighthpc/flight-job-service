import styles from './index.module.css';

function SubmissionFailureOutputCard({ job }) {
  const error = job.attributes.submitStderr;
  return (
    <div className="card">
      <h4 className="card-header">
        Error output
      </h4>
      <div className="card-body">
        <pre className={styles.PreCode}><code>{error}</code></pre>
      </div>
    </div>
  );
}

export default SubmissionFailureOutputCard;
