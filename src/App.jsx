// src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Results from './pages/search/Results';
import PriceHistory from './pages/product/PriceHistory.jsx';
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
// import RequireAuth from './components/RequireAuth.jsx'; // para proteger rotas futuramente

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {/* Exemplo: para exigir login em certas páginas, descomente RequireAuth */}
      {/* <Route path="/buscar" element={<RequireAuth><Results /></RequireAuth>} /> */}
      <Route path="/buscar" element={<Results />} />
      <Route path="/produto/:gid" element={<PriceHistory />} />
      <Route path="/login" element={<Login />} />
      <Route path="/entrar" element={<Login />} />
      {/* Registro */}
      <Route path="/registrar" element={<Register />} />
      <Route path="/signup" element={<Register />} />
    </Routes>
  );
}
