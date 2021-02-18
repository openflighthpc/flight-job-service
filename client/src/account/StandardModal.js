import React from 'react'
import { Button, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';

function StandardModal({
  buttons,
  children,
  closeButtonText='Close',
  isOpen,
  size,
  title,
  toggle,
  ...rest
}) {
  return (
    <Modal
      isOpen={isOpen}
      size={size}
      toggle={toggle}
      {...rest}
    >
      <ModalHeader toggle={toggle}>{title}</ModalHeader>
      <ModalBody>{children}</ModalBody>
      <ModalFooter>
        {buttons}
        <Button
          color="link"
          onClick={toggle}
        >
          {closeButtonText}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export default StandardModal;
