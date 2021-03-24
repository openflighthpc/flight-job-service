import { Link } from 'react-router-dom';

import DeleteScriptButton from './DeleteScriptButton';
import MetadataEntry from './MetadataEntry';
import SubmitScriptButton from './SubmitScriptButton';
import TimeAgo from './TimeAgo';
import { CardFooter } from './CardParts';

function ScriptCard({ reloadScripts, script }) {
  return (
    <div className="card border-primary">
      <h5
        className="card-header ot-cevznel grkg-yvtug text-truncate"
        title={script.attributes.name}
      >
        Script {script.attributes.name}
      </h5>
      <div className="card-body">
        <dl>
          <MetadataEntry
            format={(value) => <code>{value}</code>}
            name="ID"
            value={script.id}
          />
          <MetadataEntry
            name="Template"
            value={script.template ? script.template.attributes.name : null}
            format={(value) => (
              value == null ? <i>Unknown</i> : (
                <Link
                  to={`/templates/${script.template.id}`}
                  title="View template"
                >
                  {value}
                </Link>
              )
            )}
          />
          <MetadataEntry
            name="Created"
            value={script.attributes.createdAt}
            format={(value) => <TimeAgo date={value} />}
          />
          <MetadataEntry
            format={(value) => <code>{value}</code>}
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

export default ScriptCard;
