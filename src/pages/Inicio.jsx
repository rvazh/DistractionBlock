// Página inicial do site: apresentação do Distraction Block
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import logo from '../assets/logo-branca.png';
import telaPainel from '../assets/telas/painel.webp';
import telaBloqueios from '../assets/telas/bloqueios.webp';
import telaPedido from '../assets/telas/pedido.webp';
import telaAviso from '../assets/telas/aviso.webp';
import telaLiberacoes from '../assets/telas/liberacoes.webp';
import '../styles/site.css';
import './Inicio.css';

const Check = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9.5l4 4 8-9" /></svg>
);

const RECURSOS = [
  {
    titulo: 'Bloqueio de sites',
    texto: 'O domínio inteiro fica fora do ar para você, inclusive versões mobile e subdomínios.',
    icone: <><circle cx="16" cy="16" r="12" /><path d="M4 16h24M16 4c4 4 4 20 0 24M16 4c-4 4-4 20 0 24" /></>,
  },
  {
    titulo: 'Palavras pesquisadas',
    texto: 'Pesquisou "bet" no Google ou no YouTube? A busca nem carrega. Acentos e maiúsculas não enganam o filtro.',
    icone: <><circle cx="14" cy="14" r="9" /><line x1="21" y1="21" x2="29" y2="29" /><line x1="10" y1="14" x2="18" y2="14" /></>,
  },
  {
    titulo: 'Mensagem de melhora',
    texto: 'Cada bloqueio vem com uma frase para te puxar de volta. Escolha as padrão e escreva as suas.',
    icone: <><path d="M5 7h22v14H14l-6 5v-5H5z" /><line x1="10" y1="12" x2="22" y2="12" /><line x1="10" y1="16" x2="18" y2="16" /></>,
  },
  {
    titulo: 'Pessoa de confiança',
    texto: 'Alguém que precisa aprovar cada liberação. Se ela negar, nova tentativa só depois de mais 7 dias.',
    icone: <><circle cx="11" cy="11" r="5" /><circle cx="22" cy="13" r="4" /><path d="M2 27c0-5 4-9 9-9s9 4 9 9M18 27c0-3 2-6 5-6s6 3 6 6" /></>,
  },
  {
    titulo: 'Instala como app',
    texto: 'Abre numa janela própria, com ícone na área de trabalho, igual a um programa.',
    icone: <><rect x="3" y="5" width="26" height="18" rx="3" /><line x1="11" y1="28" x2="21" y2="28" /><path d="M16 9v9M12 14l4 4 4-4" /></>,
  },
  {
    titulo: 'Seus dados ficam com você',
    texto: 'Sem conta e sem servidor: listas, senha e histórico ficam só no seu navegador.',
    icone: <><rect x="6" y="14" width="20" height="14" rx="3" /><path d="M10 14v-4a6 6 0 0 1 12 0v4" /><line x1="16" y1="19" x2="16" y2="23" /></>,
  },
];

const DUVIDAS = [
  ['Por que esperar 7 dias para liberar?', 'Porque a vontade de se distrair dura minutos. Se uma semana depois você ainda quiser liberar, provavelmente é uma decisão de verdade, e não um impulso.'],
  ['E se eu esquecer a senha?', 'Não existe recuperação, para que ninguém (nem você num momento de fraqueza) consiga contornar o bloqueio. Guarde a senha em um lugar seguro.'],
  ['Funciona em quais navegadores?', 'Chrome, Edge, Brave e Opera no computador, com a extensão do Distraction Block instalada.'],
  ['Meus dados vão para algum servidor?', 'Não. Listas, senha e histórico ficam só no seu navegador. O site conversa apenas com a extensão instalada nele.'],
  ['Bloqueia apps do Windows, como Discord e Steam?', 'Ainda não. Fechar programas precisa de um app instalado no Windows, que é a próxima etapa do projeto.'],
  ['Tem versão para celular?', 'Dá para abrir o painel no celular, mas o bloqueio depende da extensão do navegador no computador. A versão para Android está nos próximos passos.'],
];

export default function Inicio() {
  const location = useLocation();

  // Rola até a seção pedida pelo menu (Como funciona, Recursos...)
  useEffect(() => {
    const id = location.state && location.state.secao;
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo(0, 0);
  }, [location.key, location.state]);

  return (
    <div className="site">
      <Header />

      {/* Abertura */}
      <section className="s-conteudo inicio-topo">
        <div className="inicio-hero s-escuro">
          <svg className="inicio-mira" aria-hidden="true" viewBox="0 0 600 600">
            <g className="giro-a" fill="none" stroke="#fff">
              <circle cx="300" cy="300" r="292" strokeWidth="1" strokeDasharray="2 10" />
              <circle cx="300" cy="300" r="200" strokeWidth="1" strokeDasharray="44 32" />
            </g>
            <g className="giro-b" fill="none" stroke="#fff">
              <circle cx="300" cy="300" r="250" strokeWidth="5" strokeDasharray="120 34" />
              <circle cx="300" cy="300" r="150" strokeWidth="4" strokeDasharray="80 30" />
            </g>
            <g stroke="#fff" strokeWidth="5">
              <line x1="300" y1="0" x2="300" y2="70" /><line x1="300" y1="530" x2="300" y2="600" />
              <line x1="0" y1="300" x2="70" y2="300" /><line x1="530" y1="300" x2="600" y2="300" />
            </g>
            <circle cx="300" cy="300" r="9" fill="#fff" />
          </svg>

          <div className="inicio-hero-texto">
            <p className="inicio-sobretitulo">
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="1.6"><circle cx="8" cy="8" r="6" /><circle cx="8" cy="8" r="1.6" fill="#fff" /><line x1="8" y1="0" x2="8" y2="3.5" /><line x1="8" y1="12.5" x2="8" y2="16" /><line x1="0" y1="8" x2="3.5" y2="8" /><line x1="12.5" y1="8" x2="16" y2="8" /></svg>
              Mire no que importa
            </p>
            <h1>O bloqueador que não deixa você voltar atrás.</h1>
            <p className="inicio-lead">Bloqueie sites e até palavras pesquisadas. Bloquear vale na hora. Liberar, <b>só depois de 7 dias</b>.</p>
            <ul className="inicio-checks">
              <li><Check />Sites e pesquisas num só lugar</li>
              <li><Check />Regra dos 7 dias para qualquer liberação</li>
              <li><Check />Uma mensagem de melhora a cada bloqueio</li>
            </ul>
            <div className="inicio-botoes">
              <Link className="sbtn sbtn-branco grande" to="/painel">Abrir o painel</Link>
              <Link className="sbtn sbtn-fantasma grande" to="/baixar">Instalar extensão</Link>
            </div>
          </div>

          {/* Cartão flutuante */}
          <div className="inicio-cartao-area">
            <div className="inicio-cartao">
              <div className="inicio-cartao-topo">
                <span className="inicio-cartao-icone">
                  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" strokeWidth="2"><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2" fill="#0a0a0a" /><line x1="12" y1="1" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="23" /><line x1="1" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="23" y2="12" /></svg>
                </span>
                <span className="inicio-cartao-status"><span className="ponto" />Bloqueando</span>
              </div>
              <div>
                <div className="inicio-cartao-titulo">Modo foco</div>
                <div className="inicio-cartao-sub">Liberação em <span className="mono">6d 23h 15m</span></div>
              </div>
              <div className="inicio-cartao-linhas">
                <div className="inicio-cartao-linha">
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="1.6"><rect x="2" y="3.5" width="14" height="12" rx="2" /><line x1="2" y1="7.5" x2="16" y2="7.5" /><line x1="6" y1="1.5" x2="6" y2="5" /><line x1="12" y1="1.5" x2="12" y2="5" /></svg>
                  Todos os dias
                </div>
                <div className="inicio-cartao-linha">
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="1.6"><circle cx="9" cy="9" r="7" /><path d="M9 5v4l3 2" /></svg>
                  24 horas, sem pausa
                  <span className="inicio-cartao-dias">7d</span>
                </div>
              </div>
              <div className="inicio-cartao-rodape">
                <div className="inicio-avatares">
                  <span>IG</span><span>TT</span><span>YT</span>
                </div>
                <span>+6 sites · 5 palavras</span>
              </div>
            </div>
            <div className="inicio-aviso">
              <span className="inicio-aviso-icone">
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#fff" strokeWidth="2"><circle cx="8" cy="8" r="5.5" /><line x1="12" y1="12" x2="16.5" y2="16.5" /></svg>
              </span>
              <span><b>Pesquisa bloqueada</b><br />"aposta" · agora mesmo</span>
            </div>
          </div>
        </div>
      </section>

      {/* A regra */}
      <section className="s-conteudo inicio-regra" aria-labelledby="regra-t">
        <h2 id="regra-t" className="s-rotulo">A regra que muda tudo</h2>
        <div className="inicio-regra-grade">
          <div><span className="mono">01 · Bloquear</span><strong>Na hora.</strong><p>Adicionou um site ou uma palavra? Já está valendo.</p></div>
          <div><span className="mono">02 · Liberar</span><strong>7 dias.</strong><p>Você faz o pedido, espera uma semana e confirma com a senha.</p></div>
          <div><span className="mono">03 · Desistir</span><strong>Na hora.</strong><p>A vontade passou? Cancele o pedido e siga bloqueado.</p></div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="s-conteudo inicio-secao" aria-labelledby="como-t">
        <div className="inicio-cabeca">
          <h2 id="como-t" className="s-titulo">Três passos. Nenhuma desculpa.</h2>
          <p className="s-texto">Você configura uma vez. Depois, a extensão trabalha em silêncio no navegador.</p>
        </div>
        <div className="inicio-passos">
          <div className="inicio-passo"><span>01</span><h3>Instale a extensão</h3><p>Ela é quem troca o site ou a pesquisa pela tela de aviso. Leva dois minutos.</p></div>
          <div className="inicio-passo"><span>02</span><h3>Escolha o que bloquear</h3><p>Digite um site ou adicione palavras como "aposta" e "fofoca". Vale na hora.</p></div>
          <div className="inicio-passo"><span>03</span><h3>Volte para o que importa</h3><p>Quando a vontade bater, aparece um aviso e uma mensagem para te puxar de volta.</p></div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="inicio-recursos" aria-labelledby="rec-t">
        <div className="s-conteudo">
          <p className="s-rotulo">Recursos</p>
          <h2 id="rec-t" className="s-titulo inicio-recursos-titulo">Tudo o que rouba seu tempo, na mira.</h2>
          <div className="inicio-recursos-grade">
            {RECURSOS.map((r) => (
              <div key={r.titulo} className="inicio-recurso">
                <svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="#0a0a0a" strokeWidth="2">{r.icone}</svg>
                <h3>{r.titulo}</h3>
                <p>{r.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Telas */}
      <section id="telas" className="s-escuro" aria-labelledby="telas-t">
        <div className="s-conteudo inicio-telas">
          <div className="inicio-cabeca">
            <div>
              <p className="s-rotulo">Por dentro do app</p>
              <h2 id="telas-t" className="s-titulo">Um painel que mostra cada "não" que você disse.</h2>
            </div>
            <p className="s-texto">Preto e branco, sem notificações piscando, sem nada disputando sua atenção.</p>
          </div>

          <figure className="s-tela">
            <div className="s-tela-moldura destaque"><img src={telaPainel} alt="Painel do Distraction Block com os bloqueios de hoje, o status da extensão e o gráfico dos últimos 7 dias" /></div>
            <figcaption className="mono pequena">Painel · bloqueios do dia, status da proteção e a mensagem do dia</figcaption>
          </figure>

          <div className="inicio-duas">
            <figure className="s-tela">
              <div className="s-tela-moldura"><img src={telaBloqueios} alt="Tela Bloqueios com sites e palavras na mesma lista" /></div>
              <figcaption><b>Sites e palavras juntos.</b> <span>Sugestões prontas e o status de cada bloqueio.</span></figcaption>
            </figure>
            <figure className="s-tela">
              <div className="s-tela-moldura"><img src={telaPedido} alt="Janela perguntando se deseja liberar um site, com o botão Manter bloqueado em destaque" /></div>
              <figcaption><b>Pedir para liberar dá trabalho.</b> <span>O botão em destaque é sempre "Manter bloqueado".</span></figcaption>
            </figure>
          </div>

          <div className="inicio-lado">
            <div className="inicio-lado-texto">
              <p className="s-rotulo vermelho">Na hora da vontade</p>
              <h3>"Você não deveria pesquisar isso."</h3>
              <p className="s-texto">Em vez da página, aparece a mira, um guia de respiração e uma mensagem de melhora. Respire, leia e volte para o foco.</p>
              <blockquote>Você está construindo uma carreira. Cada minuto conta.</blockquote>
            </div>
            <figure className="s-tela inicio-lado-imagem">
              <div className="s-tela-moldura"><img src={telaAviso} alt="Tela de pesquisa bloqueada com a mira, o termo bloqueado e uma mensagem de melhora" /></div>
            </figure>
          </div>

          <div className="inicio-lado invertido">
            <figure className="s-tela inicio-lado-imagem">
              <div className="s-tela-moldura"><img src={telaLiberacoes} alt="Tela Liberações com a pessoa de confiança e um pedido com contagem de 7 dias" /></div>
            </figure>
            <div className="inicio-lado-texto">
              <p className="s-rotulo">Liberações</p>
              <h3>A vontade passa. O prazo fica.</h3>
              <p className="s-texto">Cada pedido mostra quanto falta. Com uma pessoa de confiança, ela também precisa aprovar. Depois de 7 dias, o app ainda pergunta: "Ainda quer liberar?"</p>
            </div>
          </div>
        </div>
      </section>

      {/* Dúvidas */}
      <section id="duvidas" className="inicio-duvidas" aria-labelledby="faq-t">
        <h2 id="faq-t" className="s-titulo">Dúvidas</h2>
        <div className="inicio-duvidas-lista">
          {DUVIDAS.map(([pergunta, resposta]) => (
            <details key={pergunta}>
              <summary>{pergunta}<span className="mais" aria-hidden="true">+</span></summary>
              <p>{resposta}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Chamada final */}
      <section className="s-conteudo">
        <div className="inicio-final s-escuro">
          <img src={logo} alt="Logo do Distraction Block" />
          <h2>Seu eu de daqui a 7 dias agradece.</h2>
          <p>Instale a extensão, abra o painel e bloqueie a primeira distração em menos de dois minutos.</p>
          <div className="inicio-botoes centro">
            <Link className="sbtn sbtn-branco grande" to="/painel">Abrir o painel</Link>
            <Link className="sbtn sbtn-fantasma grande" to="/baixar">Instalar extensão</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
