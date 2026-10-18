// Janelas usadas nos pedidos de liberação (Bloqueios e Liberações)
import { useState } from 'react';
import Modal, { BotaoModal } from './Modal.jsx';
import { Citacao } from './Pecas.jsx';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';
import { DAY, firstName, fmtDate, mensagemAleatoria } from '../dados/formato.js';

export function PedirLiberacao({ lista, valor, oQue }) {
  const { S, acoes } = useEstado();
  const { act } = useUI();
  const [frase] = useState(() => mensagemAleatoria(S));
  return (
    <Modal
      tag="Pedido de liberação"
      title={`Liberar ${valor}?`}
      actions={
        <>
          <BotaoModal kind="ghost" onClick={() => act(() => acoes.pedirLiberacao(lista, valor), `Pedido criado. Disponível em ${S.delayDays} dias.`)}>
            Pedir liberação
          </BotaoModal>
          <BotaoModal kind="primary">Manter bloqueado</BotaoModal>
        </>
      }
    >
      <p>O {oQue} continua bloqueado durante {S.delayDays} dias. Depois desse prazo, você confirma com a senha, se ainda quiser.</p>
      {S.trusted && <p>Também vai precisar da aprovação de {S.trusted.name}.</p>}
      <p>Você pode desistir do pedido a qualquer momento.</p>
      <Citacao>{frase}</Citacao>
    </Modal>
  );
}

export function ConfirmarLiberacao({ pedido }) {
  const { S, acoes } = useEstado();
  const { act, toast } = useUI();
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [frase] = useState(() => mensagemAleatoria(S));
  return (
    <Modal
      tag="Última chance"
      title="Ainda quer liberar?"
      actions={
        <>
          <BotaoModal
            kind="danger"
            onClick={async () => {
              try {
                await acoes.liberar(pedido.id, senha);
                toast('Liberado.');
                return true;
              } catch (e) {
                setErro(e.message);
                return false;
              }
            }}
          >
            Liberar
          </BotaoModal>
          <BotaoModal kind="primary" onClick={() => act(() => acoes.desistir(pedido.id), 'Boa escolha. Continua bloqueado.')}>
            Manter bloqueado
          </BotaoModal>
        </>
      }
    >
      <p>Faz {S.delayDays} dias que você pediu isso. Se a vontade passou, mantenha bloqueado: é exatamente para isso que o prazo existe.</p>
      <Citacao pequena>{frase}</Citacao>
      <label className="field">
        <span className="tag">Senha</span>
        <input className="input" type="password" autoFocus placeholder="Sua senha de controle" value={senha} onChange={(e) => setSenha(e.target.value)} />
      </label>
      <p className="form-error">{erro}</p>
    </Modal>
  );
}

export function InserirCodigo({ pedido }) {
  const { S, acoes } = useEstado();
  const { toast } = useUI();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const nome = firstName(S.trusted.name);
  return (
    <Modal
      tag="Aprovação"
      title={`Código de ${nome}`}
      actions={
        <>
          <BotaoModal
            kind="primary"
            onClick={async () => {
              try {
                await acoes.aprovarComCodigo(pedido.id, codigo);
                toast('Aprovado.');
                return true;
              } catch (e) {
                setErro(e.message);
                return false;
              }
            }}
          >
            Aprovar
          </BotaoModal>
          <BotaoModal kind="ghost">Cancelar</BotaoModal>
        </>
      }
    >
      <p>Digite o código que {nome} mandou na resposta. Cada código vale uma vez.</p>
      <label className="field">
        <span className="tag">Código de aprovação</span>
        <input
          className="input code-input"
          autoFocus
          placeholder="XXXX-XXXX"
          maxLength={9}
          autoComplete="off"
          spellCheck={false}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
        />
      </label>
      <p className="form-error">{erro}</p>
    </Modal>
  );
}

export function RegistrarNegacao({ pedido }) {
  const { S, acoes } = useEstado();
  const { act } = useUI();
  const ate = fmtDate(Date.now() + S.delayDays * DAY);
  return (
    <Modal
      tag="Resposta"
      title={`${firstName(S.trusted.name)} negou?`}
      actions={
        <>
          <BotaoModal kind="danger" onClick={() => act(() => acoes.registrarNegacao(pedido.id), 'Registrado. Continua bloqueado.')}>
            Registrar negação
          </BotaoModal>
          <BotaoModal kind="ghost">Voltar</BotaoModal>
        </>
      }
    >
      <p>O pedido é encerrado e continua tudo bloqueado. Uma nova tentativa para isso só a partir de {ate}.</p>
    </Modal>
  );
}
