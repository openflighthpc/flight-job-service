import React from 'react'

export default function SignedOut({ onClick }) {
  return (
    <button
      className="ml-3 btn btn-success mr-1 pl-3 pr-4 text-uppercase font-weight-bold"
      type="submit"
      onClick={onClick}
    >
      <i className="px-1 fa fa-user"></i>
      Log in
    </button>
  );
}
