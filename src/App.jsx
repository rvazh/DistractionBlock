import { Navigate, Route, Routes } from 'react-router-dom';
import Inicio from './pages/Inicio.jsx';
import Baixar from './pages/Baixar.jsx';
import MenuLateral from './components/MenuLateral.jsx';
import Painel from './pages/Painel.jsx';
import Bloqueios from './pages/Bloqueios.jsx';
import Liberacoes from './pages/Liberacoes.jsx';
import Mensagens from './pages/Mensagens.jsx';
import Ajustes from './pages/Ajustes.jsx';

export default function App() {
  return (
    <Routes>
      {/* Site de apresentação */}
      <Route path="/" element={<Inicio />} />
      <Route path="/baixar" element={<Baixar />} />

      {/* App: menu lateral + telas do painel */}
      <Route path="/painel" element={<MenuLateral />}>
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
