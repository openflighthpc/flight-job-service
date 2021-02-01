import React from 'react';

import ClusterOverviewCard from './ClusterOverviewCard';
import Logo from './png_trans_logo.png';
import SignInCard from './SignInCard';

function UnauthenticatedDashboard() {
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
        To start creating job scripts sign in below.
      </p>

      <div className="card-deck">
        <ClusterOverviewCard />
        <SignInCard />
      </div>
    </div>
  );
}


export default UnauthenticatedDashboard;
