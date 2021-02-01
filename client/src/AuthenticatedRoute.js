import React, { useContext } from 'react';
import { Redirect, Route } from "react-router-dom";

import { Context as CurrentUserContext } from './CurrentUserContext';

function AuthenticatedRoute({ children, ...rest }) {
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
