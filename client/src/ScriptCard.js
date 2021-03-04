import DeleteScriptButton from './DeleteScriptButton';
import SubmitScriptButton from './SubmitScriptButton';
import { CardFooter } from './CardParts';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'long',
});
function timestampFormat(timestampFormat) {
  return dateFormatter.format(new Date(timestampFormat));
}

function ScriptCard({ reloadScripts, script }) {
  return (
    <div className="card border-primary">
      <h5
        className="card-header bg-primary text-light text-truncate"
        title={script.attributes.name}
      >
        {script.attributes.name}
      </h5>
      <div className="card-body">
        <dl>
          <MetadataEntry
            name="Template"
            value={script.template ? script.template.attributes.synopsis : 'Unknown'}
          />
          <MetadataEntry
            name="Created"
            value={script.attributes.createdAt}
            format={timestampFormat}
          />
          <MetadataEntry
            name="Located at"
            value={script.attributes.path}
          />
        </dl>
      </div>
      <CardFooter>
        <div className="btn-toolbar justify-content-center">
          <DeleteScriptButton
            className="mr-2"
            onDeleted={reloadScripts}
            script={script}
          />
          <SubmitScriptButton script={script} />
        </div>
      </CardFooter>
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

export default ScriptCard;
