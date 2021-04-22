import 'highlight.js/styles/solarized-dark.css';
import bash from 'highlight.js/lib/languages/bash';
import classNames from 'classnames';
import hljs from 'highlight.js/lib/core';
import { DefaultErrorMessage, Spinner, utils } from 'flight-webapp-components';
import { useEffect, useRef } from 'react';

import styles from './index.module.css';
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

// Scroll the given element into view without scrolling the document.
function scrollIntoView(element) {
  if (element.scrollIntoView == null) { return; }

  const docScroll = document.scrollingElement ?
    document.scrollingElement :
    document.html;
  const initialScrollTop = docScroll.scrollTop;

  element.scrollIntoView();
  docScroll.scrollTo(0, initialScrollTop);
}

export function RenderedContent({ content }) {
  const contentRef = useRef(null);
  useEffect(() => {
    if (contentRef.current) {
      hljs.highlightElement(contentRef.current, { language: 'bash' });
      if (Array.from != null) {
        const magicRegExp = /^# *>{4,}.*WORKLOAD/;
        const comments = contentRef.current.querySelectorAll('.hljs-comment');
        const workloadComment = Array.from(comments)
          .find(span => span.textContent.match(magicRegExp));
        if (workloadComment != null) {
          scrollIntoView(
            workloadComment.previousElementSibling ?
              workloadComment.previousElementSibling :
              workloadComment
          );
        }
      }
    }
  });

  if (content == null || content === "") {
    return <em>The selected script does not have any content.</em>;
  }
  return (
    <pre
      className={classNames(styles.PreCode, styles.ScriptContent)}
    >
      <code ref={contentRef}>{content}</code>
    </pre>
  );
}

export default ScriptContentCard;
