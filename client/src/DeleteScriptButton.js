import {
  ConfirmedActionButton,
  utils,
} from './lib';
import { useDeleteScript } from './api';
import { useToast } from './ToastContext';

function DeleteScriptButton({
  className,
  onDelete=()=>{},
  onDeleted=()=>{},
  script,
}) {
  const id = `delete-script-${script.id}`;
  const { loading: deleting, del, response } = useDeleteScript(script);
  const { addToast } = useToast();
  const deleteScript = async () => {
    onDelete();
    try {
      const responseBody = await del();
      if (response.ok) {
        onDeleted();
      } else {
        addToast(deleteFailedToast({
          script: script,
          errorCode: utils.errorCode(responseBody),
        }));
      }
    } catch (e) {
      addToast(deleteFailedToast({
        script: script,
        errorCode: undefined,
      }));
    }
  };

  return (
    <ConfirmedActionButton
      act={deleteScript}
      acting={deleting}
      actingButtonText="Deleting..."
      buttonText="Delete"
      className={className}
      confirmationHeaderText="Confirm deletion"
      confirmationText={
        <p>
          Are you sure you want to delete this script?
        </p>
      }
      icon="fa-trash"
      id={id}
    />
  );
}

function deleteFailedToast({ script, errorCode }) {
  let body = (
    <div>
      Unfortunately there has been a problem deleting your script.  Please try
      again and, if problems persist, help us to more quickly rectify the
      problem by contacting us and letting us know.
    </div>
  );

  return {
    body,
    icon: 'danger',
    header: 'Failed to delete script',
  };
}

export default DeleteScriptButton;
