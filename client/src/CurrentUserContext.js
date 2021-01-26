import React, { useMemo, useState } from 'react';

import useLocalStorage from './useLocalStorage';

const initialState = null;
const Context = React.createContext(initialState);

function getAuthToken({ username, password }) {
  return `Basic ${btoa(`${username}:${password}`)}`;
}

function Provider({ children }) {
  const [tempUser, doSetTempUser] = useState(null);
  const [currentUser, setCurrentUser] = useLocalStorage('currentUser', initialState);
  const actions = useMemo(
    () => ({
      setTempUser(username, password) {
        const basicAuthToken = getAuthToken({ username, password });
        doSetTempUser({ username, authToken: basicAuthToken });
      },

      promoteUser(user) {
        setCurrentUser(user);
        doSetTempUser(null);
      },

      signOut() {
        window.dispatchEvent(new CustomEvent('signout'));
        setCurrentUser(null);
        doSetTempUser(null);
      },
    }),
    [ setCurrentUser ],
  );

  return (
    <Context.Provider value={{ currentUser: currentUser, tempUser, actions }}>
      {children}
    </Context.Provider>
  );
}

export {
  Context,
  Provider,
}
