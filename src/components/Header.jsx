// Cabeçalho do site (Início e Baixar): logo, atalhos para as seções e botões
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo-branca.png';
import './Header.css';

const SECOES = [
  ['como-funciona', 'Como funciona'],
  ['recursos', 'Recursos'],
  ['telas', 'Telas'],
  ['duvidas', 'Dúvidas'],
];

export default function Header() {
  const navigate = useNavigate();
  // As seções ficam na página Início; o HashRouter usa o # da URL, então a rolagem é feita pelo React
  const irPara = (id) => navigate('/', { state: { secao: id } });

  return (
    <header className="site-header">
      <nav className="site-nav" aria-label="Site">
        <Link to="/" className="site-marca">
          <span className="site-marca-icone"><img src={logo} alt="" /></span>
          <span>Distraction Block</span>
        </Link>
        <div className="site-links">
          {SECOES.map(([id, rotulo]) => (
            <button key={id} type="button" className="site-link" onClick={() => irPara(id)}>{rotulo}</button>
          ))}
        </div>
        <div className="site-acoes">
          <Link className="sbtn sbtn-linha esconder-celular" to="/baixar">Instalar extensão</Link>
          <Link className="sbtn sbtn-escuro" to="/painel">Abrir o painel</Link>
        </div>
      </nav>
    </header>
  );
}
