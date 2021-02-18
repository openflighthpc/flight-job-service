import { useContext } from 'react';
import useFetch from 'use-http';

import { Context as CurrentUserContext } from './CurrentUserContext';

export function useSignIn(onError) {
  const { actions: userActions } = useContext(CurrentUserContext);

  const { post, error, loading, response } = useFetch(
    process.env.REACT_APP_SSO_BASE_URL,
    {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    },
  );

  async function signIn(data) {
    const responseBody = await post('/sign-in', { account: data});
    if (response.ok) {
      userActions.setUser(responseBody.user);
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
