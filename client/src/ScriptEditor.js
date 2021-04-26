import AceEditor from 'react-ace';
import React from 'react';

import "ace-builds/src-noconflict/mode-markdown";
import "ace-builds/src-noconflict/theme-dracula.js";
import "ace-builds/src-noconflict/theme-chrome.js";

import styles from './index.module.css';

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
