import AceEditor from 'react-ace';
import React from 'react';
import classNames from 'classnames';

import "ace-builds/src-noconflict/mode-sh";
import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-dracula.js";
import "ace-builds/src-noconflict/theme-chrome.js";

import styles from './index.module.css';

function startLine(content) {
  const magicRegExp = /^# *>{4,}.*WORKLOAD/;
  const workloadCommentIndex = content.split("\n")
    .findIndex(line => line.match(magicRegExp));
  if (workloadCommentIndex < 0) {
    return 1;
  }
  return workloadCommentIndex - 1;
}

export function ScriptEditor({ focus, name, onChange, readOnly, value }) {
  return (
    <AceEditor
      className={classNames(styles.AceEditor, { flight_ace_hidden_cursors: readOnly })}
      editorProps={{ $blockScrolling: true }}
      setOptions={{
        highlightGutterLine: !readOnly,
      }}
      cursorStart={startLine(value)}
      focus={focus}
      fontSize={14}
      mode="sh"
      name={name}
      onChange={onChange}
      readOnly={readOnly}
      highlightActiveLine={!readOnly}
      showGutter={true}
      theme="dracula"
      value={value}
      width="100%"
      height="40em"
      onLoad={(editor) => {
        const cursorStart = startLine(value);
        editor.moveCursorTo(cursorStart, 0);
        editor.scrollToLine(cursorStart);
      }}
      wrapEnabled={true}
    />
  );
}

export function ScriptNotesEditor({ focus, name, onChange, readOnly, value }) {
  return (
    <AceEditor
      className={styles.AceEditor}
      editorProps={{ $blockScrolling: true }}
      focus={focus}
      fontSize={14}
      mode="markdown"
      name={name}
      onChange={onChange}
      readOnly={readOnly}
      showGutter={false}
      theme="chrome"
      value={value}
      width="100%"
      height="40em"
      wrapEnabled={true}
    />
  );
}
