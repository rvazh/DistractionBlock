// Moldura das telas de acesso (Entrar e Criar conta): lado da marca + lado do formulário
import { Link } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import { mensagemDoDia } from '../dados/formato.js';
import logo from '../assets/logo-branca.png';
import './Acesso.css';

export default function Acesso({ rotulo, titulo, texto, children }) {
  const { S } = useEstado();
  return (
    <div className="acesso">
      <aside className="acesso-marca">
        <Link to="/" className="acesso-voltar">← Voltar ao site</Link>
        <div className="acesso-mira">
          <svg viewBox="0 0 240 240" aria-hidden="true">
            <circle cx="120" cy="120" r="118" className="rg rg1" />
            <circle cx="120" cy="120" r="104" className="rg rg2" />
            <circle cx="120" cy="120" r="90" className="rg rg3" />
          </svg>
          <img src={logo} alt="" />
        </div>
        <blockquote className="acesso-frase">{mensagemDoDia(S)}</blockquote>
        <p className="tag">Distraction Block</p>
      </aside>

      <main className="acesso-form">
        <div className="acesso-caixa">
          <Link to="/" className="acesso-voltar celular">← Voltar ao site</Link>
          <p className="tag">{rotulo}</p>
          <h1>{titulo}</h1>
          {texto && <p className="acesso-texto">{texto}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
