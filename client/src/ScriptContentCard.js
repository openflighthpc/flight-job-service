import 'highlight.js/styles/solarized-dark.css';
import bash from 'highlight.js/lib/languages/bash';
import classNames from 'classnames';
import hljs from 'highlight.js/lib/core';
import { DefaultErrorMessage, Spinner, utils } from 'flight-webapp-components';
import { useEffect, useRef } from 'react';

import styles from './JobCard.module.css';
import {useFetchScriptContent} from './api';

hljs.registerLanguage('bash', bash);

function getContentFromResponse(data) {
  if (!utils.isObject(data)) { return null; }
  if (!utils.isObject(data.data)) { return null; }
  if (!utils.isObject(data.data.attributes)) { return null; }
  return data.data.attributes.payload;
}

function ScriptContentCard({ className, script }) {
  return (
    <div className={classNames("card", className)} >
      <div className="card-header d-flex flex-row justify-content-between">
        <h4 className="mb-0">Content</h4>
      </div>
      <div className="card-body">
        <RenderedContentForScript script={script} />
      </div>
    </div>
  );
}

export function RenderedContentForScript({ script }) {
  if (script.content == null) {
    return <RenderedAsyncContentForScript script={script} />;
  }


  return <RenderedContent content={script.content.attributes.payload} />;
}

export function RenderedAsyncContentForScript({ script }) {
  const { data, error, loading } = useFetchScriptContent(script);
  if (loading) {
    return <Spinner center="none" text="Loading script content..."/>;
  }
  if (error) {
    return <DefaultErrorMessage />;
  }

  return <RenderedContent content={getContentFromResponse(data)} />;
}

export function RenderedContent({ content }) {
  const contentRef = useRef(null);
  useEffect(() => {
    if (contentRef.current) {
      hljs.highlightElement(contentRef.current, { language: 'bash' });
    }
  });

  if (content == null || content === "") {
    return <em>The selected script does not have any content.</em>;
  }
  return (
    <pre className={styles.PreCode}><code ref={contentRef}>{content}</code></pre>
  );
}

export default ScriptContentCard;
