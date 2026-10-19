// Botão flutuante no canto inferior direito, igual ao do CIFRA:
// escolhe ser atendido pelo WhatsApp ou por e-mail. Acima dele fica o botão do CIFRA.
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { EMAIL_SUPORTE, WHATSAPP_ATENDIMENTO } from '../config.js';
import BotaoCifra from './BotaoCifra.jsx';
import './BotaoAtendimento.css';

const MENSAGEM = 'Olá! Vim pelo site do Distraction Block e preciso de ajuda.';

function Svg({ tamanho = 24, espessura = 2, children }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}
const IconeAtendimento = (p) => (
  <Svg {...p}>
    <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
    <rect x="3" y="13" width="4" height="6" rx="1.5" />
    <rect x="17" y="13" width="4" height="6" rx="1.5" />
    <path d="M19 19c0 1.7-1.8 3-4 3h-2" />
  </Svg>
);
const IconeWhatsApp = (p) => (
  <Svg {...p}>
    <path d="M4 20l1.3-3.9A8 8 0 1 1 8 19l-4 1z" />
    <path d="M9.5 9.5c0 2.5 2.5 5 5 5l1-1.2-1.8-.8-.7.7c-.9-.4-1.8-1.3-2.2-2.2l.7-.7-.8-1.8z" />
  </Svg>
);
const IconeEmail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M4 7l8 6 8-6" />
  </Svg>
);

export default function BotaoAtendimento() {
  const [aberto, setAberto] = useState(false);
  // Dentro do painel o botão tem efeito ao passar o mouse; no site é só o clique (como no CIFRA)
  const noPainel = useLocation().pathname.startsWith('/painel');
  const caixa = useRef(null);
  const botao = useRef(null);

  // Fecha com Esc ou clicando fora
  useEffect(() => {
    if (!aberto) return undefined;
    const aoTeclar = (e) => {
      if (e.key === 'Escape') {
        setAberto(false);
        botao.current?.focus();
      }
    };
    const aoClicar = (e) => {
      if (!caixa.current?.contains(e.target) && !botao.current?.contains(e.target)) setAberto(false);
    };
    window.addEventListener('keydown', aoTeclar);
    document.addEventListener('mousedown', aoClicar);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('mousedown', aoClicar);
    };
  }, [aberto]);

  const linkWhatsApp = `https://wa.me/${WHATSAPP_ATENDIMENTO.numero}?text=${encodeURIComponent(MENSAGEM)}`;
  // E-mail: abre o Gmail já com o e-mail de suporte, o assunto e uma mensagem inicial
  const linkEmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(EMAIL_SUPORTE)}&su=${encodeURIComponent('Atendimento Distraction Block')}&body=${encodeURIComponent(MENSAGEM)}`;

  return (
    <div className="atd">
      {aberto && (
        <div ref={caixa} id="atd-opcoes" className="atd__caixa" role="dialog" aria-label="Fale com a gente">
          <div className="atd__topo">
            <b>Fale com a gente</b>
            <span>Escolha como prefere ser atendido.</span>
          </div>
          <a className="atd__opcao atd__opcao--whatsapp" href={linkWhatsApp} target="_blank" rel="noopener noreferrer" onClick={() => setAberto(false)}>
            <span className="atd__icone"><IconeWhatsApp tamanho={20} /></span>
            <span className="atd__textos">
              <b>WhatsApp</b>
              <small>{WHATSAPP_ATENDIMENTO.texto}</small>
            </span>
          </a>
          <a className="atd__opcao atd__opcao--email" href={linkEmail} target="_blank" rel="noopener noreferrer" onClick={() => setAberto(false)}>
            <span className="atd__icone"><IconeEmail tamanho={20} /></span>
            <span className="atd__textos">
              <b>E-mail</b>
              <small>{EMAIL_SUPORTE}</small>
            </span>
          </a>
        </div>
      )}

      {!aberto && <BotaoCifra />}

      <button
        ref={botao}
        type="button"
        className={['atd__botao', noPainel ? 'atd__botao--efeito' : '', aberto ? 'atd__botao--aberto' : ''].join(' ')}
        aria-expanded={aberto}
        aria-controls="atd-opcoes"
        aria-label={aberto ? 'Fechar atendimento' : 'Atendimento: WhatsApp ou e-mail'}
        title="Atendimento"
        onClick={() => setAberto(!aberto)}
      >
        {aberto ? <span className="atd__x" aria-hidden="true">×</span> : <IconeAtendimento tamanho={21} />}
      </button>
    </div>
  );
}
