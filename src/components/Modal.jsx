import { useEffect, useState } from 'react';
import { useUI } from '../contexto/UI.jsx';

/* Janela com cantoneiras de visor. Use com abrirModal(<Modal ...>) */
export default function Modal({ tag, title, wide, children, actions }) {
  const { fecharModal } = useUI();

  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') fecharModal(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [fecharModal]);

  return (
    <div className="modal-root" onMouseDown={(e) => { if (e.target === e.currentTarget) fecharModal(); }}>
      <div className={'modal' + (wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <header>
          {tag && <p className="tag">{tag}</p>}
          <h2 id="modal-titulo">{title}</h2>
        </header>
        <div className="body">{children}</div>
        {actions && <footer>{actions}</footer>}
      </div>
    </div>
  );
}

/* Botão de rodapé: fecha a janela quando a ação dá certo (a menos que devolva false) */
export function BotaoModal({ kind = '', onClick, fecha = true, children, ...rest }) {
  const { fecharModal } = useUI();
  const [ocupado, setOcupado] = useState(false);
  return (
    <button
      type="button"
      className={'btn ' + kind}
      disabled={ocupado}
      onClick={async () => {
        setOcupado(true);
        let r;
        try { r = onClick ? await onClick() : undefined; } finally { setOcupado(false); }
        if (r !== false && fecha) fecharModal();
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
