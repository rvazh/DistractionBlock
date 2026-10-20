import { useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import logo from '../assets/logo-branca.png';
import './MenuLateral.css';

const MENU = [
  { to: '/painel', num: '01', label: 'Painel', end: true },
  { to: '/painel/bloqueios', num: '02', label: 'Bloqueios', contagem: 'bloqueios' },
  { to: '/painel/liberacoes', num: '03', label: 'Liberações', contagem: 'prontos' },
  { to: '/painel/superacao', num: '04', label: 'Superação' },
  { to: '/painel/mensagens', num: '05', label: 'Mensagens' },
  { to: '/painel/ajustes', num: '06', label: 'Ajustes' },
];

// Menu à esquerda (no celular vira uma barra no topo) + a tela aberta no lado direito
export default function MenuLateral() {
  const { S, acoes } = useEstado();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function sair() {
    acoes.sair();
    navigate('/entrar', { replace: true });
  }

  // Ao trocar de tela, volta para o topo
  useEffect(() => {
    document.querySelector('.main')?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [pathname]);

  // Estilos (Ajustes › Estilos): valem só aqui dentro, depois do login. Ao sair do painel, o site volta ao normal.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.tema = S.style.tema;
    html.dataset.cor = S.style.cor;
    return () => {
      delete html.dataset.tema;
      delete html.dataset.cor;
    };
  }, [S.style.tema, S.style.cor]);

  const contagem = {
    bloqueios: S.lists.sites.length + S.lists.words.length,
    prontos: S.requests.filter((r) => r.status === 'ready' && !r.needsApproval).length,
  };

  return (
    <div className={'shell' + (S.fundo ? ' com-fundo' : '')}>
      {S.fundo && (
        <div className="fundo-tela" style={{ backgroundImage: `url("${S.fundo}")` }} aria-hidden="true">
          <span style={{ opacity: S.style.escurecer }} />
        </div>
      )}
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
          <div className="side-conta">
            <span className="side-avatar">{(S.account ? S.account.name : 'R').trim()[0].toUpperCase()}</span>
            <div className="side-conta-txt">
              <b>{S.account ? S.account.name : 'Minha conta'}</b>
              <span>{S.account ? S.account.email : 'Complete em Ajustes'}</span>
            </div>
            <button type="button" className="side-sair" onClick={sair}>Sair</button>
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
