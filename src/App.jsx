import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEstado } from './contexto/Estado.jsx';
import Inicio from './pages/Inicio.jsx';
import Baixar from './pages/Baixar.jsx';
import Entrar from './pages/Entrar.jsx';
import Cadastro from './pages/Cadastro.jsx';
import MenuLateral from './components/MenuLateral.jsx';
import Painel from './pages/Painel.jsx';
import Bloqueios from './pages/Bloqueios.jsx';
import Liberacoes from './pages/Liberacoes.jsx';
import Mensagens from './pages/Mensagens.jsx';
import Ajustes from './pages/Ajustes.jsx';

// O painel só abre depois do login (sem conta ainda: vai para Criar conta)
function SoLogado({ children }) {
  const { S } = useEstado();
  const { pathname } = useLocation();
  if (S.logado) return children;
  return <Navigate to="/entrar" replace state={{ de: pathname }} />;
}

export default function App() {
  return (
    <Routes>
      {/* Site de apresentação */}
      <Route path="/" element={<Inicio />} />
      <Route path="/baixar" element={<Baixar />} />

      {/* Acesso */}
      <Route path="/entrar" element={<Entrar />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* App: menu lateral + telas do painel */}
      <Route path="/painel" element={<SoLogado><MenuLateral /></SoLogado>}>
        <Route index element={<Painel />} />
        <Route path="bloqueios" element={<Bloqueios />} />
        <Route path="liberacoes" element={<Liberacoes />} />
        <Route path="mensagens" element={<Mensagens />} />
        <Route path="ajustes" element={<Ajustes />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
