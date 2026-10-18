// Estado do app para todas as telas: os dados (S), as ações e a hora atual (para as contagens regressivas)
import { createContext, useContext, useEffect, useState } from 'react';
import { acoes, ouvir, retrato } from '../dados/armazenamento.js';

const EstadoCtx = createContext(null);

export function EstadoProvider({ children }) {
  const [S, setS] = useState(retrato);
  const [agora, setAgora] = useState(Date.now());

  useEffect(() => {
    const parar = ouvir(setS);
    // A cada minuto: atualiza as contagens e os pedidos que completaram o prazo
    const t = setInterval(() => {
      setAgora(Date.now());
      setS(retrato());
    }, 60 * 1000);
    return () => {
      parar();
      clearInterval(t);
    };
  }, []);

  return <EstadoCtx.Provider value={{ S, acoes, agora }}>{children}</EstadoCtx.Provider>;
}

export const useEstado = () => useContext(EstadoCtx);
