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
  const [enviadoPara, setEnviadoPara] = useState(''); // e-mail que precisa ser confirmado
  const [reenviado, setReenviado] = useState(false);

  // Conta criada na nuvem: falta abrir o link que chegou por e-mail
  if (enviadoPara) {
    return (
      <Acesso rotulo="Criar conta" titulo="Confirme o seu e-mail." texto={`Enviamos um link para ${enviadoPara}. Abra o e-mail e clique no link: você volta para cá já com a conta confirmada.`}>
        <div className="acesso-aviso">
          {reenviado
            ? 'Enviamos de novo. Olhe também a caixa de spam e as promoções.'
            : <>Não chegou em alguns minutos? <button type="button" className="link-botao" onClick={async () => {
                try { await acoes.reenviarConfirmacao(enviadoPara); setReenviado(true); } catch (x) { setErro(x.message); }
              }}>Reenviar o link</button></>}
        </div>
        <p className="form-error" role="alert">{erro}</p>
        <Link className="btn primary acesso-criar" to="/entrar" state={location.state}>Já confirmei: entrar</Link>
      </Acesso>
    );
  }

  if (S.account && S.logado) return <Navigate to={destino} replace />;
  // Uma conta por navegador: se já existe, explica e leva para Entrar
  if (S.account) {
    return (
      <Acesso rotulo="Criar conta" titulo="Já existe uma conta aqui." texto={`Este navegador já tem a conta de ${S.account.name} (${S.account.email}). Cada navegador guarda uma conta só, junto com os bloqueios dela.`}>
        <Link className="btn primary acesso-criar" to="/entrar" state={location.state}>Entrar como {S.account.name.split(' ')[0]}</Link>
        <p className="acesso-dica" style={{ marginTop: 14 }}>Quer outra conta? Use outro navegador ou outro perfil do navegador.</p>
      </Acesso>
    );
  }

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (!jaTinhaSenha && senha !== repetir) {
      setErro('As senhas não são iguais.');
      return;
    }
    setOcupado(true);
    try {
      const r = await acoes.criarConta({ name: nome, email, password: senha }, true);
      if (r && r.precisaConfirmar) {
        setEnviadoPara(r.email);
        setOcupado(false);
        return;
      }
      navigate(destino, { replace: true });
    } catch (x) {
      setErro(x.message);
      setOcupado(false);
    }
  }

  return (
    <Acesso
      rotulo="Criar conta"
      titulo={jaTinhaSenha ? 'Complete a sua conta.' : 'Crie a sua conta.'}
      texto={jaTinhaSenha
        ? 'Complete a sua conta com nome e e-mail. Use a senha de controle que você já criou.'
        : 'Só o básico: nome, e-mail e uma senha. A senha também confirma cada liberação, depois do prazo de espera.'}
    >
      <form className="acesso-campos" onSubmit={enviar}>
        <label className="field">
          <span className="tag">Nome</span>
          <input className="input" autoComplete="name" placeholder="Como quer ser chamado" required autoFocus value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className="field">
          <span className="tag">E-mail</span>
          <input className="input" type="email" autoComplete="username" placeholder="voce@exemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
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
        Já tem conta? <Link to="/entrar" state={location.state}>Entrar</Link>
      </p>
      <p className="acesso-dica" style={{ marginTop: 10 }}>
        {S.nuvem
          ? 'A conta (nome, e-mail e o que você guardar em Superação) fica no servidor, protegida. Os bloqueios ficam neste navegador.'
          : 'A conta fica só neste navegador, sem servidor.'}
      </p>
    </Acesso>
  );
}
