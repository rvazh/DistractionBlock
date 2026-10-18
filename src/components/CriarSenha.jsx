// Cartão para criar a senha de controle (aparece em Ajustes enquanto não existe senha)
import { useState } from 'react';
import { useEstado } from '../contexto/Estado.jsx';
import { useUI } from '../contexto/UI.jsx';

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
      toast('Senha criada. Agora as liberações seguem a regra dos 7 dias.');
    } catch (x) {
      setErro(x.message);
    }
    setOcupado(false);
  }

  return (
    <div className="card frame" id="senha">
      <div className="card-head">
        <h2>Criar senha de controle</h2>
        <span className="pill alert">Pendente</span>
      </div>
      <p className="sub">É ela que confirma cada liberação, depois dos 7 dias. Sem senha, não dá para pedir liberações.</p>
      <form className="form-grid" onSubmit={enviar} autoComplete="off">
        <input className="input" type="password" minLength={6} required placeholder="Senha (mín. 6 caracteres)" aria-label="Senha de controle" value={senha} onChange={(e) => setSenha(e.target.value)} />
        <input className="input" type="password" minLength={6} required placeholder="Repita a senha" aria-label="Repita a senha" value={repetir} onChange={(e) => setRepetir(e.target.value)} />
        <label className="check">
          <input type="checkbox" required checked={entendi} onChange={(e) => setEntendi(e.target.checked)} />
          <span>Entendo que não existe "esqueci minha senha".</span>
        </label>
        <div><button className="btn primary" type="submit" disabled={ocupado}>{ocupado ? 'Criando…' : 'Criar senha'}</button></div>
        <p className="form-error">{erro}</p>
      </form>
    </div>
  );
}
