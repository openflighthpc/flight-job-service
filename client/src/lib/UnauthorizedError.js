import React from 'react';

function UnauthorizedError() {
  return (
    <div className="card">
      <div className="card-body">
        <h3>Unauthorized</h3>
        <p>
          There was a problem authorizing your username and password.  Please
          check that they are entered correctly and try again.
        </p>
      </div>
    </div>
  );
}

export default UnauthorizedError;
