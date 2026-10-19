// Botão pequeno acima do atendimento, com a logo do CIFRA (o mesmo que o CIFRA tem com a logo do Distraction Block).
// Ao clicar, abre um balão "Conhecer o CIFRA" que leva para o site do CIFRA.
import { useEffect, useRef, useState } from 'react';
import logoCifra from '../assets/cifra-logo.png';
import { CIFRA_URL } from '../config.js';
import './BotaoCifra.css';

export default function BotaoCifra() {
  const [aberto, setAberto] = useState(false);
  const area = useRef(null);

  // Fecha com Esc ou clicando fora
  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = (e) => e.key === 'Escape' && setAberto(false);
    const aoClicar = (e) => !area.current?.contains(e.target) && setAberto(false);
    window.addEventListener('keydown', aoTeclar);
    document.addEventListener('mousedown', aoClicar);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('mousedown', aoClicar);
    };
  }, [aberto]);

  if (!CIFRA_URL) return null; // sem o endereço do CIFRA em config.js, o botão fica escondido

  return (
    <div className="cfr" ref={area}>
      {aberto && (
        <a id="cfr-balao" className="cfr__balao" href={CIFRA_URL} target="_blank" rel="noopener noreferrer" onClick={() => setAberto(false)}>
          <b>Conhecer o CIFRA</b>
          <small>Organize as suas finanças: contas, metas e orçamento</small>
          <span className="cfr__seta" aria-hidden="true">→</span>
        </a>
      )}
      <button
        type="button"
        className={aberto ? 'cfr__botao cfr__botao--aberto' : 'cfr__botao'}
        aria-expanded={aberto}
        aria-controls="cfr-balao"
        aria-label="CIFRA: conhecer o app de finanças"
        title="CIFRA"
        onClick={() => setAberto(!aberto)}
      >
        <img src={logoCifra} alt="" />
      </button>
    </div>
  );
}
