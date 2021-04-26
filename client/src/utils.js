import { useEffect, useRef } from 'react';

export const stateColourMap = {
  'PENDING':    'secondary',
  'RUNNING':    'primary',
  'COMPLETING': 'success',
  'COMPLETED':  'success',
  'FAILED':     'danger',
  'TERMINATED': 'danger',
  'SUSPENDED':  'info',
  'STOPPED':    'info',
  'UNKNOWN':    'warning',
};

export function useInterval(fn, interval, { immediate=false }={}) {
  const savedFn = useRef();
  savedFn.current = fn;

  useEffect(() => {
    savedFn.current = fn;
  }, [fn]);

  useEffect(() => {
    function tick() { savedFn.current(); }
    if (immediate) {
      tick();
    }
    if (interval !== null) {
      let id = setInterval(tick, interval);
      return () => clearInterval(id);
    }
  }, [immediate, interval]);
}
