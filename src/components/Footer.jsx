// Rodapé do site
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo-branca.png';
import { REPO_URL } from '../config.js';
import './Footer.css';

export default function Footer() {
  const navigate = useNavigate();
  const irPara = (id) => navigate('/', { state: { secao: id } });
  return (
    <footer className="site-rodape">
      <div className="site-rodape-marca">
        <span className="site-marca-icone pequeno"><img src={logo} alt="" /></span>
        <b>Distraction Block</b>
        <span>· PJ002 · {new Date().getFullYear()}</span>
      </div>
      <div className="site-rodape-links">
        <button type="button" onClick={() => irPara('como-funciona')}>Como funciona</button>
        <button type="button" onClick={() => irPara('recursos')}>Recursos</button>
        <button type="button" onClick={() => irPara('duvidas')}>Dúvidas</button>
        <Link to="/baixar">Baixar</Link>
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
    </footer>
  );
}
