import React from 'react';

const StatefulButton = ({
  children,
  disabled,
  submitting, 
  submittingText,
  ...props
}) => {
  let content;
  if (submitting) {
    content = (
      <span>
        <i className="fa fa-spinner fa-spin" />
        {' '}{submittingText || 'Submitting...'}
      </span>
    );
  } else {
    content = children;
  }
  return (
    <button
      disabled={disabled || submitting}
      {...props}
    >
      {content}
    </button>
  );
};

export default StatefulButton;
