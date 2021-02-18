import React, { useState } from 'react'

import SignInModal from './SignInModal';

// XXX Move modal out of here.  Perhaps in a portal?
export default function SignedOut() {
  const [ showModal, setShowModal ] = useState(false);

  return (
    <>
    <button
      className="ml-3 btn btn-success mr-1 pl-3 pr-4 text-uppercase font-weight-bold"
      type="submit"
      onClick={(evt) => {
        setShowModal(true);
        evt.preventDefault();
      }}
    >
      <i className="px-1 fa fa-user"></i>
      Log in
    </button>
    <SignInModal
      isOpen={showModal}
      toggle={() => setShowModal(false) }
    />
    </>
  );
}
