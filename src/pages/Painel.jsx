// Painel: bloqueios de hoje, status da proteção, contagem até liberar, tentativas bloqueadas e a mensagem do dia
import { Link } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import { PageHead, Reticulo, Vazio } from '../components/Pecas.jsx';
import ContagemLiberacao from '../components/ContagemLiberacao.jsx';
import GraficoTentativas from '../components/GraficoTentativas.jsx';
import { fmtDate, fmtTime, isToday, mensagemDoDia, pedidoAberto, plural, TYPE_LABEL } from '../dados/formato.js';
import './Painel.css';

function saudacao(nome) {
  const h = new Date().getHours();
  const quem = nome ? `, ${nome.split(' ')[0]}` : '';
  return (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + quem + '.';
}

function Status({ estado, titulo, texto, children }) {
  return (
    <div className="status-row">
      <span className={'dot ' + (estado === true ? 'on' : estado === 'aviso' ? 'warn' : '')} />
      <div className="txt"><b>{titulo}</b><span>{texto}</span></div>
      {children}
    </div>
  );
}

export default function Painel() {
  const { S } = useEstado();
  const st = S.stats;
  const ext = S.extensao;
  const abertos = S.requests.filter(pedidoAberto);
  const semana = st.week.reduce((soma, d) => soma + d.count, 0);
  const frase = st.today === 0
    ? 'Nenhuma distração passou pela mira hoje. Siga assim.'
    : `Você disse não para ${plural(st.today, 'distração', 'distrações')} hoje.`;

  return (
    <section className="page">
      <PageHead tag="Painel" title={saudacao(S.account && S.account.name)} desc="Tudo o que tentou roubar a sua atenção, e o que você escolheu no lugar." />

      {!S.account && (
        <div className="banner">
          <span className="tag">Minha conta</span>
          <span>Adicione o seu nome e e-mail à conta.</span>
          <Link className="btn sm" to="/painel/ajustes">Completar</Link>
        </div>
      )}

      <div className="grid g-dash">
        <div className="card frame hero">
          <Reticulo valor={st.today} rotulo="bloqueios hoje" />
          <div className="hero-side">
            <p className="tag">Hoje</p>
            <h2>{frase}</h2>
            <div className="mini-stats">
              <div><b>{st.byType.site || 0}</b><span className="tag">Sites</span></div>
              <div><b>{st.byType.word || 0}</b><span className="tag">Pesquisas</span></div>
              <div><b>{semana}</b><span className="tag">Na semana</span></div>
            </div>
          </div>
        </div>

        <div className="card statuses">
          <Status
            estado={ext ? true : 'aviso'}
            titulo="Extensão do navegador"
            texto={ext ? `${ext.nome}${ext.incognito ? '' : ' (sem modo anônimo)'}` : 'Sites e pesquisas não estão sendo bloqueados.'}
          >
            {!ext && <Link className="btn sm" to="/painel/ajustes">Instalar</Link>}
          </Status>
          <Status
            estado={true}
            titulo="Bloqueios ativos"
            texto={`${plural(S.lists.sites.length, 'site', 'sites')} · ${plural(S.lists.words.length, 'palavra', 'palavras')}`}
          >
            <Link className="btn sm ghost" to="/painel/bloqueios">Ver</Link>
          </Status>
          <Status
            estado={S.trusted ? true : ''}
            titulo="Pessoa de confiança"
            texto={S.trusted ? `${S.trusted.name} aprova as liberações.` : 'Ninguém cadastrado.'}
          />
          <Status
            estado={abertos.length ? 'aviso' : true}
            titulo="Liberações abertas"
            texto={abertos.length ? plural(abertos.length, 'pedido aguardando', 'pedidos aguardando') : 'Nenhum pedido em andamento.'}
          >
            {abertos.length > 0 && <Link className="btn sm" to="/painel/liberacoes">Ver</Link>}
          </Status>
        </div>
      </div>

      <div className="grid g-dash" style={{ marginTop: 16, alignItems: 'start' }}>
        <ContagemLiberacao />
        <div className="card frame">
          <p className="tag">Mensagem do dia</p>
          <p className="quote">{mensagemDoDia(S)}</p>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <GraficoTentativas />
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h2>Últimos bloqueios</h2></div>
        {st.recent.length ? (
          <ul className="events">
            {st.recent.map((e, i) => (
              <li key={e.t + '-' + i}>
                <time>{isToday(e.t) ? fmtTime(e.t) : fmtDate(e.t).slice(0, 5)}</time>
                <span><span className="pill">{TYPE_LABEL[e.type] || e.type}</span></span>
                <span className="what">{e.target}</span>
              </li>
            ))}
          </ul>
        ) : (
          <Vazio titulo="Nada por aqui ainda.">Quando a extensão bloquear algo, aparece nesta lista.</Vazio>
        )}
      </div>
    </section>
  );
}
