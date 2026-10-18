import { createContext, useCallback, useContext, useState } from 'react';

const UICtx = createContext(null);

export function UIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);

  const toast = useCallback((msg, erro) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg, erro }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);

  // Executa uma ação; mostra o erro como aviso e devolve false quando falha
  const act = useCallback(async (fn, okMsg) => {
    try {
      const r = await fn();
      if (okMsg) toast(okMsg);
      return r === undefined ? true : r;
    } catch (e) {
      toast(e.message || String(e), true);
      return false;
    }
  }, [toast]);

  const abrirModal = useCallback((el) => setModal(el), []);
  const fecharModal = useCallback(() => setModal(null), []);

  return (
    <UICtx.Provider value={{ toast, act, abrirModal, fecharModal }}>
      {children}
      {modal}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={'toast' + (t.erro ? ' err' : '')}>{t.msg}</div>)}
      </div>
    </UICtx.Provider>
  );
}

export const useUI = () => useContext(UICtx);
