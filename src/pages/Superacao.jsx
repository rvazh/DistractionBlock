// Superação: cada vício que você está largando, os dias sem recair, o recorde e as recaídas.
// Fica na sua conta (Supabase), então aparece igual em qualquer aparelho em que você entrar.
import { useCallback, useEffect, useState } from 'react';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';
import Modal, { BotaoModal } from '../components/Modal.jsx';
import { Citacao, PageHead, Vazio } from '../components/Pecas.jsx';
import * as N from '../dados/nuvem.js';
import { formatarData, hojeISO, resumoVicio, SUGESTOES, textoDias } from '../dados/superacao.js';
import { mensagemAleatoria } from '../dados/formato.js';
import './Superacao.css';

/* ---------- Janelas ---------- */
function RegistrarRecaida({ vicio, aoSalvar }) {
  const { S } = useEstado();
  const { toast } = useUI();
  const [quando, setQuando] = useState(hojeISO());
  const [nota, setNota] = useState('');
  const [erro, setErro] = useState('');
  const [frase] = useState(() => mensagemAleatoria(S));
  return (
    <Modal tag="Recaída" title="Tudo bem. Recomeçar faz parte."
      actions={<>
        <BotaoModal kind="primary" onClick={async () => {
          try {
            await N.registrarRecaida(vicio.id, { quando, nota: nota.trim() });
            toast('Registrado. O contador recomeçou. Um dia de cada vez.');
            aoSalvar();
            return true;
          } catch (e) { setErro(e.message); return false; }
        }}>Registrar e recomeçar</BotaoModal>
        <BotaoModal kind="ghost">Cancelar</BotaoModal>
      </>}>
      <p>O contador de <b>{vicio.nome}</b> volta a zero a partir desse dia. O seu recorde continua guardado.</p>
      <label className="field">
        <span className="tag">Quando</span>
        <input className="input" type="date" value={quando} min={vicio.inicio} max={hojeISO()} onChange={(e) => setQuando(e.target.value)} />
      </label>
      <label className="field">
        <span className="tag">O que aconteceu? (opcional)</span>
        <input className="input" maxLength={280} placeholder="Ex.: sexta à noite, depois de um dia difícil" value={nota} onChange={(e) => setNota(e.target.value)} />
      </label>
      <p className="form-error">{erro}</p>
      <Citacao pequena>{frase}</Citacao>
    </Modal>
  );
}

function EditarVicio({ vicio, aoSalvar }) {
  const { toast } = useUI();
  const [nome, setNome] = useState(vicio.nome);
  const [motivo, setMotivo] = useState(vicio.motivo || '');
  const [inicio, setInicio] = useState(vicio.inicio);
  const [erro, setErro] = useState('');
  return (
    <Modal tag="Superação" title={`Editar ${vicio.nome}`}
      actions={<>
        <BotaoModal kind="primary" onClick={async () => {
          if (nome.trim().length < 2) { setErro('Dê um nome com pelo menos 2 letras.'); return false; }
          try {
            await N.editarVicio(vicio.id, { nome: nome.trim(), motivo: motivo.trim(), inicio });
            toast('Salvo.');
            aoSalvar();
            return true;
          } catch (e) { setErro(e.message); return false; }
        }}>Salvar</BotaoModal>
        <BotaoModal kind="ghost">Cancelar</BotaoModal>
      </>}>
      <label className="field"><span className="tag">Nome</span>
        <input className="input" maxLength={60} value={nome} onChange={(e) => setNome(e.target.value)} />
      </label>
      <label className="field"><span className="tag">Sem ele desde</span>
        <input className="input" type="date" max={hojeISO()} value={inicio} onChange={(e) => setInicio(e.target.value)} />
      </label>
      <label className="field"><span className="tag">Seu motivo para parar</span>
        <input className="input" maxLength={280} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </label>
      <p className="form-error">{erro}</p>
    </Modal>
  );
}

function ApagarVicio({ vicio, aoSalvar }) {
  const { act } = useUI();
  return (
    <Modal tag="Superação" title={`Apagar ${vicio.nome}?`}
      actions={<>
        <BotaoModal kind="danger" onClick={() => act(async () => { await N.apagarVicio(vicio.id); aoSalvar(); }, 'Apagado.')}>Apagar de vez</BotaoModal>
        <BotaoModal kind="primary">Manter</BotaoModal>
      </>}>
      <p>O contador, o recorde e todas as recaídas de {vicio.nome} serão apagados da sua conta. Não dá para desfazer.</p>
    </Modal>
  );
}

/* ---------- Cartão de um vício ---------- */
function CartaoVicio({ v, hoje, recarregar }) {
  const { abrirModal, act } = useUI();
  const [historico, setHistorico] = useState(false);
  const r = resumoVicio(v, hoje);

  return (
    <article className="card vicio">
      <div className="card-head">
        <h2>{v.nome}</h2>
        {r.ehRecorde ? <span className="pill solid">Recorde</span> : <span className="pill">Recorde: {textoDias(r.recorde)}</span>}
      </div>

      <div className="vicio-contador">
        <b>{r.comecou ? r.dias : 0}</b>
        <span>{r.dias === 1 ? 'dia' : 'dias'} sem {v.nome.toLowerCase()}<small>desde {formatarData(r.comecou ? r.desde : v.inicio)}</small></span>
      </div>

      {r.meta ? (
        <div className="vicio-meta">
          <div className="vicio-meta-linha"><span>Próxima meta: {textoDias(r.meta)}</span><span>faltam {textoDias(r.faltam)}</span></div>
          <div className="vicio-trilho"><div style={{ width: `${Math.max(3, r.pct)}%` }} /></div>
        </div>
      ) : (
        <p className="vicio-meta-linha">Mais de 3 anos. Você venceu.</p>
      )}

      {v.motivo && <blockquote className="vicio-motivo">“{v.motivo}”</blockquote>}

      <dl className="vicio-dados">
        <div><dt>Recorde</dt><dd>{textoDias(r.recorde)}</dd></div>
        <div><dt>Recaídas</dt><dd>{r.totalRecaidas}</dd></div>
        <div><dt>Começou em</dt><dd>{formatarData(v.inicio)}</dd></div>
      </dl>

      <div className="vicio-acoes">
        <button type="button" className="btn sm" onClick={() => abrirModal(<RegistrarRecaida vicio={v} aoSalvar={recarregar} />)}>Registrar recaída</button>
        {r.totalRecaidas > 0 && (
          <button type="button" className="btn sm ghost" aria-expanded={historico} onClick={() => setHistorico((h) => !h)}>
            {historico ? 'Esconder histórico' : 'Histórico'}
          </button>
        )}
        <button type="button" className="btn sm ghost" onClick={() => abrirModal(<EditarVicio vicio={v} aoSalvar={recarregar} />)}>Editar</button>
        <button type="button" className="btn sm ghost vicio-apagar" onClick={() => abrirModal(<ApagarVicio vicio={v} aoSalvar={recarregar} />)}>Apagar</button>
      </div>

      {historico && (
        <ul className="vicio-historico">
          {v.recaidas.map((x) => (
            <li key={x.id}>
              <time>{formatarData(x.quando)}</time>
              <span>{x.nota || <i>sem anotação</i>}</span>
              <button type="button" className="link-botao" aria-label={`Apagar a recaída de ${formatarData(x.quando)}`}
                onClick={() => act(async () => { await N.apagarRecaida(x.id); recarregar(); }, 'Recaída apagada.')}>Apagar</button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

/* ---------- Tela ---------- */
export default function Superacao() {
  const { S } = useEstado();
  const { toast } = useUI();
  const [vicios, setVicios] = useState(null); // null = carregando
  const [erroCarga, setErroCarga] = useState('');
  const [nome, setNome] = useState('');
  const [inicio, setInicio] = useState(hojeISO());
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const hoje = hojeISO();

  const recarregar = useCallback(async () => {
    if (!S.nuvem) return;
    try {
      setErroCarga('');
      setVicios(await N.listarVicios());
    } catch (e) {
      setErroCarga(e.message);
      setVicios((v) => v || []);
    }
  }, [S.nuvem]);

  useEffect(() => { recarregar(); }, [recarregar]);

  async function adicionar(e) {
    e.preventDefault();
    setErro('');
    if (nome.trim().length < 2) { setErro('Escreva o que você quer largar (pelo menos 2 letras).'); return; }
    if (inicio > hoje) { setErro('A data não pode ser no futuro.'); return; }
    setSalvando(true);
    try {
      await N.criarVicio({ nome: nome.trim(), motivo: motivo.trim(), inicio });
      toast(`Contando os dias sem ${nome.trim().toLowerCase()}.`);
      setNome(''); setMotivo(''); setInicio(hojeISO());
      await recarregar();
    } catch (x) {
      setErro(x.message);
    } finally {
      setSalvando(false);
    }
  }

  const head = <PageHead tag="Superação" title="Superação" desc="Os vícios que você está largando, os dias sem recair e o motivo para continuar. Fica guardado na sua conta." />;

  if (!S.nuvem) {
    return (
      <section className="page">
        {head}
        <div className="card frame">
          <h2>Falta ligar o servidor</h2>
          <p className="sub">A Superação guarda os dados na sua conta, no Supabase. Coloque o endereço e a chave pública do projeto em <code>src/config.js</code> e publique de novo.</p>
        </div>
      </section>
    );
  }

  const usados = new Set((vicios || []).map((v) => v.nome.toLowerCase()));
  const sugestoes = SUGESTOES.filter((s) => !usados.has(s.toLowerCase()));

  return (
    <section className="page">
      {head}

      <div className="card frame">
        <h2>{vicios && vicios.length ? 'Largar mais um' : 'O que você quer largar?'}</h2>
        <form className="vicio-form" onSubmit={adicionar}>
          <label className="field">
            <span className="tag">Vício</span>
            <input className="input" maxLength={60} placeholder="Ex.: Apostas" value={nome} onChange={(e) => setNome(e.target.value)} />
          </label>
          <label className="field">
            <span className="tag">Sem ele desde</span>
            <input className="input" type="date" max={hoje} value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </label>
          <label className="field vicio-form-motivo">
            <span className="tag">Seu motivo para parar (opcional)</span>
            <input className="input" maxLength={280} placeholder="Ex.: juntar dinheiro para o casamento" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
          </label>
          <div className="vicio-form-botao"><button className="btn primary" type="submit" disabled={salvando}>{salvando ? 'Salvando…' : 'Começar a contar'}</button></div>
        </form>
        <p className="form-error">{erro}</p>
        {sugestoes.length > 0 && (
          <div className="chips">
            {sugestoes.map((s) => <button key={s} className="chip" type="button" onClick={() => setNome(s)}>{s}</button>)}
          </div>
        )}
        <p className="note">Só você vê isso. Cada pessoa só enxerga os próprios dados.</p>
      </div>

      {erroCarga && (
        <div className="banner" style={{ marginTop: 16 }}>
          <span className="tag">Servidor</span><span>{erroCarga}</span>
          <button type="button" className="btn sm" onClick={recarregar}>Tentar de novo</button>
        </div>
      )}

      {vicios === null ? (
        <p className="note" style={{ marginTop: 16 }}>Carregando…</p>
      ) : vicios.length ? (
        <div className="grid g-2 vicios" style={{ marginTop: 16 }}>
          {vicios.map((v) => <CartaoVicio key={v.id} v={v} hoje={hoje} recarregar={recarregar} />)}
        </div>
      ) : !erroCarga && (
        <div className="card" style={{ marginTop: 16 }}>
          <Vazio titulo="Nenhum vício na contagem ainda.">Escolha um acima e o contador começa hoje. Cada dia conta.</Vazio>
        </div>
      )}
    </section>
  );
}
