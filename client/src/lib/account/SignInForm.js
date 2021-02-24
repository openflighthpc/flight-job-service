import React, { useEffect } from 'react';
import classNames from 'classnames';
import { FormFeedback, FormText } from 'reactstrap';
import { useForm } from 'react-hook-form';

import FormInput from './FormInput';
import styles from './feedback.module.css';
import { useSignIn } from './actions';

function setErrorsFromResponse(setError) {
  return function(body, response) {
    if (response.status === 403) {
      const message = "Your username or password has not been recognised.";
      setError("login", { type: "manual", message });
      setError("password", { type: "manual", message });
    } else if (response.status === 502 || response.status == null) {
      const message = "Unable to contact login service.";
      setError("base", { type: "manual", message });
    }
  }
}

function Form({ login, onSubmitting, onSuccess, }, apiRef) {
  const { register, handleSubmit, errors, formState, clearErrors, setError } = useForm({
    mode: 'all',
  });
  const { signIn, loading } = useSignIn({
    onError: setErrorsFromResponse(setError),
    onSuccess: onSuccess,
  });
  const submit = (...args) => {
    clearErrors('base');
    return handleSubmit(signIn)(...args);
  };
  useEffect(() => { onSubmitting(loading); }, [loading, onSubmitting]);

  // API exported by this component to allow for programatic submitting.
  // This is so not the way React functional components are supposed to work,
  // but it does work.
  apiRef.current = {
    submit: submit,
    isSubmitting: loading,
  };

  return (
    <form onSubmit={submit}>
      <FormText className="mb-2">
        Sign in to your OpenFlightHPC environment account.  You'll need your
        account username and password.  Contact your HPC administrator if you
        don't have these details or need a reminder.
      </FormText>
      {
        errors.base ?
          (
            <FormFeedback
              className={
                classNames(styles.formFeedback, styles.formFeedback_base)}
              >
                {errors.base.message}
              </FormFeedback>
          ):
          null
      }
      <FormInput
        label="Enter your username"
        name="login"
        type="text"
        ref={register}
        formErrors={errors}
        formMeta={formState}
      />
      <FormInput
        label="Enter your password"
        name="password"
        type="password"
        ref={register}
        formErrors={errors}
        formMeta={formState}
      />
      <button type="submit" className="d-none"></button>
    </form>
  );
}

export default React.forwardRef(Form);
