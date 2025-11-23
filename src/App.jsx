import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/home';
import Results from './pages/search/Results';
import PriceHistory from './pages/product/PriceHistory.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';

export default function App() {
  return (
    <Routes>

      {/* Redireciona "/" para "/login" */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/home" element={<Home />} />
      <Route path="/buscar" element={<Results />} />
      <Route path="/produto/:gid" element={<PriceHistory />} />
      <Route path="/login" element={<Login />} />
      <Route path="/entrar" element={<Login />} />
      <Route path="/registrar" element={<Register />} />
      <Route path="/signup" element={<Register />} />

    </Routes>
  );
}
