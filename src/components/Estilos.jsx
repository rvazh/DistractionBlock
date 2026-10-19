// Ajustes › Estilos (Pro): tema, cor de destaque e imagem de fundo do painel.
// Tudo vale na hora e só depois do login; o site de apresentação continua igual.
import { useRef, useState } from 'react';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';
import { prepararImagem } from '../dados/imagem.js';
import './Estilos.css';

// As mesmas cores de styles/estilos.css (no tema claro elas ficam mais escuras, para dar leitura)
const CORES = [
  { id: 'neutro', nome: 'Neutro', escuro: '#ffffff', claro: '#141414' },
  { id: 'dourado', nome: 'Dourado', escuro: '#eaaf5a', claro: '#95620c' },
  { id: 'verde', nome: 'Verde', escuro: '#5fd38d', claro: '#1d7a45' },
  { id: 'azul', nome: 'Azul', escuro: '#6cb6ff', claro: '#1f5fbf' },
  { id: 'lilas', nome: 'Lilás', escuro: '#b39dff', claro: '#5b45c4' },
  { id: 'coral', nome: 'Coral', escuro: '#ff8a6b', claro: '#bd4328' },
];
const TEMAS = [
  { id: 'escuro', nome: 'Escuro' },
  { id: 'claro', nome: 'Claro' },
];

export default function Estilos() {
  const { S, acoes } = useEstado();
  const { act, toast } = useUI();
  const st = S.style;
  const arquivo = useRef(null);
  const [carregando, setCarregando] = useState(false);
  const [escurecer, setEscurecer] = useState(st.escurecer);
  const padrao = st.tema === 'escuro' && st.cor === 'neutro' && !S.fundo;

  async function escolherImagem(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setCarregando(true);
    try {
      acoes.definirFundo(await prepararImagem(file));
      toast('Imagem de fundo aplicada.');
    } catch (x) {
      toast(x.message, true);
    } finally {
      setCarregando(false);
    }
  }

  function voltarAoPadrao() {
    acoes.removerFundo();
    act(() => acoes.mudarEstilo({ tema: 'escuro', cor: 'neutro', escurecer: 0.6 }), 'Estilo padrão de volta.');
    setEscurecer(0.6);
  }

  return (
    <div className="card" id="estilos">
      <div className="card-head">
        <h2>Estilos <span className="pro-selo">Pro</span></h2>
        {!padrao && <button type="button" className="btn sm ghost" onClick={voltarAoPadrao}>Voltar ao padrão</button>}
      </div>
      <p className="sub">As cores e o fundo do painel. Mudam na hora e valem só depois do login, neste navegador.</p>

      <div className="estilos-grade">
        <div className="estilos-bloco">
          <span className="tag">Tema</span>
          <div className="seg" role="radiogroup" aria-label="Tema">
            {TEMAS.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={st.tema === t.id} className={st.tema === t.id ? 'on' : ''}
                onClick={() => act(() => acoes.mudarEstilo({ tema: t.id }))}>
                {t.nome}
              </button>
            ))}
          </div>

          <span className="tag" style={{ marginTop: 18 }}>Cor de destaque</span>
          <div className="cores" role="radiogroup" aria-label="Cor de destaque">
            {CORES.map((c) => (
              <button key={c.id} type="button" role="radio" aria-checked={st.cor === c.id} className={'cor' + (st.cor === c.id ? ' on' : '')}
                onClick={() => act(() => acoes.mudarEstilo({ cor: c.id }))} title={c.nome}>
                <span className="cor-bola" style={{ background: c[st.tema] }} />
                <span className="cor-nome">{c.nome}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="estilos-bloco">
          <span className="tag">Imagem de fundo</span>
          <div className={'fundo-previa' + (S.fundo ? '' : ' vazia')} style={S.fundo ? { backgroundImage: `url("${S.fundo}")` } : undefined}>
            {S.fundo ? <span style={{ opacity: escurecer }} /> : <p>Nenhuma imagem. Escolha uma foto do seu computador.</p>}
          </div>
          <input ref={arquivo} type="file" accept="image/*" hidden onChange={escolherImagem} />
          <div className="acoes-linha" style={{ marginTop: 12 }}>
            <button type="button" className="btn" disabled={carregando} onClick={() => arquivo.current && arquivo.current.click()}>
              {carregando ? 'Preparando…' : S.fundo ? 'Trocar imagem' : 'Escolher imagem'}
            </button>
            {S.fundo && <button type="button" className="btn ghost" onClick={() => { acoes.removerFundo(); toast('Imagem removida.'); }}>Remover</button>}
          </div>
          {S.fundo && (
            <label className="escurecer">
              <span>Escurecer a imagem</span>
              <input
                type="range" min="0" max="0.9" step="0.05" value={escurecer}
                onChange={(e) => setEscurecer(Number(e.target.value))}
                onPointerUp={() => acoes.mudarEstilo({ escurecer })}
                onKeyUp={() => acoes.mudarEstilo({ escurecer })}
                onBlur={() => acoes.mudarEstilo({ escurecer })}
              />
              <b>{Math.round(escurecer * 100)}%</b>
            </label>
          )}
          <p className="note">A imagem é reduzida e guardada só neste navegador. Dica: fotos escuras ou desfocadas deixam o texto mais fácil de ler.</p>
        </div>
      </div>
    </div>
  );
}
