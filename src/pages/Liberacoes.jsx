// Liberações: quem tem permissão (você + pessoa de confiança) e os pedidos em andamento
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';
import Modal, { BotaoModal } from '../components/Modal.jsx';
import { PageHead, Vazio } from '../components/Pecas.jsx';
import { ConfirmarLiberacao, InserirCodigo, RegistrarNegacao } from '../components/Pedidos.jsx';
import { firstName, fmtDate, fmtDateTime, fmtLeft, initials, LIST_NAMES, mailto, pedidoAberto, plural } from '../dados/formato.js';
import './Liberacoes.css';

// Abre o programa de e-mail (ou o Gmail, se for o padrão do navegador)
function abrirEmail(link) {
  window.location.href = link;
}

/* ---------- Textos de cada pedido ---------- */
function oQue(S, r) {
  if (r.kind === 'trusted') return 'remover você como pessoa de confiança';
  return `liberar ${LIST_NAMES[r.list] || ''} ${r.value}`;
}

export function TituloPedido({ r }) {
  if (r.kind === 'trusted') return <>Remover a pessoa de confiança <code>{r.value}</code></>;
  return <>Liberar {LIST_NAMES[r.list] || ''} <code>{r.value}</code></>;
}

function emailAprovacao(S, r) {
  const t = S.trusted;
  const what = oQue(S, r);
  const corpo = [
    `Oi, ${firstName(t.name)}!`,
    '',
    `Pedi no Distraction Block para ${what}.`,
    `O pedido foi feito em ${fmtDateTime(r.createdAt)} e, pelo prazo, só pode ser liberado a partir de ${fmtDateTime(r.availableAt)}.`,
    '',
    'Se você concorda, me responda com UM dos códigos de aprovação que te enviei (cada código vale uma vez só).',
    `Se acha que não devo, responda NÃO. Aí eu só posso pedir de novo daqui a ${S.delayDays} dias.`,
    '',
    'Obrigado por me ajudar a manter o foco.'
  ].join('\n');
  return mailto(t.email, `Distraction Block: posso ${what}?`, corpo);
}

function emailCodigos(nome, codigos) {
  return [
    `Oi, ${firstName(nome)}!`,
    '',
    'Coloquei você como minha pessoa de confiança no Distraction Block, o app que bloqueia minhas distrações.',
    'Quando eu quiser liberar algum bloqueio, vou te mandar um e-mail pedindo. Se você concordar, me responda com UM destes códigos (cada um vale uma vez). Se não concordar, responda NÃO.',
    '',
    'Guarde estes códigos e não me mostre:',
    '',
    codigos.join('\n'),
    '',
    'Obrigado!'
  ].join('\n');
}

/* ---------- Janelas ---------- */
function Codigos({ nome, email, codigos }) {
  return (
    <Modal tag="Códigos de aprovação" title={`Envie estes códigos para ${firstName(nome)}`} wide
      actions={<>
        <BotaoModal kind="primary" fecha={false} onClick={() => abrirEmail(mailto(email, 'Distraction Block: você é minha pessoa de confiança', emailCodigos(nome, codigos)))}>
          Abrir e-mail para {firstName(nome)}
        </BotaoModal>
        <BotaoModal kind="ghost">Já enviei</BotaoModal>
      </>}>
      <p>São {codigos.length} códigos de uso único. Eles aparecem só agora: envie para {firstName(nome)} e não guarde uma cópia. O app guarda apenas uma versão protegida de cada um.</p>
      <div className="code-grid">{codigos.map((c) => <code key={c}>{c}</code>)}</div>
    </Modal>
  );
}

function EscolherPedido({ pedidos, onEscolher }) {
  const { S } = useEstado();
  const { fecharModal } = useUI();
  return (
    <Modal tag="Solicitar permissão" title={`Qual pedido enviar para ${firstName(S.trusted.name)}?`} wide
      actions={<BotaoModal kind="ghost">Fechar</BotaoModal>}>
      <ul className="pick-list">
        {pedidos.map((r) => (
          <li key={r.id}>
            <div className="txt">
              <b><TituloPedido r={r} /></b>
              <span>{r.approval === 'requested' ? 'Já solicitado em ' + fmtDateTime(r.approvalRequestedAt) : 'Ainda não solicitado'}</span>
            </div>
            <button className="btn sm" type="button" onClick={() => { fecharModal(); onEscolher(r); }}>Solicitar</button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

function SemPedidos() {
  const navigate = useNavigate();
  return (
    <Modal tag="Solicitar permissão" title="Nenhum pedido aguardando aprovação"
      actions={<>
        <BotaoModal kind="primary" onClick={() => navigate('/painel/bloqueios')}>Ir para Bloqueios</BotaoModal>
        <BotaoModal kind="ghost">Fechar</BotaoModal>
      </>}>
      <p>Primeiro peça a liberação de algo em Bloqueios. Depois volte aqui para pedir a permissão.</p>
    </Modal>
  );
}

function RemoverPessoa() {
  const { S, acoes } = useEstado();
  const { act } = useUI();
  const nome = firstName(S.trusted.name);
  return (
    <Modal tag="Pedido de liberação" title={`Remover ${nome}?`}
      actions={<>
        <BotaoModal kind="ghost" onClick={() => act(() => acoes.pedirRemocaoPessoa(), 'Pedido criado.')}>Pedir remoção</BotaoModal>
        <BotaoModal kind="primary">Manter</BotaoModal>
      </>}>
      <p>Remover a pessoa de confiança também é uma liberação: leva {S.delayDays} dias e precisa da aprovação de {nome}.</p>
    </Modal>
  );
}

/* ---------- Cadastro da pessoa ---------- */
function FormPessoa() {
  const { acoes } = useEstado();
  const { abrirModal } = useUI();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [rel, setRel] = useState('');
  const [erro, setErro] = useState('');

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    try {
      const codigos = await acoes.adicionarPessoa({ name: nome, email, relation: rel });
      abrirModal(<Codigos nome={nome} email={email.trim()} codigos={codigos} />);
      setNome(''); setEmail(''); setRel('');
    } catch (x) { setErro(x.message); }
  }

  return (
    <form className="trusted-form" onSubmit={enviar} autoComplete="off">
      <label className="field"><span className="tag">Nome</span>
        <input className="input" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
      </label>
      <label className="field"><span className="tag">E-mail</span>
        <input className="input" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="field"><span className="tag">Relação</span>
        <input className="input" placeholder="Opcional, ex.: amigo, irmã" value={rel} onChange={(e) => setRel(e.target.value)} />
      </label>
      <div className="tf-actions"><button className="btn primary" type="submit">Adicionar pessoa de confiança</button></div>
      <p className="form-error">{erro}</p>
    </form>
  );
}

/* ---------- Tela ---------- */
export default function Liberacoes() {
  const { S, acoes, agora } = useEstado();
  const { act, toast, abrirModal } = useUI();
  const t = S.trusted;
  const abertos = S.requests.filter(pedidoAberto);
  const encerrados = S.requests.filter((r) => ['applied', 'cancelled', 'denied'].includes(r.status)).slice(0, 20);
  const remocao = abertos.find((r) => r.kind === 'trusted');
  const tn = t ? firstName(t.name) : '';

  async function solicitar(r) {
    try {
      await acoes.solicitarPermissao(r.id);
      abrirEmail(emailAprovacao(S, r));
      toast(`E-mail aberto. Agora é com ${firstName(S.trusted.name)}.`);
    } catch (e) { toast(e.message, true); }
  }

  function solicitarPermissao() {
    const pendentes = abertos.filter((r) => r.needsApproval);
    if (!pendentes.length) return abrirModal(<SemPedidos />);
    if (pendentes.length === 1) return solicitar(pendentes[0]);
    abrirModal(<EscolherPedido pedidos={pendentes} onEscolher={solicitar} />);
  }

  const Check = ({ ok, label, valor }) => (
    <span className={'check-chip' + (ok ? ' ok' : '')}>
      <span className="mark" aria-hidden="true">{ok ? '✓' : '·'}</span><span>{label}: </span><b>{valor}</b>
    </span>
  );

  return (
    <section className="page">
      <PageHead tag="Pedidos de liberação" title="Liberações"
        desc={`Para remover um bloqueio, você faz o pedido e espera ${S.delayDays} dias${t ? `, ${tn} aprova` : ''} e você confirma com a senha. Desistir é imediato.`} />

      {/* Quem tem permissão */}
      <div className="card frame">
        <div className="card-head">
          <div>
            <h2>Quem tem permissão</h2>
            <p className="sub" style={{ margin: 0 }}>{t ? 'Para liberar qualquer coisa, os dois precisam concordar.' : `Hoje só você libera, com a senha, depois de ${S.delayDays} dias.`}</p>
          </div>
        </div>
        <div className="perms">
          <div className="perm">
            <span className="avatar">R</span>
            <div className="perm-main">
              <div className="perm-name"><b>Você</b><span className="pill">Senha de controle</span></div>
              <span className="perm-sub">Confirma a liberação com a senha depois de {S.delayDays} dias.</span>
            </div>
          </div>
          {t ? (
            <div className="perm">
              <span className="avatar solid">{initials(t.name)}</span>
              <div className="perm-main">
                <div className="perm-name">
                  <b>{t.name}</b>
                  {t.relation && <span className="pill">{t.relation}</span>}
                  <span className="pill solid">Pessoa de confiança</span>
                </div>
                <span className="perm-sub">{t.email}</span>
                <dl className="kv">
                  <div><dt>Desde</dt><dd>{fmtDate(t.addedAt)}</dd></div>
                  <div><dt>Códigos restantes</dt><dd>{t.codesLeft} de {t.codesTotal}</dd></div>
                  <div><dt>Aprovou</dt><dd>{t.approvals}</dd></div>
                  <div><dt>Negou</dt><dd>{t.denials}</dd></div>
                </dl>
                <div className="perm-actions">
                  <button className="btn primary" type="button" onClick={solicitarPermissao}>Solicitar permissão</button>
                  {remocao
                    ? <span className="pill">Remoção em andamento</span>
                    : <button className="btn ghost" type="button" onClick={() => abrirModal(<RemoverPessoa />)}>Remover pessoa</button>}
                </div>
              </div>
            </div>
          ) : (
            <div className="perm add">
              <span className="avatar ghost">+</span>
              <div className="perm-main">
                <div className="perm-name"><b>Pessoa de confiança</b><span className="pill">Opcional</span></div>
                <span className="perm-sub">Alguém que precisa concordar antes de qualquer liberação. Você pede por e-mail; se a pessoa concordar, ela responde com um código de aprovação.</span>
                <FormPessoa />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pedidos */}
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-head"><h2>Em andamento</h2><span className="tag">{plural(abertos.length, 'pedido', 'pedidos')}</span></div>
        {abertos.length ? abertos.map((r) => {
          const total = r.availableAt - r.createdAt;
          const pct = Math.min(100, Math.max(0, ((agora - r.createdAt) / total) * 100));
          const prazoOk = r.status === 'ready';
          const podeAplicar = prazoOk && !r.needsApproval;
          let aprovacao = null;
          let botoes = null;
          if (t || r.approval === 'approved') {
            if (r.approval === 'approved') aprovacao = <Check ok label={`Aprovação de ${tn || 'pessoa de confiança'}`} valor="aprovado" />;
            else if (!r.needsApproval) aprovacao = <Check ok label="Aprovação" valor="não precisa" />;
            else if (r.approval === 'requested') {
              aprovacao = <Check label={`Aprovação de ${tn}`} valor="aguardando resposta" />;
              botoes = <>
                <button className="btn sm" type="button" onClick={() => abrirModal(<InserirCodigo pedido={r} />)}>Inserir código</button>
                <button className="btn sm ghost" type="button" onClick={() => abrirModal(<RegistrarNegacao pedido={r} />)}>{tn} negou</button>
                <button className="btn sm ghost" type="button" onClick={() => solicitar(r)}>Reenviar</button>
              </>;
            } else {
              aprovacao = <Check label={`Aprovação de ${tn}`} valor="não solicitada" />;
              botoes = <button className="btn sm" type="button" onClick={() => solicitar(r)}>Solicitar permissão</button>;
            }
          }
          return (
            <div className="req" key={r.id}>
              <div>
                <div className="title"><TituloPedido r={r} /></div>
                <div className="meta">Pedido em {fmtDateTime(r.createdAt)} · prazo até {fmtDateTime(r.availableAt)}</div>
              </div>
              <div className="actions">
                {podeAplicar && <button className="btn sm primary" type="button" onClick={() => abrirModal(<ConfirmarLiberacao pedido={r} />)}>Confirmar liberação</button>}
                <button className="btn sm ghost" type="button" onClick={() => act(() => acoes.desistir(r.id), 'Pedido cancelado. Continua bloqueado.')}>
                  {prazoOk ? 'Manter bloqueado' : 'Desistir'}
                </button>
              </div>
              <div className="progress">
                <div className="track"><div className="fill" style={{ width: `${pct}%` }} /></div>
                <span className="left">{prazoOk ? 'prazo cumprido' : 'faltam ' + fmtLeft(r.availableAt - agora)}</span>
              </div>
              <div className="checks">
                <Check ok={prazoOk} label={`Prazo de ${S.delayDays} dias`} valor={prazoOk ? 'cumprido' : 'em andamento'} />
                {aprovacao}
                {botoes && <div className="check-actions">{botoes}</div>}
              </div>
            </div>
          );
        }) : <Vazio titulo="Nenhum pedido aberto.">Tudo bloqueado continua bloqueado.</Vazio>}
      </div>

      {encerrados.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-head"><h2>Histórico</h2></div>
          <ul className="history">
            {encerrados.map((r) => (
              <li key={r.id}>
                <span><TituloPedido r={r} /></span>
                <span>
                  <span className={'pill' + (r.status === 'applied' ? '' : r.status === 'denied' ? ' alert' : ' solid')}>
                    {{ applied: 'Liberado', cancelled: 'Mantido', denied: 'Negado' }[r.status]}
                  </span>
                  {' '}{r.closedAt ? fmtDate(r.closedAt) : ''}
                  {r.status === 'denied' && r.retryAt > agora ? ` · nova tentativa em ${fmtDate(r.retryAt)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
