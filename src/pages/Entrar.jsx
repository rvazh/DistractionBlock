// Entrar: e-mail e senha para abrir o painel, com a opção de criar a conta
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Acesso from '../components/Acesso.jsx';
import { useEstado } from '../contexto/Estado.jsx';

export default function Entrar() {
  const { S, acoes } = useEstado();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state && location.state.de) || '/painel';
  const semNada = !S.hasPassword; // ainda não existe conta neste navegador
  const semConta = S.hasPassword && !S.account; // versão anterior: só existe a senha de controle

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manter, setManter] = useState(true);
  const [erro, setErro] = useState('');
  const [esqueci, setEsqueci] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  // Já está dentro
  if (S.logado) return <Navigate to={destino} replace />;

  async function enviar(e) {
    e.preventDefault();
    setErro('');
    if (semNada) {
      setErro('Ainda não existe conta neste navegador. Clique em Criar conta, logo abaixo.');
      return;
    }
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
      titulo={S.account ? `Olá de novo, ${S.account.name.split(' ')[0]}.` : semConta ? 'Bem-vindo de volta.' : 'Bem-vindo.'}
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
      <div className="acesso-ou" role="separator"><span>ou</span></div>
      <Link className="btn acesso-criar" to="/cadastro" state={location.state}>
        {semConta ? 'Completar a conta com nome e e-mail' : 'Criar conta'}
      </Link>
      <p className="acesso-dica" style={{ marginTop: 14 }}>
        {S.account ? `Este navegador já tem a conta de ${S.account.name.split(' ')[0]}. ` : ''}A conta fica só neste navegador, sem servidor.
      </p>
    </Acesso>
  );
}
