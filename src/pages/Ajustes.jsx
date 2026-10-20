// Ajustes: prazo para liberar, estilos, plano, conta, senha, extensão, instalação e pessoa de confiança
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';
import { PageHead } from '../components/Pecas.jsx';
import PrazoLiberacao from '../components/PrazoLiberacao.jsx';
import Estilos from '../components/Estilos.jsx';
import { COBRANCA_ATIVA, PRECO_PRO, usoDoPlano } from '../dados/planos.js';
import { abertoComoApp, aparelhoAtual, instalarApp, podeInstalar } from '../dados/instalar.js';
import { REPO_URL } from '../config.js';
import './Ajustes.css';

function InstalarApp() {
  const { toast } = useUI();
  const [, atualizar] = useState(0);

  useEffect(() => {
    const f = () => atualizar((n) => n + 1);
    window.addEventListener('db:instalacao', f);
    return () => window.removeEventListener('db:instalacao', f);
  }, []);

  const jaInstalado = abertoComoApp();
  const aparelho = aparelhoAtual();

  async function instalar() {
    const r = await instalarApp();
    if (r === 'aceitou') toast('Instalado. Ele aparece junto com os seus programas.');
  }

  return (
    <div className="card frame">
      <div className="card-head">
        <h2>Instalar como app</h2>
        <span className={'pill' + (jaInstalado ? ' solid' : '')}>{jaInstalado ? 'Instalado' : 'Opcional'}</span>
      </div>
      <p className="sub">Abre numa janela própria, com ícone na área de trabalho e na barra de tarefas, como no CIFRA.</p>
      {jaInstalado ? (
        <p className="note">Você está usando a versão instalada.</p>
      ) : podeInstalar() ? (
        <button className="btn primary" type="button" onClick={instalar}>Instalar o Distraction Block</button>
      ) : aparelho === 'iphone' ? (
        <p className="note">No Safari, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.</p>
      ) : (
        <p className="note">No Chrome ou no Edge, clique no ícone de instalar na barra de endereço (o monitor com uma seta) ou no menu <b>⋮ › Instalar Distraction Block</b>.</p>
      )}
    </div>
  );
}

// Plano atual e quanto do limite do Gratuito já foi usado
function SeuPlano() {
  const { S } = useEstado();
  const navigate = useNavigate();
  return (
    <div className="card" id="plano">
      <div className="card-head">
        <h2>Seu plano</h2>
        <span className="pill solid">Gratuito</span>
      </div>
      <p className="sub">
        {COBRANCA_ATIVA
          ? `O Pro custa R$ ${PRECO_PRO.valor} por ${PRECO_PRO.periodo}: bloqueio ilimitado, estilos, mensagens suas e gráfico de 30 dias.`
          : 'Fase de lançamento: o Pro está liberado para todos, sem cobrança. Os limites abaixo ainda não travam nada.'}
      </p>
      <ul className="uso">
        {usoDoPlano(S).map((u) => {
          const pct = Math.min(100, (u.usado / u.limite) * 100);
          const passou = u.usado > u.limite;
          return (
            <li key={u.id} className={passou ? 'passou' : ''}>
              <div className="uso-linha">
                <span>{u.rotulo}{u.emBreve && <small> · em breve</small>}</span>
                <b>{u.usado} de {u.limite}</b>
              </div>
              <div className="uso-trilho"><div style={{ width: `${pct}%` }} /></div>
            </li>
          );
        })}
      </ul>
      <button type="button" className="btn" onClick={() => navigate('/', { state: { secao: 'planos' } })}>
        Ver os planos · Pro R$ {PRECO_PRO.valor}/{PRECO_PRO.periodo}
      </button>
    </div>
  );
}

// Nome e e-mail da conta (o login fica só neste navegador)
function MinhaConta() {
  const { S, acoes } = useEstado();
  const { toast } = useUI();
  const [nome, setNome] = useState(S.account ? S.account.name : '');
  const [email, setEmail] = useState(S.account ? S.account.email : '');
  const [erro, setErro] = useState('');
  const semConta = !S.account;

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await acoes.atualizarConta({ name: nome, email });
      toast('Conta atualizada.');
    } catch (x) {
      setErro(x.message);
    }
  }

  return (
    <div className="card" id="conta">
      <div className="card-head">
        <h2>Minha conta</h2>
        <span className={'pill' + (semConta ? ' alert' : ' solid')}>{semConta ? 'Incompleta' : S.nuvem ? 'Na nuvem' : 'Neste navegador'}</span>
      </div>
      {semConta ? (
        <>
          <p className="sub">A sua conta ainda não tem nome e e-mail. Complete para entrar com e-mail e senha.</p>
          <Link className="btn primary" to="/cadastro">Completar conta</Link>
        </>
      ) : (
        <form className="form-grid" onSubmit={salvar}>
          <input className="input" aria-label="Nome" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          <input className="input" type="email" aria-label="E-mail" placeholder="E-mail" value={email} readOnly={S.nuvem} title={S.nuvem ? 'O e-mail é o do login e não muda por aqui.' : undefined} onChange={(e) => setEmail(e.target.value)} />
          <div><button className="btn" type="submit">Salvar</button></div>
          <p className="form-error">{erro}</p>
        </form>
      )}
    </div>
  );
}

export default function Ajustes() {
  const { S, acoes } = useEstado();
  const { toast } = useUI();
  const ext = S.extensao;
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [erro, setErro] = useState('');

  async function trocarSenha(e) {
    e.preventDefault();
    setErro('');
    try {
      await acoes.trocarSenha(atual, nova);
      setAtual('');
      setNova('');
      toast('Senha alterada.');
    } catch (x) {
      setErro(x.message);
    }
  }

  return (
    <section className="page">
      <PageHead tag="Ajustes" title="Ajustes" desc="Prazo para liberar, estilos, plano, conta, senha, extensão e instalação." />

      <PrazoLiberacao />

      <div style={{ marginTop: 16 }}>
        <Estilos />
      </div>

      <div className="grid g-3" style={{ margin: '16px 0' }}>
        <SeuPlano />
        <MinhaConta />
        <div className="card" id="senha">
          <h2>Trocar senha</h2>
          <p className="sub">É a senha de entrar e de confirmar liberações. Não existe recuperação: guarde em lugar seguro.</p>
          <form className="form-grid" onSubmit={trocarSenha}>
            <input className="input" type="password" autoComplete="current-password" placeholder="Senha atual" aria-label="Senha atual" value={atual} onChange={(e) => setAtual(e.target.value)} />
            <input className="input" type="password" autoComplete="new-password" placeholder="Nova senha (mín. 6 caracteres)" aria-label="Nova senha" value={nova} onChange={(e) => setNova(e.target.value)} />
            <div><button className="btn" type="submit">Salvar nova senha</button></div>
            <p className="form-error">{erro}</p>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Extensão do navegador</h2>
          <span className={'pill' + (ext ? ' solid' : ' alert')}>{ext ? `Conectada · ${ext.nome}` : 'Desconectada'}</span>
        </div>
        <p className="sub">É ela que troca o site ou a pesquisa bloqueada pela tela de aviso. Sem ela, o Distraction Block só guarda as listas.</p>
        <ol className="steps">
          <li>No GitHub, baixe o projeto em <b>Code › Download ZIP</b> e descompacte. A extensão é a pasta <code>extension</code>.</li>
          <li>No Chrome, acesse <code>chrome://extensions</code> (no Edge: <code>edge://extensions</code>).</li>
          <li>Ligue o <b>Modo do desenvolvedor</b> e clique em <b>Carregar sem compactação</b>.</li>
          <li>Selecione a pasta <code>extension</code>.</li>
          <li>Em <b>Detalhes</b> da extensão, ative <b>Permitir no modo anônimo</b>.</li>
          <li>Volte para esta página e recarregue. O status muda para <b>Conectada</b>.</li>
        </ol>
        {ext && !ext.incognito && (
          <p className="note aviso">Falta ativar "Permitir no modo anônimo": numa aba anônima, os bloqueios não valem.</p>
        )}
        <div className="acoes-linha">
          <a className="btn" href={`${REPO_URL}/archive/refs/heads/main.zip`}>Baixar o projeto (.zip)</a>
          <a className="btn ghost" href={`${REPO_URL}/tree/main/extension`} target="_blank" rel="noopener noreferrer">Ver a extensão no GitHub</a>
        </div>
      </div>

      <div className="grid g-3" style={{ marginTop: 16 }}>
        <InstalarApp />
        <div className="card">
          <div className="card-head">
            <h2>Pessoa de confiança</h2>
            <span className={'pill' + (S.trusted ? ' solid' : '')}>{S.trusted ? 'Ativa' : 'Opcional'}</span>
          </div>
          <p className="sub">
            {S.trusted
              ? `${S.trusted.name} precisa aprovar cada liberação. Se negar, uma nova tentativa só depois de mais ${S.delayDays} dias.`
              : `Alguém que precisa concordar antes de qualquer liberação. Se negar, uma nova tentativa só depois de mais ${S.delayDays} dias.`}
          </p>
          <Link className="btn" to="/painel/liberacoes">{S.trusted ? 'Ver em Liberações' : 'Adicionar em Liberações'}</Link>
        </div>
        <div className="card soon">
          <div className="card-head">
            <h2>Bloqueio de apps do Windows</h2>
            <span className="pill">Próxima etapa</span>
          </div>
          <p className="sub">Fechar programas como Discord e Steam precisa de um app instalado no Windows. Um site não tem permissão para isso.</p>
        </div>
      </div>

      <p className="rodape-dados">A conta e os dados ficam só neste navegador. Limpar os dados do site apaga a conta, as listas e a senha.</p>
    </section>
  );
}
