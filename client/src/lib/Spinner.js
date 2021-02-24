import React from 'react';

function Spinner({ text }) {
  return (
    <div className="text-center">
      <i className="fa fa-spinner fa-spin mr-1"></i>
      {text}
    </div>
  );
}

export default Spinner;
