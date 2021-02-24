import React from 'react';

function Overlay({ children }) {
  return (
    <div
      className="position-absolute"
      style={{
        fontSize: 'x-large',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
      }}
    >
      <div
        className="text-light px-3 rounded"
        style={{ background: 'rgba(108, 117, 125, 0.75)' }}
      >
        {children}
      </div>
    </div>
  );
}

// A small positioned container that results in the overlay being rendered
// pretty much in place.
function OverlayContainer({ children }) {
  return (
    <div style={{ height: '3em', left: 0, right: 0, position: 'absolute' }}>
      {children}
    </div>
  );
}

export {
  Overlay,
  OverlayContainer,
};

export default Overlay;
