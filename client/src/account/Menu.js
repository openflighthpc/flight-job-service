import React, { useContext } from 'react';

import { Context as CurrentUserContext } from './CurrentUserContext';

import SignedIn from './SignedIn';
import SignedOut from './SignedOut';

export default function AccountMenu() {
  const { currentUser } = useContext(CurrentUserContext);

  if (currentUser) {
    return <SignedIn currentUser={currentUser} />;
  }
  return <SignedOut />;
}
