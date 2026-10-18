// Primeira tela: explica a regra dos 7 dias e cria a senha de controle
import { useState } from 'react';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';
import logo from '../assets/logo-branca.png';
import './CriarSenha.css';

export default function CriarSenha() {
  const { acoes } = useEstado();
  const { toast } = useUI();
  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [entendi, setEntendi] = useState(false);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (senha !== repetir) {
      setErro('As senhas não são iguais.');
      return;
    }
    setOcupado(true);
    try {
      await acoes.criarSenha(senha);
      toast('Proteção ativada.');
    } catch (x) {
      setErro(x.message);
    }
    setOcupado(false);
  }

  return (
    <section className="onboarding">
      <div className="ob-card">
        <img src={logo} className="ob-logo" alt="" />
        <p className="tag">Configuração inicial</p>
        <h1>Mire no que importa.</h1>
        <p className="ob-lead">
          O Distraction Block bloqueia os sites e as pesquisas que roubam o seu tempo. Antes de começar, entenda a regra principal:
        </p>
        <ol className="ob-rules">
          <li><b>Bloquear é imediato.</b> Adicionar um site ou uma palavra vale na hora.</li>
          <li><b>Liberar leva 7 dias.</b> Você faz o pedido e só depois confirma com a senha.</li>
          <li><b>Quem bloqueia é a extensão.</b> Instale a extensão do Distraction Block no navegador (passo a passo em Ajustes).</li>
        </ol>
        <form className="ob-form" onSubmit={enviar} autoComplete="off">
          <label className="field">
            <span className="tag">Senha de controle</span>
            <input className="input" type="password" minLength={6} required value={senha} onChange={(e) => setSenha(e.target.value)} />
          </label>
          <label className="field">
            <span className="tag">Repita a senha</span>
            <input className="input" type="password" minLength={6} required value={repetir} onChange={(e) => setRepetir(e.target.value)} />
          </label>
          <label className="check">
            <input type="checkbox" required checked={entendi} onChange={(e) => setEntendi(e.target.checked)} />
            <span>Entendo que não existe "esqueci minha senha". Vou guardar essa senha em lugar seguro.</span>
          </label>
          <p className="form-error">{erro}</p>
          <button className="btn primary" type="submit" disabled={ocupado}>
            {ocupado ? 'Ativando…' : 'Ativar proteção'}
          </button>
        </form>
      </div>
    </section>
  );
}
