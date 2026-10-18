import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import logo from '../assets/logo-branca.png';
import './MenuLateral.css';

const MENU = [
  { to: '/painel', num: '01', label: 'Painel', end: true },
  { to: '/painel/bloqueios', num: '02', label: 'Bloqueios', contagem: 'bloqueios' },
  { to: '/painel/liberacoes', num: '03', label: 'Liberações', contagem: 'prontos' },
  { to: '/painel/mensagens', num: '04', label: 'Mensagens' },
  { to: '/painel/ajustes', num: '05', label: 'Ajustes' },
];

// Menu à esquerda (no celular vira uma barra no topo) + a tela aberta no lado direito
export default function MenuLateral() {
  const { S } = useEstado();
  const { pathname } = useLocation();

  // Ao trocar de tela, volta para o topo
  useEffect(() => {
    document.querySelector('.main')?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [pathname]);

  const contagem = {
    bloqueios: S.lists.sites.length + S.lists.words.length,
    prontos: S.requests.filter((r) => r.status === 'ready' && !r.needsApproval).length,
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" to="/" title="Ir para o site">
          <img src={logo} alt="" />
          <div><b>Distraction</b><b>Block</b></div>
        </Link>
        <nav className="nav" aria-label="Principal">
          {MENU.map((m) => (
            <NavLink key={m.to} to={m.to} end={m.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="num">{m.num}</span>
              {m.label}
              {m.contagem && (
                <span className={'count' + (m.contagem === 'prontos' ? ' alert' : '')}>{contagem[m.contagem] || ''}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="side-status">
          <div className="row">
            <span className={'dot ' + (S.hasPassword ? 'on' : 'warn')} />
            {S.hasPassword ? 'Senha criada' : 'Senha não criada'}
          </div>
          <div className="row">
            <span className={'dot ' + (S.extensao ? 'on' : 'warn')} />
            {S.extensao ? 'Extensão conectada' : 'Extensão desconectada'}
          </div>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
