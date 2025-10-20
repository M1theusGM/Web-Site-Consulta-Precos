import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Results from './pages/search/Results'; // ⬅️ garanta export default em Results.jsx
import PriceHistory from './pages/product/PriceHistory.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/buscar" element={<Results />} />
      <Route path="/produto/:gid" element={<PriceHistory />} />
    </Routes>
  );
}
