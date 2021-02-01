import React, { useContext } from 'react';
import { Provider } from 'use-http';

import { Context as ConfigContext } from './ConfigContext';
import { Context as CurrentUserContext } from './CurrentUserContext';

function FetchProvider({ children, cachePolicy }) {
  const { apiRootUrl } = useContext(ConfigContext);
  const { currentUser } = useContext(CurrentUserContext);
  const options = {
    // We can't make use of the cache until it is possible to clear it when
    // the user signs out.
    //
    // cachePolicy: cachePolicy || 'cache-first',
    // cacheLife: 1 * 60 * 1000,  /* 1 minute in milliseconds. */
    cachePolicy: 'no-cache',
    cacheLife: 0,
    interceptors: {
      // Options can be modified and must be returned.
      request: async ({ options }) => {
        if (currentUser) {
          if (options.headers == null) { options.headers = {}; }
          options.headers.Authorization = currentUser.authToken;
        }
        return options;
      },
    },
  };

  return (
    <Provider
      options={options}
      url={apiRootUrl}
    >
      {children}
    </Provider>
  );
}


export default FetchProvider;
