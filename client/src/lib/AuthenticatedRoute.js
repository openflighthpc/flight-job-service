import React, { useContext } from 'react';

import { Context as CurrentUserContext } from './account/CurrentUserContext';

function AuthenticatedRoute({ Redirect, Route, children, ...rest }) {
  const { currentUser } = useContext(CurrentUserContext);

  return (
    <Route {...rest} >
      {({ match, location, ...more }) => {
        if (currentUser == null) {
          return match == null ?
            null :
            <Redirect to={{ pathname: "/", state: { from: location } }} />;
        } else {
          return typeof children === 'function' ?
            children({ match, location, ...more }) :
            children;
        }
      }}
    </Route>
  );
}

export default AuthenticatedRoute;
