// Baixar e instalar: painel, extensão e instalação como app
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { REPO_URL } from '../config.js';
import telaPainel from '../assets/telas/painel.webp';
import telaBloqueios from '../assets/telas/bloqueios.webp';
import '../styles/site.css';
import './Baixar.css';

export default function Baixar() {
  useEffect(() => window.scrollTo(0, 0), []);

  return (
    <div className="site">
      <Header />

      <section className="s-conteudo baixar-topo">
        <div className="baixar-topo-texto">
          <p className="s-rotulo">Baixar e instalar</p>
          <h1>Pronto em dois minutos.</h1>
          <p className="s-texto">São duas partes: o painel, que fica neste site e guarda as suas regras, e a extensão do navegador, que bloqueia os sites e as pesquisas.</p>
        </div>
        <div className="baixar-requisitos">
          <span className="s-rotulo">Requisitos</span>
          <div><span>Navegador</span><b>Chrome, Edge, Brave ou Opera</b></div>
          <div><span>Aparelho</span><b>Computador</b></div>
          <div><span>Conta</span><b>Local, sem servidor</b></div>
        </div>
      </section>

      {/* 01 Extensão */}
      <section className="s-conteudo baixar-bloco">
        <div className="baixar-cartao claro">
          <div className="baixar-cartao-texto">
            <span className="baixar-numero">01</span>
            <h2>Instale a extensão</h2>
            <p className="s-texto">É ela que troca o site ou a pesquisa bloqueada pela tela de aviso. O painel mostra "Extensão conectada" quando tudo estiver certo.</p>
            <div className="baixar-botoes">
              <a className="sbtn sbtn-escuro" href={`${REPO_URL}/archive/refs/heads/main.zip`}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 2v10M4.5 7.5L9 12l4.5-4.5M3 16h12" /></svg>
                Baixar o projeto (.zip)
              </a>
              <a className="sbtn sbtn-linha" href={`${REPO_URL}/tree/main/extension`} target="_blank" rel="noopener noreferrer">Ver no GitHub</a>
            </div>
          </div>
          <ol className="baixar-passos">
            <li><span>1.1</span><p>Descompacte o arquivo baixado. A extensão é a pasta <code>extension</code>.</p></li>
            <li><span>1.2</span><p>No navegador, acesse <code>chrome://extensions</code> (no Edge, <code>edge://extensions</code>; no Brave, <code>brave://extensions</code>).</p></li>
            <li><span>1.3</span><p>Ligue o <b>Modo do desenvolvedor</b> e clique em <b>Carregar sem compactação</b>.</p></li>
            <li><span>1.4</span><p>Escolha a pasta <code>extension</code>.</p></li>
            <li><span>1.5</span><p>Em <b>Detalhes</b> da extensão, ative <b>Permitir no modo anônimo</b>.</p></li>
          </ol>
        </div>
      </section>

      {/* 02 Painel */}
      <section className="s-conteudo baixar-bloco">
        <div className="baixar-cartao s-escuro">
          <div className="baixar-cartao-texto">
            <span className="baixar-numero invertido">02</span>
            <h2>Crie a sua conta e entre no painel</h2>
            <p className="s-texto">Nome, e-mail e senha. A senha é a mesma que confirma cada liberação, depois do prazo de espera (7 dias, ou o que você escolher em Ajustes). A conta fica só neste navegador.</p>
            <p className="s-texto">Quer o painel numa janela própria? Em Ajustes, clique em <b>Instalar o Distraction Block</b>.</p>
            <div className="baixar-botoes">
              <Link className="sbtn sbtn-branco grande" to="/cadastro">Criar conta</Link>
            </div>
          </div>
          <figure className="s-tela baixar-imagem">
            <div className="s-tela-moldura"><img src={telaPainel} alt="Painel do Distraction Block" /></div>
          </figure>
        </div>
      </section>

      {/* 03 Primeiro bloqueio */}
      <section className="s-conteudo baixar-bloco ultimo">
        <div className="baixar-cartao s-escuro invertido">
          <figure className="s-tela baixar-imagem">
            <div className="s-tela-moldura"><img src={telaBloqueios} alt="Tela Bloqueios com sugestões rápidas" /></div>
          </figure>
          <div className="baixar-cartao-texto">
            <span className="baixar-numero invertido">03</span>
            <h2>Bloqueie a primeira distração</h2>
            <p className="s-texto">Comece pelo que mais rouba o seu tempo. Use as sugestões com um clique ou digite o endereço ou a palavra.</p>
            <div className="baixar-chips">
              <span>+ instagram.com</span><span>+ tiktok.com</span><span>+ youtube.com</span><span>+ aposta</span>
            </div>
            <div className="baixar-botoes">
              <Link className="sbtn sbtn-branco" to="/painel/bloqueios">Ir para Bloqueios</Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
