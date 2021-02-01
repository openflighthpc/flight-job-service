import React, { useContext } from 'react';
import useFetch from 'use-http';

import Spinner from './Spinner';
import { DefaultErrorMessage } from './ErrorBoundary';
import { isObject } from './utils';

const initialState = null;
const Context = React.createContext(initialState);

function Provider({ children }) {
  const { error, loading, data, } = useFetch(
    process.env.REACT_APP_BRANDING_FILE,
    []
  );

  if (loading) {
    return <Spinner text="Loading..." />;
  } else if (error && error.message === "Not Found") {
    return (
      <Context.Provider value={null}>
        {children}
      </Context.Provider>
    );
  } else if (error) {
    return <DefaultErrorMessage />;
  } else {
    return (
      <Context.Provider value={data}>
        {children}
      </Context.Provider>
    );
  }
}

function useBranding() {
  const branding = useContext(Context);
  return lookup;

  function lookup(dottedKey) {
    const keys = dottedKey.split('.');
    return keys.reduce(
      (accum, key) => {
        if (isObject(accum)) {
          return accum[key];
        } else {
          return null;
        }
      },
      branding,
    );
  }
}

export {
  Context,
  Provider,
  useBranding,
}
