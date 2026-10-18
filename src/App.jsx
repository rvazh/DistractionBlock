import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEstado } from './contexto/Estado.jsx';
import MenuLateral from './components/MenuLateral.jsx';
import CriarSenha from './pages/CriarSenha.jsx';
import Painel from './pages/Painel.jsx';
import Bloqueios from './pages/Bloqueios.jsx';
import Liberacoes from './pages/Liberacoes.jsx';
import Mensagens from './pages/Mensagens.jsx';
import Ajustes from './pages/Ajustes.jsx';

export default function App() {
  const { S } = useEstado();
  const { pathname } = useLocation();

  // Ao trocar de página, volta para o topo
  useEffect(() => {
    document.querySelector('.main')?.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [pathname]);

  // Primeira vez: cria a senha de controle antes de tudo
  if (!S.hasPassword) return <CriarSenha />;

  return (
    <Routes>
      <Route element={<MenuLateral />}>
        <Route index element={<Painel />} />
        <Route path="bloqueios" element={<Bloqueios />} />
        <Route path="liberacoes" element={<Liberacoes />} />
        <Route path="mensagens" element={<Mensagens />} />
        <Route path="ajustes" element={<Ajustes />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
