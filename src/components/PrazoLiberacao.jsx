// Ajustes › Prazo para liberar: 4, 7, 14, 30 dias ou outro número
// Aumentar vale na hora. Diminuir também é uma liberação: vira um pedido.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Modal, { BotaoModal } from './Modal.jsx';
import { Citacao } from './Pecas.jsx';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';
import { firstName, fmtDateTime, fmtLeft, mensagemAleatoria, pedidoAberto } from '../dados/formato.js';
import './PrazoLiberacao.css';

function AumentarPrazo({ dias, pedido }) {
  const { acoes } = useEstado();
  const { act } = useUI();
  return (
    <Modal
      tag="Prazo para liberar"
      title={`Aumentar para ${dias} dias?`}
      actions={
        <>
          <BotaoModal kind="primary" onClick={() => act(() => acoes.mudarPrazo(dias), `Prazo aumentado para ${dias} dias.`)}>
            Aumentar para {dias} dias
          </BotaoModal>
          <BotaoModal kind="ghost">Cancelar</BotaoModal>
        </>
      }
    >
      <p>Vale na hora para os próximos pedidos de liberação. Os pedidos que já estão abertos mantêm o prazo deles.</p>
      <p>Atenção: para voltar a um prazo menor depois, você vai precisar esperar <b>{dias} dias</b>.</p>
      {pedido && <p>O pedido aberto para diminuir o prazo para {pedido.days} dias será cancelado.</p>}
    </Modal>
  );
}

function DiminuirPrazo({ dias }) {
  const { S, acoes } = useEstado();
  const { act } = useUI();
  const [frase] = useState(() => mensagemAleatoria(S));
  const atual = S.delayDays;
  return (
    <Modal
      tag="Pedido de liberação"
      title={`Diminuir para ${dias} dias?`}
      actions={
        <>
          <BotaoModal kind="ghost" onClick={() => act(() => acoes.mudarPrazo(dias), 'Pedido criado. Acompanhe em Liberações.')}>
            Pedir mudança
          </BotaoModal>
          <BotaoModal kind="primary">Manter {atual} dias</BotaoModal>
        </>
      }
    >
      <p>
        Diminuir o prazo também é uma liberação. Ele continua em {atual} dias durante os próximos {atual} dias.
        Depois disso, você confirma com a senha em Liberações.
      </p>
      {S.trusted && <p>Também vai precisar da aprovação de {S.trusted.name}.</p>}
      <p>Você pode desistir do pedido a qualquer momento.</p>
      <Citacao>{frase}</Citacao>
    </Modal>
  );
}

export default function PrazoLiberacao() {
  const { S, agora } = useEstado();
  const { abrirModal } = useUI();
  const atual = S.delayDays;
  const opcoes = S.delayOptions;
  const pedido = S.requests.find((r) => r.kind === 'delay' && pedidoAberto(r));

  const [escolha, setEscolha] = useState(atual);
  const [outro, setOutro] = useState('');
  const [erro, setErro] = useState('');

  // Quando o prazo muda ou um pedido é criado (aqui ou em outra aba), a seleção volta para o prazo atual
  const pedidoId = pedido ? pedido.id : null;
  useEffect(() => {
    if (opcoes.includes(atual)) { setEscolha(atual); setOutro(''); }
    else { setEscolha('outro'); setOutro(String(atual)); }
    setErro('');
  }, [atual, opcoes, pedidoId]);

  const dias = escolha === 'outro' ? Number(outro) : escolha;
  const valido = Number.isInteger(dias) && dias >= S.delayMin && dias <= S.delayMax;
  const mudou = valido && dias !== atual;

  function escolher(v) {
    setErro('');
    setEscolha(v);
  }

  function salvar(e) {
    e.preventDefault();
    setErro('');
    if (!valido) return setErro(`Escolha um prazo entre ${S.delayMin} e ${S.delayMax} dias.`);
    if (!mudou) return;
    if (dias < atual && pedido) return setErro('Já existe um pedido para diminuir o prazo. Desista dele em Liberações para fazer outro.');
    abrirModal(dias > atual ? <AumentarPrazo dias={dias} pedido={pedido} /> : <DiminuirPrazo dias={dias} />);
  }

  const rotuloBotao = !mudou ? 'Salvar prazo' : dias > atual ? `Aumentar para ${dias} dias` : `Pedir para diminuir`;
  const tn = S.trusted ? firstName(S.trusted.name) : '';

  return (
    <div className="card frame" id="prazo">
      <div className="card-head">
        <h2>Prazo para liberar</h2>
        <span className="pill solid">{atual} dias</span>
      </div>
      <p className="sub">
        Quanto tempo um bloqueio continua valendo depois que você pede a liberação.
        Aumentar vale na hora. Diminuir também é uma liberação: espera o prazo atual{tn ? `, ${tn} aprova` : ''} e você confirma com a senha.
      </p>

      <form className="prazo-form" onSubmit={salvar}>
        <div className="seg prazo-seg" role="radiogroup" aria-label="Prazo para liberar">
          {opcoes.map((d) => (
            <button key={d} type="button" role="radio" aria-checked={escolha === d} className={escolha === d ? 'on' : ''} onClick={() => escolher(d)}>
              {d} dias
            </button>
          ))}
          <button type="button" role="radio" aria-checked={escolha === 'outro'} className={escolha === 'outro' ? 'on' : ''} onClick={() => escolher('outro')}>
            Outro
          </button>
        </div>

        {escolha === 'outro' && (
          <label className="prazo-outro">
            <input
              className="input"
              type="number"
              inputMode="numeric"
              min={S.delayMin}
              max={S.delayMax}
              step={1}
              autoFocus
              placeholder={`${S.delayMin} a ${S.delayMax}`}
              aria-label="Número de dias"
              value={outro}
              onChange={(e) => { setErro(''); setOutro(e.target.value); }}
            />
            <span>dias</span>
          </label>
        )}

        <button className={'btn' + (mudou ? ' primary' : '')} type="submit" disabled={!mudou}>{rotuloBotao}</button>
      </form>
      <p className="form-error">{erro}</p>

      {pedido && (
        <div className="prazo-pedido">
          <div>
            <b>Pedido para diminuir de {pedido.from} para {pedido.days} dias</b>
            <span>
              Feito em {fmtDateTime(pedido.createdAt)} · {pedido.status === 'ready' ? 'prazo cumprido' : `faltam ${fmtLeft(pedido.availableAt - agora)}`}
            </span>
          </div>
          <Link className="btn sm" to="/painel/liberacoes">Ver em Liberações</Link>
        </div>
      )}

      <p className="note">Os pedidos que já estão abertos mantêm o prazo com que foram feitos. Mínimo de {S.delayMin} e máximo de {S.delayMax} dias.</p>
    </div>
  );
}
