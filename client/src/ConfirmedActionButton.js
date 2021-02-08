import React, { useState } from 'react';
import {
  Button,
  ButtonToolbar,
  Popover,
  PopoverBody,
  PopoverHeader,
} from 'reactstrap';

function ConfirmedActionButton({
  act,
  acting,
  actingButtonText,
  buttonText,
  className,
  confirmationHeaderText,
  confirmationText,
  icon,
  id,
}) {
  const [showConfirmation, setShowConfirmation]  = useState(false);
  const toggle = () => setShowConfirmation(!showConfirmation);

  return (
    <React.Fragment>
      <Button
        className={`btn btn-danger ${acting ? 'disabled' : null} ${className}`}
        disabled={acting}
        id={id}
        size="sm"
      >
        {
          acting ?
            <i className="fa fa-spinner fa-spin mr-1"></i> :
            <i className={`fa ${icon} mr-1`}></i>
        }
        <span>{ acting ? actingButtonText : buttonText }</span>
      </Button>
      <Popover
        isOpen={showConfirmation}
        target={id}
        toggle={toggle}
      >
        <PopoverHeader>
          {confirmationHeaderText}
        </PopoverHeader>
        <PopoverBody>
          {confirmationText}
          <ButtonToolbar className="justify-content-center">
            <Button
              className="mr-2"
              onClick={toggle}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onClick={() => { toggle(); act(); }}
              size="sm"
            >
              <i className={`fa ${icon} mr-1`}></i>
              <span>{buttonText}</span>
            </Button>
          </ButtonToolbar>
        </PopoverBody>
      </Popover>
    </React.Fragment>
  );
}

export default ConfirmedActionButton;
