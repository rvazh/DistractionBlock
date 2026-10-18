// Mensagens de melhora: escolha quais padrões usar e escreva as suas
import { useState } from 'react';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';
import { PageHead, Switch, Vazio } from '../components/Pecas.jsx';
import './Mensagens.css';

export default function Mensagens() {
  const { S, acoes } = useEstado();
  const { act, toast } = useUI();
  const [texto, setTexto] = useState('');
  const [erro, setErro] = useState('');

  const padroes = S.mensagensPadrao || [];
  const desligadas = new Set(S.disabledDefaults || []);
  const emUso = padroes.filter((m) => !desligadas.has(m)).length;
  const total = S.customMessages.length + emUso;

  async function adicionar(e) {
    e.preventDefault();
    setErro('');
    try { await acoes.adicionarMensagem(texto); setTexto(''); toast('Mensagem adicionada.'); }
    catch (x) { setErro(x.message); }
  }

  return (
    <section className="page">
      <PageHead tag="Mensagens de melhora" title="Mensagens"
        desc="Na tela de bloqueio aparece uma destas, sorteada. Escolha quais padrões usar e escreva as suas."
        right={<span className="pill solid">{total || padroes.length} em uso</span>} />

      <div className="grid g-msg">
        <div className="card frame">
          <div className="card-head"><h2>Suas mensagens</h2><span className="tag">{S.customMessages.length} personalizadas</span></div>
          <form className="add-row" onSubmit={adicionar}>
            <input className="input" placeholder="Escreva a sua mensagem" maxLength={240} value={texto} onChange={(e) => setTexto(e.target.value)} aria-label="Nova mensagem" />
            <button className="btn primary" type="submit">Adicionar</button>
          </form>
          <p className="form-error">{erro}</p>
          {S.customMessages.length ? (
            <ul className="msg-list">
              {S.customMessages.map((m, i) => (
                <li key={i + m}>
                  <span className="msg-text">{m}</span>
                  <button className="btn sm ghost" type="button" onClick={() => act(() => acoes.removerMensagem(i), 'Mensagem removida.')}>Remover</button>
                </li>
              ))}
            </ul>
          ) : (
            <Vazio titulo="Nenhuma ainda.">Uma frase sua, na hora certa, costuma funcionar melhor que qualquer outra.</Vazio>
          )}
        </div>

        <div className="card">
          <div className="card-head wrap">
            <div>
              <h2>Mensagens padrão</h2>
              <p className="sub" style={{ margin: 0 }}>{emUso} de {padroes.length} em uso</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn sm" type="button" disabled={emUso === padroes.length} onClick={() => act(() => acoes.usarTodasPadrao(true))}>Usar todas</button>
              <button className="btn sm ghost" type="button" disabled={emUso === 0} onClick={() => act(() => acoes.usarTodasPadrao(false))}>Desligar todas</button>
            </div>
          </div>
          {!total && <p className="note" style={{ margin: '0 0 8px' }}>Sem nenhuma mensagem em uso, o app volta a mostrar as padrão.</p>}
          <ul className="msg-list toggles">
            {padroes.map((m) => {
              const on = !desligadas.has(m);
              return (
                <li key={m} className={on ? '' : 'off'}>
                  <span className="msg-text">{m}</span>
                  <Switch on={on} label={(on ? 'Desligar: ' : 'Usar: ') + m} onToggle={() => act(() => acoes.usarMensagemPadrao(m, !on))} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
