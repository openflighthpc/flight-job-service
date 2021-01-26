import { useContext, useEffect, useRef } from 'react';
import useFetch from 'use-http';

import { Context as CurrentUserContext } from './CurrentUserContext';

export function useSignIn({ onError }) {
  const {
    error,
    get,
    loading,
    response,
  } = useAuthCheck();
  const { tempUser, actions: userActions } = useContext(CurrentUserContext);

  useEffect(() => {
    async function stuff() {
      if (tempUser) {
        await get();
        if (response.ok) {
          userActions.promoteUser(tempUser);
        } else {
          typeof onError === 'function' && onError(response);
        }
      }
    }
    stuff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ tempUser ]);

  function startSignIn(inputs) {
    userActions.setTempUser(inputs.username, inputs.password);
  }

  return { error, loading, startSignIn };
}

function useAuthCheck() {
  const { tempUser } = useContext(CurrentUserContext);
  const tempUserRef = useRef(tempUser);

  useEffect(() => { tempUserRef.current = tempUser; }, [ tempUser ]);

  return useFetch(
    "/ping",
    {
      interceptors: {
        request: async ({ options }) => {
          if (tempUserRef.current) {
            if (options.headers == null) { options.headers = {}; }
            options.headers.Authorization = tempUserRef.current.authToken;
          }
          return options;
        },
      },
    });
}

// export function useLaunchSession() {
//   const request = useFetch(
//     "/cloudcmd",
//     {
//       method: 'post',
//       headers: {
//         Accept: 'application/json',
//         'Content-Type': 'application/json',
//       },
//       body: {
//       },
//       cachePolicy: 'no-cache',
//     });

//   return request;
// }
