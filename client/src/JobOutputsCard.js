import classNames from 'classnames';
import { Button, ButtonToolbar, ListGroup, ListGroupItem } from 'reactstrap';
import { useState } from 'react';

import { DefaultErrorMessage, Spinner, utils } from 'flight-webapp-components';

import humanFileSize from './humanFileSize';
import styles from './index.module.css';
import { mimeTypeToIcon } from './mimeType';
import { useFetchFileContent } from './api';

function JobOutputsCard({ job }) {
  const [selectedFile, setSelectedFile] = useState(null);

  function toggleFile(file) {
    selectedFile === file ? setSelectedFile(null) : setSelectedFile(file)
  }
  function isSelected(file) {
    return selectedFile != null && selectedFile.id === file.id;
  }

  const hasFiles = job.resultFiles.length > 0 || job.stdoutFile || job.stderrFile;

  return (
    <div className="card">
      <div className="card-header d-flex flex-row justify-content-between">
        <h4 className="mb-0">Output and results</h4>
      </div>
      <div className="card-body">
        <h6 className="font-weight-bold">Job script output</h6>
        <OutputListing
          className="ml-4 mb-3"
          isSelected={isSelected}
          job={job}
          toggleFile={toggleFile}
        />
        <h6
          className="d-flex flex-row align-items-center justify-content-between"
        >
          <span
            className="font-weight-bold"
            title={job.attributes.resultsDir}
          >
            Results directory
          </span>
          <OpenDirectoryButtons dir={job.attributes.resultsDir} />
        </h6>
        <ResultsListing
          className="ml-4 mb-3"
          files={job.resultFiles}
          isSelected={isSelected}
          job={job}
          toggleFile={toggleFile}
        />
        {
          hasFiles ?
            (
              <>
              <hr/>
              <FilePreview job={job} selectedFile={selectedFile} />
              </>
            ) :
            null
        }
      </div>
    </div>
  );
}

function FileItem({ file, isSelected, name, nameTag="span", toggleFile }) {
  const isViewable = file.attributes.mimeType.split('/')[0] === 'text';
  const isActive = isSelected(file);
  const NameTag = nameTag;

  return (
    <ListGroupItem
      className={classNames({ [styles.FileItemNonViewable]: !isViewable})}
      key={file.attributes.filename}
      active={isActive}
      action={isViewable}
      onClick={() => isViewable && toggleFile(file)}
      tag="a"
      href={isViewable ? '#' : null}
      title={isViewable ? null : 'Previewing files of this type is not supported.  To view the file, you can open the results directory in the File manager.'}
    >
      <span className="d-flex flex-row align-items-center justify-content-between">
        <span>
          <i
            className={classNames("mr-2 fa", mimeTypeToIcon(file.attributes.mimeType))}
            title={file.attributes.mimeType}
          ></i>
          <NameTag
            className={classNames({ [styles.FileItemActiveColor] : isActive })}
            title={file.attributes.path}
          >
            {name}
          </NameTag>
        </span>
        <span
          className={classNames("text-small",
            isActive ? styles.FileItemActiveColor : 'text-muted'
          )}
        >
          {humanFileSize(file.attributes.size, true, 1)}
        </span>
      </span>
    </ListGroupItem>
  );
}

function OutputListing({ className, isSelected, job, toggleFile }) {
  const mergedStderr = job.attributes.mergedStderr;
  const files = [];
  if (job.stdoutFile) {
    files.push(job.stdoutFile);
  }
  if (!mergedStderr && job.stderrFile) {
    files.push(job.stderrFile);
  }

  if (files.length === 0) {
    return (
      <div className={className}>
        The job's output files are not currently available.
      </div>
    );
  }

  return (
    <ListGroup className={className}>
      {
        files.map(file => (
          <FileItem
            key={file.id}
            file={file}
            isSelected={isSelected}
            name={
              file === job.stderrFile ?
                'Standard error' :
                mergedStderr ?
                'Standard output and error' :
                'Standard output'
            }
            toggleFile={toggleFile}
          />
        ))
      }
    </ListGroup>
  );
}

function ResultsListing({ className, files, isSelected, job, toggleFile }) {
  if (job.attributes.resultsDir == null) {
    <div className={className}>
      The job did not report its results directory.
    </div>
  }
  if (files.length === 0){
    return (
      <div className={className}>
        The job's result directory is empty or not currently available.
      </div>
    );
  }
  return (
    <ListGroup className={classNames(styles.ResultsListing, className)}>
      {
        files.map(file => (
          <FileItem
            key={file.id}
            file={file}
            isSelected={isSelected}
            name={file.attributes.relativePath}
            nameTag="code"
            toggleFile={toggleFile}
          />
        ))
      }
    </ListGroup>
  );
}

function getContentFromResponse(data) {
  if (!utils.isObject(data)) { return null; }
  if (!utils.isObject(data.data)) { return null; }
  if (!utils.isObject(data.data.attributes)) { return null; }
  return data.data.attributes.payload;
}

function FilePreview({selectedFile, job}) {
  if (selectedFile == null) {
    return (
      <div>
        <em>Select a text file above to preview its output.</em>
      </div>
    );
  }

  const filename = selectedFile === job.stdoutFile ?
    'standard output' :
    selectedFile === job.stderrFile ?
    'standard error' :
    selectedFile.attributes.relativePath;

  return (
    <>
    <h6 className="card-title font-weight-bold">
      Preview for <code>{filename}</code>
    </h6>
    <FileContent file={selectedFile} />
    </>
  );
}

function FileContent({ file }) {
  const { data, error, loading } = useFetchFileContent(file);

  if (loading) {
    return <Spinner center="none" text="Loading file..."/>;
  } else if (error) {
    return <DefaultErrorMessage />;
  }
  return (
    <pre className={classNames(styles.PreCode, styles.FileContent)}>
      <code>{getContentFromResponse(data)}</code>
    </pre>
  );
}

function OpenDirectoryButtons({ dir }) {
  if (dir == null) {
    return null;
  }
  return (
    <ButtonToolbar>
      <Button
        className="mr-2"
        color="primary"
        href={`/files/browse?dir=${dir}`}
        size="sm"
      >
        Open in file manager
      </Button>
      <Button
        color="primary"
        href={`/console/terminal?dir=${dir}`}
        size="sm"
      >
        Open in console
      </Button>
    </ButtonToolbar>
  );
}

export default JobOutputsCard;
