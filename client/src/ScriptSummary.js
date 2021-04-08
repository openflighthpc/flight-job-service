import ReactMarkdown from 'react-markdown'

import { DefaultErrorMessage, Spinner, utils } from 'flight-webapp-components';

import ScriptActions from './ScriptActions';
import {useFetchScriptNotes} from './api';

function getNoteFromResponse(data) {
  if (!utils.isObject(data)) { return null; }
  if (!utils.isObject(data.data)) { return null; }
  if (!utils.isObject(data.data.attributes)) { return null; }
  return data.data.attributes.payload;
}

function ScriptSummary({ reloadScripts, script }) {
  const header = script == null ?
    <h4 className="mb-0"> </h4> :
    <h4 className="mb-0">{script.id}</h4>;
  const actions = script == null ?
    <ScriptActions.Disabled className="h-100" /> :
    <ScriptActions
      className="h-100"
      reloadScripts={reloadScripts}
      script={script}
    />;

  return (
    <div className="card">
      <div className="card-header d-flex flex-row justify-content-between">
        {header}
        {actions}
      </div>
      <div className="card-body">
        {
          script == null ?
            "Select a script form the table to view its notes." :
            <ScriptNotes script={script} />
        }
      </div>
    </div>
  );
}

export function ScriptNotes({ script }) {
  const { data, error, loading } = useFetchScriptNotes(script);
  if (loading) {
    return <Spinner center="none" text="Loading script notes..."/>;
  }
  if (error) {
    return <DefaultErrorMessage />;
  }

  let notes = getNoteFromResponse(data);
  if (notes == null || notes === "") {
    return <em>The selected script does not have any notes.</em>;
  }
  return <ReactMarkdown>{notes}</ReactMarkdown>;
}

export function ScriptNotesPlaceholder() {
  return (
    <div>
      Select a script from the table to view its notes.
    </div>
  );
};

export default ScriptSummary;
