import React from 'react';

import ClusterOverview from './ClusterOverview';
import { DashboardLogo } from './Branding';

function UnauthenticatedDashboard() {
  return (
    <div>
      <DashboardLogo />
      <p>
        The Flight Job Script Service allows you to create customized job
        scripts from predefined templates by answering a few simple questions.
      </p>

      <p>
        To start creating job scripts sign in below.
      </p>

      <div className="card-deck">
        <ClusterOverview />
      </div>
    </div>
  );
}


export default UnauthenticatedDashboard;
