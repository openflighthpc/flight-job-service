import React from 'react';
import ReactDOM from 'react-dom';
import 'flight-webapp-components/dist/styles/page-transitions.css'
import 'flight-webapp-components/dist/styles/flight-webapp-components.css'
import 'flight-webapp-components/dist/styles/fullscreen.css'
import 'flight-webapp-components/dist/styles/utils.css'

import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
