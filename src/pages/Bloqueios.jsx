// Bloqueios: sites e palavras pesquisadas numa página só
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';
import { PageHead, Vazio } from '../components/Pecas.jsx';
import { PedirLiberacao } from '../components/Pedidos.jsx';
import { fmtDate, fmtLeft, pedidoAberto, plural } from '../dados/formato.js';
import './Bloqueios.css';

const TIPOS = {
  sites: {
    rotulo: 'Site',
    oQue: 'site',
    exemplo: 'instagram.com ou cole o link',
    nota: 'O domínio inteiro fica bloqueado, incluindo subdomínios (m.instagram.com, www.instagram.com…).',
    sugestoes: ['instagram.com', 'tiktok.com', 'youtube.com', 'x.com', 'facebook.com', 'reddit.com', 'twitch.tv', 'kwai.com', 'netflix.com', 'pinterest.com'],
  },
  words: {
    rotulo: 'Palavra',
    oQue: 'palavra',
    exemplo: 'Palavra ou frase, ex.: aposta',
    nota: 'Vale para Google, Bing, YouTube, DuckDuckGo e outros buscadores. "bet" bloqueia "bet365" e "bets", mas não "alfabeto". Acentos e maiúsculas não importam.',
    sugestoes: ['bet', 'aposta', 'cassino', 'fofoca', 'memes', 'reels'],
  },
};

function lerPreferencia(chave, padrao, validos) {
  try {
    const v = localStorage.getItem(chave);
    return validos.includes(v) ? v : padrao;
  } catch {
    return padrao;
  }
}
function salvarPreferencia(chave, valor) {
  try { localStorage.setItem(chave, valor); } catch { /* ignora */ }
}

export default function Bloqueios() {
  const { S, acoes, agora } = useEstado();
  const { act, toast, abrirModal } = useUI();
  const [tipo, setTipo] = useState(() => lerPreferencia('db:tipo', 'sites', Object.keys(TIPOS)));
  const [filtro, setFiltro] = useState(() => lerPreferencia('db:filtro', 'todos', ['todos', 'sites', 'words']));
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  const cfg = TIPOS[tipo];
  const jaBloqueados = new Set(S.lists[tipo].map((i) => i.value));
  const sugestoes = cfg.sugestoes.filter((s) => !jaBloqueados.has(s));

  const todos = ['sites', 'words'].flatMap((k) => S.lists[k].map((item) => ({ ...item, lista: k })));
  const contagem = { todos: todos.length, sites: S.lists.sites.length, words: S.lists.words.length };
  const filtroAtual = filtro !== 'todos' && !contagem[filtro] ? 'todos' : filtro;
  const mostrados = (filtroAtual === 'todos' ? todos : todos.filter((i) => i.lista === filtroAtual)).sort((a, b) => b.addedAt - a.addedAt);

  function pedidoDe(lista, valor) {
    return S.requests.find((r) => r.kind === 'remove' && r.list === lista && r.value === valor && pedidoAberto(r));
  }

  async function bloquear(e) {
    e.preventDefault();
    setErro('');
    const v = texto.trim();
    if (!v) return;
    try {
      await acoes.bloquear(tipo, v);
      setTexto('');
      toast('Bloqueado. Vale a partir de agora.');
    } catch (x) {
      setErro(x.message);
    }
  }

  return (
    <section className="page">
      <PageHead
        tag="Bloqueios"
        title="Bloqueios"
        desc="Sites e palavras pesquisadas num só lugar. Bloquear vale na hora; liberar leva 7 dias."
        right={!S.extensao ? <Link className="btn sm" to="/painel/ajustes">Extensão desconectada</Link> : null}
      />

      <div className="card frame">
        <form className="add-row" onSubmit={bloquear}>
          <div className="seg" role="radiogroup" aria-label="Tipo de bloqueio">
            {Object.entries(TIPOS).map(([k, t]) => (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={k === tipo}
                className={k === tipo ? 'on' : ''}
                onClick={() => { setTipo(k); salvarPreferencia('db:tipo', k); setErro(''); }}
              >
                {t.rotulo}
              </button>
            ))}
          </div>
          <input
            className="input"
            aria-label="O que bloquear"
            placeholder={cfg.exemplo}
            autoComplete="off"
            spellCheck={false}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <button className="btn primary" type="submit">Bloquear</button>
        </form>
        <p className="form-error">{erro}</p>
        {sugestoes.length > 0 && (
          <div className="chips">
            {sugestoes.map((s) => (
              <button key={s} className="chip" type="button" onClick={() => act(() => acoes.bloquear(tipo, s), `${s} bloqueado.`)}>{s}</button>
            ))}
          </div>
        )}
        <p className="note">{cfg.nota}</p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head wrap">
          <h2>{plural(todos.length, 'item bloqueado', 'itens bloqueados')}</h2>
          <div className="tabs" role="tablist" aria-label="Filtrar bloqueios">
            {[['todos', 'Todos'], ['sites', 'Sites'], ['words', 'Palavras']].map(([k, l]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={filtroAtual === k}
                className={filtroAtual === k ? 'on' : ''}
                onClick={() => { setFiltro(k); salvarPreferencia('db:filtro', k); }}
              >
                {l}<span className="n">{contagem[k]}</span>
              </button>
            ))}
          </div>
        </div>
        {mostrados.length ? (
          <div className="table-box">
            <table className="table">
              <thead>
                <tr><th>Tipo</th><th>Item</th><th>Desde</th><th>Status</th><th /></tr>
              </thead>
              <tbody>
                {mostrados.map((item) => {
                  const pedido = pedidoDe(item.lista, item.value);
                  let situacao;
                  if (!pedido) situacao = <span className="pill alert">Bloqueado</span>;
                  else if (pedido.status === 'ready' && !pedido.needsApproval) situacao = <span className="pill solid">Pronto para liberar</span>;
                  else if (pedido.status === 'ready') situacao = <span className="pill">Aguardando aprovação</span>;
                  else situacao = <span className="pill">Libera em {fmtLeft(pedido.availableAt - agora)}</span>;
                  return (
                    <tr key={item.lista + item.value}>
                      <td><span className="type-tag">{TIPOS[item.lista].rotulo}</span></td>
                      <td><span className="val">{item.value}</span></td>
                      <td className="date">{fmtDate(item.addedAt)}</td>
                      <td>{situacao}</td>
                      <td>
                        {pedido ? (
                          <Link className="btn sm ghost" to="/painel/liberacoes">Ver pedido</Link>
                        ) : (
                          <button
                            className="btn sm ghost"
                            type="button"
                            onClick={() => abrirModal(<PedirLiberacao lista={item.lista} valor={item.value} oQue={TIPOS[item.lista].oQue} />)}
                          >
                            Pedir liberação
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Vazio titulo="Nada bloqueado ainda.">Escolha o tipo, digite acima ou use as sugestões.</Vazio>
        )}
      </div>
    </section>
  );
}
