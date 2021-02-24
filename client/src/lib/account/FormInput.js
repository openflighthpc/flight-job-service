import React from 'react';
import {
  FormFeedback,
  FormGroup,
  FormText,
  Label,
  Input,
} from 'reactstrap';

import styles from './feedback.module.css';

const defaultErrorMap = {
  'blank': 'This must not be blank',
  'not_confirmed': 'This field must match the password',
  'invalid': 'This is not a valid value',
  'invalid_login_token': 'This must be either your email address, or your Flight username consisting of lowercase letters, numbers and hyphens (-).',
  'invalid_username_format': 'Usernames can only use lowercase letters, numbers and hypens (-), and must not start with a hyphen.',
  'not_accepted': 'You must accept the terms and conditions to continue.',
  'password_too_weak': 'The password is not strong enough',
  'required': 'This field is required',
  'too_long': 'This is too long',
  'too_short': 'This is too short'
};
defaultErrorMap['must be accepted'] = defaultErrorMap['not_accepted'];

function formattedErrors(error, completeErrorMap) {
  if (error == null) {
    return null;
  } else if (Array.isArray(error.message)) {
    return error.message.map(e => completeErrorMap[e] || e).join(', ');
  } else {
    return completeErrorMap[error.message] || error.message;
  }
}

const FormInput = ({
  check,
  errorMap={},
  help,
  helpProps,
  hideLabel,
  label,
  formMeta,
  formErrors,
  name,
  ...custom
}, ref) => {
  const touched = formMeta.touched[name] || formMeta.isSubmitted;
  const error = formErrors[name];
  const inputEl = (
    <Input
      id={name}
      name={name}
      valid={touched ? !error : undefined}
      {...custom}
      innerRef={ref}
    />
  );

  const completeErrorMap = { ...defaultErrorMap, ...errorMap };
  const errors = formattedErrors(error, completeErrorMap);

  return (
    <FormGroup check={check}>
      { check ? inputEl : null }
      <Label
        check={check}
        htmlFor={name}
        hidden={hideLabel}
      >
        {label}
      </Label>
      { ' ' }
      { help ? <FormText {...helpProps}>{help}</FormText> : '' }
      { check ? null : inputEl }
      { ' ' }
      { errors && touched ? <FormFeedback className={styles.formFeedback}>{errors}</FormFeedback> : <FormFeedback /> }
      { ' ' }
    </FormGroup>
  );
};

export default React.forwardRef(FormInput);
