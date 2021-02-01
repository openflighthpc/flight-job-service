import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

function usePortal(id) {
  const root = React.useRef(null);
  if (!root.current) {
    root.current = document.createElement('div');
  }

  useEffect(() => {
    const parent = document.getElementById(id);
    parent.appendChild(root.current);
    return function removeElement() {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      root.current.remove();
    };
  }, [id]);

  return root.current;
}

function Portal({ id, children }) {
  const target = usePortal(id);
  return ReactDOM.createPortal(children, target);
};

export default Portal;
