// Criar conta: nome, e-mail e senha (a senha também confirma as liberações)
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Acesso from '../components/Acesso.jsx';
import { useEstado } from '../contexto/Estado.jsx';

export default function Cadastro() {
  const { S, acoes } = useEstado();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state && location.state.de) || '/painel';
  const jaTinhaSenha = S.hasPassword && !S.account;

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [entendi, setEntendi] = useState(false);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  if (S.account) return <Navigate to={S.logado ? destino : '/entrar'} replace state={location.state} />;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (!jaTinhaSenha && senha !== repetir) {
      setErro('As senhas não são iguais.');
      return;
    }
    setOcupado(true);
    try {
      await acoes.criarConta({ name: nome, email, password: senha }, true);
      navigate(destino, { replace: true });
    } catch (x) {
      setErro(x.message);
      setOcupado(false);
    }
  }

  return (
    <Acesso
      rotulo="Criar conta"
      titulo="Mire no que importa."
      texto={jaTinhaSenha
        ? 'Complete a sua conta com nome e e-mail. Use a senha de controle que você já criou.'
        : 'Crie a sua conta para abrir o painel. A senha também é a que confirma cada liberação, depois dos 7 dias.'}
    >
      <form className="acesso-campos" onSubmit={enviar}>
        <label className="field">
          <span className="tag">Nome</span>
          <input className="input" autoComplete="name" required autoFocus value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="field">
          <span className="tag">E-mail</span>
          <input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="field">
          <span className="tag">{jaTinhaSenha ? 'Senha de controle atual' : 'Senha (mín. 6 caracteres)'}</span>
          <input className="input" type="password" autoComplete={jaTinhaSenha ? 'current-password' : 'new-password'} minLength={6} required value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        {!jaTinhaSenha && (
          <>
            <label className="field">
              <span className="tag">Repita a senha</span>
              <input className="input" type="password" autoComplete="new-password" minLength={6} required value={repetir} onChange={(e) => setRepetir(e.target.value)} />
            </label>
            <label className="check">
              <input type="checkbox" required checked={entendi} onChange={(e) => setEntendi(e.target.checked)} />
              <span>Entendo que não existe "esqueci minha senha". Vou guardar essa senha em lugar seguro.</span>
            </label>
          </>
        )}
        <p className="form-error" role="alert">{erro}</p>
        <button className="btn primary" type="submit" disabled={ocupado}>{ocupado ? 'Criando…' : 'Criar conta e entrar'}</button>
      </form>
      <p className="acesso-rodape">
        A conta fica só neste navegador, sem servidor. {S.hasPassword && <>Já tem conta? <Link to="/entrar">Entrar</Link></>}
      </p>
    </Acesso>
  );
}
