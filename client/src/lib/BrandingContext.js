import React, { useContext } from 'react';
import useFetch from 'use-http';

import Spinner from './Spinner';
import { DefaultErrorMessage } from './ErrorBoundary';
import { isObject } from './utils';

function makeDataContext(url) {
  const initialState = null;
  const Context = React.createContext(initialState);

  return {
    Context,
    Provider,
    useData,
  };

  function Provider({ children }) {
    const { error, loading, data, } = useFetch(url, []);

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

  function useData() {
    const data = useContext(Context);
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
        data,
      );
    }
  }
}

const {
  Context: BrandingContext,
  Provider: BrandingProvider,
  useData: useBranding,
} = makeDataContext(process.env.REACT_APP_BRANDING_FILE);
const {
  Context: EnvironmentContext,
  Provider: EnvironmentProvider,
  useData: useEnvironment,
} = makeDataContext(process.env.REACT_APP_ENVIRONMENT_FILE);


export {
  BrandingContext,
  BrandingProvider,
  EnvironmentContext,
  EnvironmentProvider,
  useBranding,
  useEnvironment,
}
