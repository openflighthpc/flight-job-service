import { useState } from "react";
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';

import MetadataEntry from './MetadataEntry';
import ScriptActions from './ScriptActions';
import TimeAgo from './TimeAgo';
import { RenderedNotesForScript } from './ScriptSummary';
import ScriptNotesEditor from './ScriptNotesEditor';

function ScriptMetadataCard({ reloadScripts, script }) {
  return (
    <div className="card">
      <div className="card-header d-flex flex-row justify-content-between">
        <h4
          className="text-truncate mb-0"
          title={script.attributes.name}
        >
          {script.attributes.name}
        </h4>
        <ScriptActions
          className="h-100"
          includeLink={false}
          reloadScripts={reloadScripts}
          script={script}
        />
      </div>
      <div className="card-body d-flex flex-row flex-wrap">
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
    </div>
  );
}

function ScriptNotesCard({ script }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="card">
      <div className="card-header d-flex flex-row justify-content-between">
        <h4 className="mb-0">Notes</h4>
        <Button
          color="primary"
          size="sm"
          onClick={() => setEditing(!editing)}
        >
          <i className="fa fa-edit mr-1"></i>
          Edit
        </Button>
      </div>
      <div className="card-body">
        {
          editing ?
            <ScriptNotesEditor script={script} /> :
            <RenderedNotesForScript script={script} />
        }
      </div>
    </div>
  );
}

export {
  ScriptNotesCard,
};
export default ScriptMetadataCard;
