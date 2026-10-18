// Entrar: e-mail e senha para abrir o painel
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Acesso from '../components/Acesso.jsx';
import { useEstado } from '../contexto/Estado.jsx';

export default function Entrar() {
  const { S, acoes } = useEstado();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state && location.state.de) || '/painel';
  const semConta = !S.account; // versão anterior: só existe a senha de controle

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manter, setManter] = useState(true);
  const [erro, setErro] = useState('');
  const [esqueci, setEsqueci] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  // Ainda não tem nada neste navegador: vai para Criar conta
  if (!S.hasPassword) return <Navigate to="/cadastro" replace state={location.state} />;
  // Já está dentro
  if (S.logado) return <Navigate to={destino} replace />;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    setOcupado(true);
    try {
      await acoes.entrar(email, senha, manter);
      navigate(destino, { replace: true });
    } catch (x) {
      setErro(x.message);
      setOcupado(false);
    }
  }

  return (
    <Acesso
      rotulo="Entrar"
      titulo={S.account ? `Olá de novo, ${S.account.name.split(' ')[0]}.` : 'Bem-vindo de volta.'}
      texto="Entre para ver os seus bloqueios e liberações."
    >
      <form className="acesso-campos" onSubmit={enviar}>
        {!semConta && (
          <label className="field">
            <span className="tag">E-mail</span>
            <input className="input" type="email" autoComplete="username" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
        )}
        <label className="field">
          <span className="tag">{semConta ? 'Senha de controle' : 'Senha'}</span>
          <input className="input" type="password" autoComplete="current-password" required autoFocus={semConta} value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        <div className="acesso-linha">
          <label className="check">
            <input type="checkbox" checked={manter} onChange={(e) => setManter(e.target.checked)} />
            <span>Manter conectado neste computador</span>
          </label>
          <button type="button" className="link-botao" onClick={() => setEsqueci((v) => !v)}>Esqueci minha senha</button>
        </div>
        {esqueci && (
          <p className="acesso-aviso">
            Não existe recuperação de senha, e isso é de propósito: assim ninguém (nem você num momento de fraqueza) consegue
            contornar os bloqueios. Tente lembrar com calma, sem pressa.
          </p>
        )}
        <p className="form-error" role="alert">{erro}</p>
        <button className="btn primary" type="submit" disabled={ocupado}>{ocupado ? 'Entrando…' : 'Entrar'}</button>
      </form>
      {semConta && (
        <p className="acesso-rodape">Ainda sem nome e e-mail? Depois de entrar, complete em <b>Ajustes › Minha conta</b>.</p>
      )}
      {!semConta && <p className="acesso-dica" style={{ marginTop: 18 }}>A conta fica só neste navegador.</p>}
      {semConta && <p className="acesso-dica" style={{ marginTop: 12 }}>Ou <Link to="/cadastro" style={{ color: 'inherit' }}>crie a conta com nome e e-mail</Link> usando a mesma senha.</p>}
    </Acesso>
  );
}
