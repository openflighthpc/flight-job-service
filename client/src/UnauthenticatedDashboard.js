import React from 'react';

import { DashboardLogo } from 'flight-webapp-components';

import ClusterOverview from './ClusterOverview';

function UnauthenticatedDashboard() {
  return (
    <div>
      <DashboardLogo />
      <p>
        The Flight Job Script Service allows you to create customized job
        scripts from predefined templates by answering a few simple questions.
      </p>

      <p>
        To start creating job scripts you will need to login by clicking the
        "Log in" button above.
      </p>

      <div className="card-deck">
        <ClusterOverview />
      </div>
    </div>
  );
}


export default UnauthenticatedDashboard;
