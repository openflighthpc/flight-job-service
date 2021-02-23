import { useContext } from 'react';

import { Context as CurrentUserContext, useLoginApi } from './CurrentUserContext';

export function useSignIn({ onError, onSuccess }) {
  const { actions: userActions } = useContext(CurrentUserContext);
  const { post, error, loading, response } = useLoginApi();

  async function signIn(data) {
    const responseBody = await post('/sign-in', { account: data});
    if (response.ok) {
      userActions.setUser(responseBody.user);
      typeof onSuccess === 'function' && onSuccess();
    } else {
      typeof onError === 'function' && onError(responseBody, response);
    }
  }

  return {
    signIn,
    error,
    loading,
  };
}

export function useSignOut() {
  const { actions: userActions } = useContext(CurrentUserContext);
  return userActions.signOut
}
