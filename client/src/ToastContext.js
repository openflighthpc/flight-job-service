import React, { useContext, useMemo, useState } from 'react';
import { Toast, ToastHeader, ToastBody } from 'reactstrap';
import { v1 as uuidv1 } from 'uuid';

import Portal from './Portal';

const Context = React.createContext({});

function Provider({ children }) {
  const [toasts, setToasts] = useState([]);
  const actions = useMemo(
    () => ({
      addToast(content) {
        const id =  uuidv1();
        const newToast = { content, id };
        setToasts((toasts) => [ ...toasts, newToast ]);
        return {
          id,
          removeToast() { actions.removeToast(id) },
        };
      },

      removeToast(id) {
        setToasts((toasts) => {
          const idx = toasts.findIndex(t => t.id === id);
          if (idx === -1) {
            return toasts;
          } else {
            const before = toasts.slice(0, idx);
            const after = toasts.slice(idx + 1, toasts.length);
            return [ ...before, ...after ];
          }
        });
      }
    }),
    [ setToasts ],
  );

  return (
    <Context.Provider value={{ toasts, ...actions }}>
      {children}
    </Context.Provider>
  );
}

function useToast() {
  return useContext(Context);
}

function Container() {
  const { toasts, removeToast } = useToast();

  return (
    <Portal id="toast-portal">
      {
        toasts.map(t => (
          <Toast isOpen={true} key={t.id}>
            <ToastHeader
              icon={t.content.icon}
              toggle={
                t.content.toggle != null ?
                  t.content.toggle :
                  () => removeToast(t.id)
              }
            >
              {t.content.header}
            </ToastHeader>
            <ToastBody>
              {t.content.body}
            </ToastBody>
          </Toast>
        ))
      }
    </Portal>
  );
}

export {
  Container,
  Context,
  Provider,
  useToast,
}
