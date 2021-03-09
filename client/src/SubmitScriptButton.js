import classNames from 'classnames';
import { Button } from 'reactstrap';
import { useHistory } from 'react-router-dom';

import { useSubmitScript } from './api';
import { useToast } from './ToastContext';

function SubmitScriptButton({ className, script }) {
  const { addToast } = useToast();
  const history = useHistory();
  const { loading: submitting, post, response } = useSubmitScript(script);

  const submit = async () => {
    await post();
    if (response.ok) {
      const job = await response.json();
      history.push(`/jobs/${job.data.id}`);
    } else {
      addToast({
        body: (
          <div>
            Unfortunately there has been a problem submitting your job
            script.  Please try again and, if problems persist, help us to
            more quickly rectify the problem by contacting us and letting us
            know.
          </div>
        ),
        icon: 'danger',
        header: 'Failed to submit script',
      });
    }
  };

  const icon = submitting ? 'fa-spinner fa-spin' : 'fa-rocket';
  const text = submitting ? 'Submitting...' : 'Submit';

  return (
    <Button
      color="primary"
      onClick={submit}
      className={classNames(className, { 'disabled': submitting })}
      disabled={submitting}
      size="sm"
    >
      <i className={`fa ${icon} mr-1`}></i>
      <span>{text}</span>
    </Button>
  );
}

export default SubmitScriptButton;
