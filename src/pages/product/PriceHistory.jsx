import { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, Paper, Button, Chip, Divider, CircularProgress
} from '@mui/material';

import { fetchHistoryByGroupId, fmtBRL, groupKeyFor } from '../search/searchPrefetch.js';

export default function PriceHistory(){
  const { gid } = useParams();
  const location = useLocation();
  const initial = location.state?.product || null;

  const [loading, setLoading] = useState(true);
  const [hist, setHist] = useState([]);
  const [error, setError] = useState('');

  // Fallback: se vier um id, derivamos o groupId a partir do produto inicial
  const gidParam = decodeURIComponent(gid || '');
  const effectiveGid =
    gidParam.startsWith('id:') || gidParam.startsWith('nm:')
      ? gidParam
      : (initial ? groupKeyFor(initial) : gidParam);

  useEffect(() => {
    let cancel = false;
    setLoading(true); setError('');
    fetchHistoryByGroupId(effectiveGid)
      .then(arr => { if(!cancel) setHist(arr); })
      .catch(e => { if(!cancel) setError(`Falha ao carregar histórico: ${e.message}`); })
      .finally(() => { if(!cancel) setLoading(false); });
    return () => { cancel = true; };
  }, [effectiveGid]);

  // último ponto (preço atual)
  const last = hist.length ? hist[hist.length-1] : null;
  const precoAtual = last?.preco_exibe ?? initial?.preco;
  const precoOriginal = last?.preco_original ?? initial?.preco_original;
  const precoPromo = last?.preco_promo ?? initial?.preco_promo;
  const hasPromo = Number.isFinite(precoPromo) && Number.isFinite(precoOriginal) && precoPromo > 0 && precoPromo < precoOriginal;
  const descontoPerc = hasPromo ? Math.round(((precoOriginal - precoPromo) / precoOriginal)*100) : (initial?.desconto_perc || 0);

  // sparkline simples (SVG)
  const spark = useMemo(() => {
    if (!hist.length) return null;
    const points = hist.map(h => h.preco_exibe);
    const min = Math.min(...points);
    const max = Math.max(...points);
    const width = 360, height = 96, pad = 6;
    const stepX = (width - pad*2) / Math.max(points.length - 1, 1);
    const path = points.map((y,i) => {
      const nx = pad + i * stepX;
      const ny = pad + (height - pad*2) * (1 - (y - min) / Math.max(max - min || 1, 1));
      return `${i===0?'M':'L'}${nx.toFixed(1)},${ny.toFixed(1)}`;
    }).join(' ');
    return { width, height, path, min, max };
  }, [hist]);

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 360px' }, gap: 3, alignItems: 'start' }}>
          {/* Imagem */}
          <Box sx={{ display:'flex', justifyContent:{ xs:'center', md:'flex-start'} }}>
            <Box component="img"
                 src={initial?.imagem || ''}
                 alt={initial?.nome || 'Produto'}
                 sx={{ width: { xs: 220, md: 280 }, height: { xs: 220, md: 280 }, objectFit:'contain', border:'1px solid #eee', borderRadius: 1 }}
                 onError={(e) => { e.currentTarget.style.visibility='hidden'; }} />
          </Box>

          {/* Título + ações */}
          <Box>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {initial?.nome || 'Produto'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {initial?.departamento || '—'}
            </Typography>
            <Divider sx={{ display:{ xs:'none', md:'block' } }} />

            {/* Sparkline (desktop) */}
            {spark && (
              <Box sx={{ mt: { xs: 2, md: 3 }, display:{ xs:'none', md:'block' } }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Histórico de preços (exibidos)</Typography>
                <svg width={spark.width} height={spark.height}>
                  <path d={spark.path} fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <Typography variant="caption" color="text.secondary">
                  menor: {fmtBRL(spark.min)} • maior: {fmtBRL(spark.max)}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Preço atual */}
          <Box sx={{ borderLeft: { md:'1px solid #eee' }, pl: { md: 3 } }}>
            <Box sx={{ mb: 1 }}>
              <Chip size="small" label="Clube" sx={{ fontWeight: 700, borderRadius: '12px', bgcolor: 'black', color: 'white' }} />
            </Box>

            <Box sx={{ display:'flex', alignItems:'baseline', gap: 1, mb: 0.5 }}>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {fmtBRL(precoAtual)}
              </Typography>
              <Typography variant="body2">/un</Typography>
            </Box>

            {hasPromo && (
              <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 2 }}>
                <Chip size="small" label={`${descontoPerc}% OFF`} color="success" sx={{ fontWeight: 700 }} />
                <Typography variant="body1" sx={{ textDecoration:'line-through', color:'error.main' }}>
                  {fmtBRL(precoOriginal)}
                </Typography>
              </Box>
            )}

            <Button variant="contained" color="error" size="large" fullWidth sx={{ py: 1.5 }}>
              + Adicionar ao carrinho
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Tabela simples do histórico */}
      <Paper variant="outlined" sx={{ mt: 3, p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Histórico completo</Typography>
        {loading && <CircularProgress size={22} />}
        {error && <Typography color="error">{error}</Typography>}
        {!loading && !hist.length && <Typography variant="body2">Sem histórico encontrado.</Typography>}
        {!!hist.length && (
          <Box component="table" sx={{ width:'100%', borderCollapse:'collapse', '& td,& th':{ borderBottom:'1px solid #eee', py: 1 }}}>
            <thead>
              <tr>
                <th align="left">Data</th>
                <th align="right">Preço original</th>
                <th align="right">Preço promo</th>
                <th align="right">Preço exibido</th>
              </tr>
            </thead>
            <tbody>
              {hist.map((h) => (
                <tr key={h.data}>
                  <td>{h.data}</td>
                  <td align="right">{fmtBRL(h.preco_original)}</td>
                  <td align="right">{Number.isFinite(h.preco_promo) ? fmtBRL(h.preco_promo) : '—'}</td>
                  <td align="right"><strong>{fmtBRL(h.preco_exibe)}</strong></td>
                </tr>
              ))}
            </tbody>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
