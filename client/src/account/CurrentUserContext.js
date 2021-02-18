import React, { useEffect, useMemo, useState } from 'react';
import useFetch from 'use-http';

const initialState = null;
const Context = React.createContext(initialState);

function Provider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const { get, del, response } = useFetch(
    process.env.REACT_APP_SSO_BASE_URL,
    {
      headers: { Accept: 'application/json' },
      credentials: 'include',
    },
  );

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
