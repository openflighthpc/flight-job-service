import React from 'react';

import Logo from './png_trans_logo.png';

function UnconfiguredDashboard() {
  return (
    <div>
      <img
        src={Logo}
        alt="OpenflightHPC Logo"
        className="center"
        width="100%"
      >
      </img>

      <p>
        The Flight Job Script Service allows you to create customized job
        scripts from predefined templates by answering a few simple questions.
      </p>

      <p>
        Before Flight Job Script Service can be used, it needs to be
        configured by your system administrator.  It can be configured by
        running:
      </p>

      <div className="card card-body">
        <pre className="mb-0">
          <code>
            flight service configure job-script-webapp
          </code>
        </pre>
      </div>
    </div>
  );
}


export default UnconfiguredDashboard;
