import classNames from 'classnames';
import { Button } from 'reactstrap';

import { CardFooter } from './CardParts';
import { useSubmitScript } from './api';
import { useToast } from './ToastContext';
import DeleteScriptButton from './DeleteScriptButton';

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full',
  timeStyle: 'long',
});
function timestampFormat(timestampFormat) {
  return dateFormatter.format(new Date(timestampFormat));
}

function ScriptCard({ reloadScripts, script }) {
  return (
    <div className="card border-primary mb-2">
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
          <SubmitButton script={script} />
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
      className="col-sm-4 text-truncate"
      title={name}
    >
      {name}
    </dt>
    <dd
      className="col-sm-8 text-truncate"
      title={valueTitle || formatted}
    >
      {formatted}
    </dd>
    </>
  );
}

function SubmitButton({ className, script }) {
  const { addToast } = useToast();
  const { loading: submitting, post, response } = useSubmitScript(script);

  const submit = () => {
    post().then(() => {
      if (response.ok) {
        response.text().then((scriptPath) => {
          addToast({
            body: (
              <div>
                Your job script has been submitted to the cluster.
              </div>
            ),
            icon: 'success',
            header: 'Job script submitted',
          });
        });
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
    });
  }

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

export default ScriptCard;
