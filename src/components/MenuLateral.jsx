import { NavLink, Outlet } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import logo from '../assets/logo-branca.png';
import './MenuLateral.css';

const MENU = [
  { to: '/', num: '01', label: 'Painel', end: true },
  { to: '/bloqueios', num: '02', label: 'Bloqueios', contagem: 'bloqueios' },
  { to: '/liberacoes', num: '03', label: 'Liberações', contagem: 'prontos' },
  { to: '/mensagens', num: '04', label: 'Mensagens' },
  { to: '/ajustes', num: '05', label: 'Ajustes' },
];

// Menu à esquerda (no celular vira uma barra no topo) + a tela aberta no lado direito
export default function MenuLateral() {
  const { S } = useEstado();
  const contagem = {
    bloqueios: S.lists.sites.length + S.lists.words.length,
    prontos: S.requests.filter((r) => r.status === 'ready' && !r.needsApproval).length,
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <img src={logo} alt="" />
          <div><b>Distraction</b><b>Block</b></div>
        </div>
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
          <div className="row"><span className="dot on" />Proteção ativa</div>
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
