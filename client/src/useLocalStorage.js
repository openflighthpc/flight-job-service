import { useState } from 'react';

function createStorage(provider) {
  return {
    get(key, defaultValue) {
      const json = provider.getItem(key);
      if (json == null) {
        return typeof defaultValue === 'function' ?
          defaultValue() :
          defaultValue;
      } else {
        return JSON.parse(json);
      }
    },
    set(key, value) {
      provider.setItem(key, JSON.stringify(value));
    },
  }
};

const storage = createStorage(window.sessionStorage);

export default function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      return storage.get(key, initialValue);
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  function setValue(valueOrFn) {
    try {
      const value = typeof valueOrFn === 'function' ?
        valueOrFn(storedValue) :
        valueOrFn;
      setStoredValue(value);
      storage.set(key, value);
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}
