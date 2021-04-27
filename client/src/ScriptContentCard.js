import classNames from 'classnames';
import { Button } from 'reactstrap';
import { useState } from 'react';

import {useSaveScriptContent} from './api';
import { ScriptEditor } from './ScriptEditor';
import { useToast } from './ToastContext';

function buildContentResource(id, newContent) {
  return {
    data: {
      type: 'contents',
      id: id,
      attributes: {
        payload: newContent,
      }
    }
  };
}

function ScriptContentCard({ className, script }) {
  const content = script.content.attributes.payload;
  const [editing, setEditing] = useState(false);
  const [editorContent, setEditorContent] = useState(content);
  const { loading: saving, patch, response } = useSaveScriptContent(script.content);
  const { addToast } = useToast();

  const saveContent = async () => {
    try {
      await patch(buildContentResource(script.content.id, editorContent));
      if (response.ok) {
        setEditing(false);
      } else {
        throw new Error();
      }
    } catch (e) {
      addToast(saveFailedToast());
    }
  };


  return (
    <div className={classNames("card", className)} >
      <div className="card-header d-flex flex-row justify-content-between">
        <h4 className="mb-0">Content</h4>
        <EditSaveButton
          editing={editing}
          onEdit={() => setEditing(true)}
          onSave={() => saveContent()}
          saving={saving}
        />
      </div>
      <div className="card-body">
        <ScriptEditor
          focus={editing}
          name={script.id}
          onChange={setEditorContent}
          readOnly={!editing}
          value={editorContent}
        />
      </div>
    </div>
  );
}

function EditSaveButton({ editing, onEdit, onSave, saving }) {
  const color = editing ? 'success' : 'primary';
  const text = editing ? saving ? 'Saving' : 'Save' : 'Edit';
  const icon = editing ? saving ? 'fa-spinner fa-spin' : 'fa-save' : 'fa-edit';

  return (
    <Button
      color={color}
      disabled={saving}
      size="sm"
      onClick={editing ? onSave : onEdit}
    >
      <i className={`fa ${icon} mr-1`}></i>
      { text }
    </Button>
  );
}


function saveFailedToast() {
  let body = (
    <div>
      Unfortunately there has been a problem updating your script.  Please try
      again and, if problems persist, help us to more quickly rectify the
      problem by contacting us and letting us know.
    </div>
  );

  return {
    body,
    icon: 'danger',
    header: 'Failed to update script',
  };
}

export default ScriptContentCard;
