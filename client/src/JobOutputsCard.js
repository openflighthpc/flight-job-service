import React from 'react';
import classNames from 'classnames';
import { Button, ButtonToolbar, ListGroup, ListGroupItem } from 'reactstrap';
import { useState } from 'react';

import {
  DefaultErrorMessage,
  Overlay,
  OverlayContainer,
  Spinner,
  utils,
} from 'flight-webapp-components';

import humanFileSize from './humanFileSize';
import styles from './index.module.css';
import { mimeTypeToIcon } from './mimeType';
import {
  useFetchStdoutFile,
  useFetchStderrFile,
  useFetchResultFiles,
  useFetchFileContent,
} from './api';


export function getResourceFromResponse(data) {
  if (!utils.isObject(data)) { return null; }
  return data.data;
}

function JobOutputsCard({ job }) {
  const [selectedFile, setSelectedFile] = useState(null);

  function toggleFile(file) {
    selectedFile === file ? setSelectedFile(null) : setSelectedFile(file)
  }
  function isSelected(file) {
    return selectedFile != null && selectedFile.id === file.id;
  }

  // const hasFiles = resultFiles.length > 0 || job.stdoutFile || job.stderrFile;
  const hasFiles = true;

  return (
    <div className="card">
      <div className="card-header d-flex flex-row justify-content-between">
        <h4 className="mb-0">Output and results</h4>
      </div>
      <div className="card-body">
        <h6 className="font-weight-bold">Job script output</h6>
        <OutputListingAsync
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
        <ResultsListingAsync
          className="ml-4 mb-3"
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

function OutputListingAsync({ className, isSelected, job, toggleFile }) {
  const { data: stdoutData, error: stdoutErr, loading: stdoutLoading } =
    useFetchStdoutFile(job.id);
  const { data: stderrData, error: stderrErr, loading: stderrLoading } =
    useFetchStderrFile(job.id);

  if (stdoutErr || stderrErr) {
    return <DefaultErrorMessage />;
  } else {
    const stdoutFile = getResourceFromResponse(stdoutData);
    const stderrFile = getResourceFromResponse(stderrData);

    return (
      <React.Fragment>
        { (stdoutLoading || stderrLoading) && <Loading text="Loading job output files..." /> }
        <OutputListing
          className={className}
          isSelected={isSelected}
          job={job}
          stderrFile={stderrFile}
          stdoutFile={stdoutFile}
          toggleFile={toggleFile}
        />
      </React.Fragment>
    );
  }
}

function OutputListing({ className, isSelected, job, stdoutFile, stderrFile, toggleFile }) {
  const mergedStderr = job.attributes.mergedStderr;
  const files = [];
  if (stdoutFile) {
    files.push(stdoutFile);
  }
  if (!mergedStderr && stderrFile) {
    files.push(stderrFile);
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

function ResultsListingAsync({ className, isSelected, job, toggleFile }) {
  const { data, error, loading } = useFetchResultFiles(job.id);

  if (error) {
    return <DefaultErrorMessage />;
  } else {
    const files = utils.getResourcesFromResponse(data) || [];

    return (
      <React.Fragment>
        { loading && <Loading text="Loading job results..." /> }
        <ResultsListing
          className={className}
          isSelected={isSelected}
          job={job}
          files={files}
          toggleFile={toggleFile}
        />
      </React.Fragment>
    );
  }
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

function Loading({ text }) {
  return (
    <OverlayContainer>
      <Overlay>
        <Spinner text={text} />
      </Overlay>
    </OverlayContainer>
  );
}

export default JobOutputsCard;
