import React, { useContext } from 'react';

import UnauthenticatedDashboard from './UnauthenticatedDashboard';
import AuthenticatedDashboard from './AuthenticatedDashboard';
import { Context as CurrentUserContext } from './CurrentUserContext';

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
