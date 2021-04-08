import classNames from 'classnames';
import { ButtonToolbar } from 'reactstrap';
import { Link } from "react-router-dom";

import DeleteScriptButton from './DeleteScriptButton';
import SubmitScriptButton from './SubmitScriptButton';

function ScriptActions({ className, includeLink=true, reloadScripts, script }) {
  const link = (
    <Link
      className="btn btn-link btn-sm"
      to={`/scripts/${script.id}`}
    >
      View script
    </Link>
  );

  return (
    <ButtonToolbar className={classNames(className)} >
      { includeLink ? link : null }
      <SubmitScriptButton
        className="mr-2"
        script={script}
      />
      <DeleteScriptButton
        onDeleted={reloadScripts}
        script={script}
      />
    </ButtonToolbar>
  );
}

function DisabledActions({ className, includeLink=true }) {
  const link = (
    <Link className="btn btn-link btn-sm disabled">
      View script
    </Link>
  );

  return (
    <ButtonToolbar className={classNames(className)} >
      { includeLink ? link : null }
      <SubmitScriptButton.Disabled className="mr-2" />
      <DeleteScriptButton.Disabled />
    </ButtonToolbar>
  );
}

ScriptActions.Disabled = DisabledActions;
export default ScriptActions;
