const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'long',
});
function timestampFormat(timestampFormat) {
  return dateFormatter.format(new Date(timestampFormat));
}

function JobCard({ reloadJobs, job }) {
  return (
    <div className="card border-primary">
      <h5
        className="card-header bg-primary text-light text-truncate"
        title={job.script ? job.script.attributes.name : 'Unknown'}
      >
        {job.script ? job.script.attributes.name : 'Unknown'}
      </h5>
      <div className="card-body">
        <dl>
          <MetadataEntry
            name="Script"
            value={job.script ? job.script.attributes.name : 'Unknown'}
          />
          <MetadataEntry
            name="Template"
            value={job.template ? job.template.attributes.synopsis : 'Unknown'}
          />
          <MetadataEntry
            name="Scheduler ID"
            value={
              job.attributes.schedulerId == null ?
                <span>&mdash;</span> :
                job.attributes.schedulerId
            }
          />
          <MetadataEntry
            name="Submitted at"
            value={job.attributes.createdAt}
            format={timestampFormat}
          />
          <MetadataEntry
            name="State"
            value={job.attributes.state}
          />
        </dl>
      </div>
    </div>
  );
}

function MetadataEntry({ name, value, format, valueTitle }) {
  if (value == null) {
    return null;
  }
  const formatted = typeof format === "function" ? format(value) : value;
  return (
    <>
    <dt
      className="text-truncate"
      title={name}
    >
      {name}
    </dt>
    <dd
      className="text-truncate"
      title={valueTitle || formatted}
    >
      {formatted}
    </dd>
    </>
  );
}

export default JobCard;
