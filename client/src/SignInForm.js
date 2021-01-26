import React, { useEffect, useRef, useState } from 'react';

import { errorCode } from './utils';
import { useSignIn } from './api';
import { useToast } from './ToastContext';

const useForm = (callback) => {
  const [inputs, setInputs] = useState({});
  function handleSubmit(event) {
    if (event) {
      event.preventDefault();
    }
    callback(inputs);
  }
  function handleInputChange(event) {
    event.persist();
    setInputs(inputs => ({...inputs, [event.target.name]: event.target.value}));
  }
  return {
    handleSubmit,
    handleInputChange,
    inputs
  };
}


function SignInForm() {
  const { addToast } = useToast();
  const { loading, startSignIn } = useSignIn({ onError: showToast });
  const { handleSubmit, handleInputChange, inputs } = useForm(startSignIn);
  const removeToastRef = useRef(null);

  async function showToast(response) {
    let code;
    try {
      code = errorCode(await response.json());
    } catch (e) {
      code = 'unexpected';
    }
    const { removeToast } = addToast(
      loginErrorToast({ errorCode: code })
    );
    removeToastRef.current = removeToast;
  }

  useEffect(
    () => { if (loading && removeToastRef.current) { removeToastRef.current(); } },
    [loading, removeToastRef]
  );

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          className="form-control"
          id="username"
          name="username"
          onChange={handleInputChange}
          placeholder="Enter username"
          required
          type="text"
          value={inputs.username == null ? "" : inputs.username}
        />
        <input
          className="form-control"
          id="password"
          name="password"
          onChange={handleInputChange}
          placeholder="Enter password"
          required
          type="password"
          value={inputs.password == null ? "" : inputs.password}
        />
        <div className="input-group-append">
          <button
            className="btn btn-primary"
            disabled={loading}
            id="go"
            style={{ minWidth: '52px' }}
            type="submit"
          >
            {
              loading ?
                <i className="fa fa-spinner fa-spin mr-1"></i> :
                'Go!'
            }
          </button>
        </div>
      </div>
    </form>
  );
}

function loginErrorToast({ errorCode }) {
  let body = (
    <div>
      Unfortunately there has been an unexpected problem authenticating your
      account.  Please try again and, if problems persist, help us to more
      quickly rectify the problem by contacting us and letting us know.
    </div>
  );
  if (errorCode === 'Unauthorized') {
    body = (
      <div>
        There was a problem authenticating your username and password.  Please
        check that they are entered correctly and try again.
      </div>
    );
  }

  return {
    body,
    icon: 'danger',
    header: 'Unable to sign in to your account',
  };
}

export default SignInForm;
