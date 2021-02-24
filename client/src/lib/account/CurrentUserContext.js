import React, { useEffect, useMemo, useState } from 'react';
import useFetch from 'use-http';

const initialState = null;
const Context = React.createContext(initialState);

const loginApiUrl = new URL(
  process.env.REACT_APP_LOGIN_API_BASE_URL,
  window.location.origin,
).toString();

export function useLoginApi() {
  return useFetch(
    loginApiUrl,
    {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    }
  );
}

function Provider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const { del, get, response } = useLoginApi();

  const actions = useMemo(
    () => ({
      setUser(user) {
        setCurrentUser({
          authToken: `Bearer ${user.authentication_token}`,
          name: user.name,
          username: user.username,
        });
      },

      signOut() {
        window.dispatchEvent(new CustomEvent('signout'));
        del('/sign-out');
        setCurrentUser(null);
      },
    }),
    [ del, setCurrentUser ],
  );

  useEffect(() => {
    async function getSession() {
      const responseBody = await get('/session');
      if (response.ok) {
        actions.setUser(responseBody.user);
      } else {
        setCurrentUser(null);
      }
    }
    getSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Context.Provider value={{ currentUser, actions }}>
      {children}
    </Context.Provider>
  );
}

export {
  Context,
  Provider,
}
