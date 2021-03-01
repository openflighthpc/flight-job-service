import React, { useContext } from 'react';

import { CurrentUserContext } from 'flight-webapp-components';

import UnauthenticatedDashboard from './UnauthenticatedDashboard';
import AuthenticatedDashboard from './AuthenticatedDashboard';

function Dashboard() {
  const { currentUser } = useContext(CurrentUserContext);

  if (currentUser == null) { 
    return (
      <UnauthenticatedDashboard />
    );
  } else {
    return (
      <AuthenticatedDashboard />
    );
  }
}


export default Dashboard;
