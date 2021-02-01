import React from 'react';

import SignInForm from './SignInForm';

function SignInCard({ clusterName }) {
  return (
    <div className="card mb-2">
      <div className="card-body">
        <p>
          Sign in to your OpenFlightHPC environment account.
          You'll need your account username and password. Enter
          them below and click <i>Go!</i>.
        </p>
        <p>
          Contact your HPC administrator if you don't have these
          details or need a reminder.
        </p>
        <SignInForm />
      </div>
    </div>
  );
}

export default SignInCard;
