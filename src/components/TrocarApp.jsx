// Logo do painel: ao clicar, escolhe entre continuar no Distraction Block ou ir para o CIFRA
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo-branca.png';
import logoCifra from '../assets/cifra-logo.png';
import { CIFRA_URL } from '../config.js';
import './TrocarApp.css';

export default function TrocarApp() {
  const [aberto, setAberto] = useState(false);
  const area = useRef(null);
  const { pathname } = useLocation();

  // Fecha ao trocar de tela, com Esc ou clicando fora
  useEffect(() => setAberto(false), [pathname]);
  useEffect(() => {
    if (!aberto) return undefined;
    const tecla = (e) => e.key === 'Escape' && setAberto(false);
    const clique = (e) => !area.current?.contains(e.target) && setAberto(false);
    window.addEventListener('keydown', tecla);
    document.addEventListener('mousedown', clique);
    return () => {
      window.removeEventListener('keydown', tecla);
      document.removeEventListener('mousedown', clique);
    };
  }, [aberto]);

  return (
    <div className="trocar-app" ref={area}>
      <button type="button" className="brand" aria-expanded={aberto} aria-controls="apps-menu" title="Escolher o app" onClick={() => setAberto((a) => !a)}>
        <img src={logo} alt="" />
        <div><b>Distraction</b><b>Block</b></div>
        <svg className="brand-seta" aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 4.5l3 3 3-3" /></svg>
      </button>

      {aberto && (
        <div id="apps-menu" className="apps-menu" role="menu" aria-label="Escolher o app">
          <p className="tag">Usar qual app?</p>
          <Link to="/painel" role="menuitem" className="app-opcao atual" onClick={() => setAberto(false)}>
            <span className="app-icone escuro"><img src={logo} alt="" /></span>
            <span className="app-textos"><b>Distraction Block</b><small>Você está aqui</small></span>
            <span className="app-marca" aria-hidden="true">✓</span>
          </Link>
          {CIFRA_URL && (
            <a href={CIFRA_URL} role="menuitem" className="app-opcao">
              <span className="app-icone claro"><img src={logoCifra} alt="" /></span>
              <span className="app-textos"><b>CIFRA</b><small>Finanças pessoais</small></span>
              <span className="app-marca" aria-hidden="true">→</span>
            </a>
          )}
          <Link to="/" role="menuitem" className="apps-site">Ver o site do Distraction Block</Link>
        </div>
      )}
    </div>
  );
}
