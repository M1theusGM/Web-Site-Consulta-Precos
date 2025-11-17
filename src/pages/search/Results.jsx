import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box, Container, Typography, Card, CardContent, CardMedia,
  TextField, InputAdornment, MenuItem, Select, FormControl, Button,
  CircularProgress, Paper, Divider, Checkbox, FormControlLabel,
  Stack, Chip, Tooltip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { prefetchAll, PAGE_SIZE, groupKeyFor } from "./searchPrefetch.js";

import stokLogo from '../../img/stok_logo.png';
import zaffariLogo from '../../img/zaffari_logo.png';

const ORIGIN_LOGOS = [
  { keys: ['stok','stock','stokcenter','stockcenter','stok-center','stock-center','stok center','stock center'], src: stokLogo, alt: 'Stok Center' },
  { keys: ['zaffari','bourbon','grupo zaffari'], src: zaffariLogo, alt: 'Zaffari/Bourbon' },
];

const normalize = (s) =>
  String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function findLogoForOrigin(origem) {
  const o = normalize(origem);
  const oCompact = o.replace(/[\s._-]+/g, '');
  for (const { keys, src, alt } of ORIGIN_LOGOS) {
    for (const k of keys) {
      const nk = normalize(k);
      const nkCompact = nk.replace(/[\s._-]+/g, '');
      if (o.includes(nk) || oCompact.includes(nkCompact)) return { src, alt };
    }
  }
  return null;
}
const prettyOrigin = (s) => {
  const c = normalize(s).replace(/\s+/g, '');
  if (c === 'stockcenter' || c === 'stokcenter') return 'Stok Center';
  return s;
};
function extractOrigins(product) {
  const list = [];
  if (product?.origem) list.push(product.origem);
  if (Array.isArray(product?.offers)) for (const ofr of product.offers) if (ofr?.origem) list.push(ofr.origem);
  const seen = new Set();
  return list.filter(Boolean).filter(o => (seen.has(o) ? false : (seen.add(o), true)));
}
function isStockcenterOrigin(origem) {
  const oc = normalize(origem).replace(/[\s._-]+/g, '');
  const keys = ['stockcenter','stokcenter','stockcentre','stokcentre','stock','stok'];
  return keys.some(k => oc.includes(k));
}
function isZaffariOrigin(origem) {
  const oc = normalize(origem).replace(/[\s._-]+/g, '');
  const keys = ['zaffari','bourbon','grupozaffari'];
  return keys.some(k => oc.includes(k));
}

// ====== KNOBS (respiro e alinhamento) ======
const GRID_COL_GAP = { xs: 2.75, sm: 3.5, md: 4 };
const GRID_ROW_GAP = { xs: 2.75, sm: 3.25, md: 3.5 };
const IMG_H               = 108;
const TITLE_MIN_H         = 32;
const ORIGINS_MIN_H       = 18; // ligeiro respiro sob o preço
const BUTTON_H            = 32;
const PRICE_MIN_NO_PROMO  = 44;
const PRICE_MIN_PROMO     = 66;

// === Estilos de chip/cores por tipo de promoção (só Stock) ===
function promoStyleFor(tipoRaw) {
  const t = normalize(tipoRaw || '').replace(/_/g,' ').trim();
  if (!t) return null;

  if (t.startsWith('oferta')) {
    return { key:'oferta',
      chip:{ label:'Oferta', sx:{ bgcolor:'#d32f2f', color:'#fff', fontWeight:700, height:20, borderRadius:'999px', px:1 } },
      priceColor:'error.main'
    };
  }
  if (t.startsWith('clube')) {
    return { key:'clube',
      chip:{ label:'Clube', sx:{ bgcolor:'#111', color:'#fff', fontWeight:700, height:20, borderRadius:'999px', px:1 } },
      priceColor:'#111'
    };
  }
  if (t.includes('mais') && t.includes('menos')) {
    return { key:'mais_por_menos',
      chip:{ label:'Mais por menos', sx:{ bgcolor:'#e3f2fd', color:'#0d47a1', fontWeight:700, height:20, borderRadius:'999px', px:1, border:'1px solid #90caf9' } },
      priceColor:'#1e88e5'
    };
  }
  return { key:t,
    chip:{ label: tipoRaw, sx:{ bgcolor:'grey.800', color:'#fff', fontWeight:700, height:20, borderRadius:'999px', px:1 } },
    priceColor:'text.primary'
  };
}

export default function Results() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const qParam     = params.get('q') || '';
  const pageParam  = Number(params.get('page')) || 1;
  const deptParam  = params.get('dept') || '';
  const canonParam = params.get('canon') || '';

  const [query, setQuery] = useState(qParam);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState('relevancia');
  const [hasNextPage, setHasNextPage] = useState(true);
  const [selectedDepts, setSelectedDepts] = useState(new Set());

  // Sincroniza selectedDepts <- ?dept=
  useEffect(() => {
    const next = new Set(deptParam.split(',').map(s => s.trim()).filter(Boolean));
    setSelectedDepts(next);
  }, [deptParam]);

  // Busca remota (q, dept, canon combinados)
  useEffect(() => {
    const q = qParam.trim();
    const hasDept  = deptParam.trim().length  > 0;
    const hasCanon = canonParam.trim().length > 0;

    if (!q && !hasDept && !hasCanon) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);
    prefetchAll(q, { page: pageParam, dept: deptParam, canon: canonParam })
      .then((results) => {
        setItems(results);
        setHasNextPage(results.length === PAGE_SIZE);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [qParam, pageParam, deptParam, canonParam]);

  // Facetas por departamento
  const deptFacets = useMemo(() => {
    const map = new Map();
    for (const p of items) map.set(p.departamento || 'Outros', (map.get(p.departamento || 'Outros') || 0) + 1);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  // Filtro local (sidebar)
  const filteredBySidebar = useMemo(() => {
    return items.filter(p => {
      const okDept = selectedDepts.size ? selectedDepts.has(p.departamento || 'Outros') : true;
      return okDept;
    });
  }, [items, selectedDepts]);

  // Ordenação
  const ordered = useMemo(() => {
    const arr = [...filteredBySidebar];
    switch (order) {
      case 'preco_asc':  return arr.sort((a, b) => (a.preco ?? Infinity) - (b.preco ?? Infinity));
      case 'preco_desc': return arr.sort((a, b) => (b.preco ?? -Infinity) - (a.preco ?? -Infinity));
      case 'nome_asc':   return arr.sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
      default:           return arr.sort((a, b) => (b.__score ?? 0) - (a.__score ?? 0));
    }
  }, [filteredBySidebar, order]);

  // Submit da barra de busca — preserva dept e canon
  const onSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length >= 2) {
      const sp = new URLSearchParams(params);
      sp.set('q', q);
      sp.set('page', 1);
      setParams(sp);
    }
  };

  // Atualiza ?dept=
  const updateDeptQS = (nextSet) => {
    const sp = new URLSearchParams(params);
    if (nextSet.size) sp.set('dept', [...nextSet].join(','));
    else sp.delete('dept');
    sp.set('page', 1);
    setParams(sp);
  };
  const toggleDept = (dept) => {
    const next = new Set(selectedDepts);
    if (next.has(dept)) next.delete(dept); else next.add(dept);
    setSelectedDepts(next);
    updateDeptQS(next);
  };
  const clearFilters = () => {
    setSelectedDepts(new Set());
    const sp = new URLSearchParams(params);
    sp.delete('dept');
    sp.set('page', 1);
    setParams(sp);
  };

  // Paginação
  const irParaPaginaAnterior = () => {
    if (pageParam > 1) {
      const sp = new URLSearchParams(params);
      sp.set('page', pageParam - 1);
      setParams(sp);
    }
  };
  const irParaProximaPagina = () => {
    const sp = new URLSearchParams(params);
    sp.set('page', pageParam + 1);
    setParams(sp);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
      {/* Barra de busca + ordenação */}
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 220px 120px' },
          gap: 2,
          mb: 2
        }}
      >
        <TextField
          placeholder="Pesquise produtos ou marcas"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon /></InputAdornment>) }}
          size="small"
        />
        <FormControl size="small">
          <Select value={order} onChange={(e) => setOrder(e.target.value)} displayEmpty>
            <MenuItem value="relevancia">Relevância</MenuItem>
            <MenuItem value="preco_asc">Menor preço</MenuItem>
            <MenuItem value="preco_desc">Maior preço</MenuItem>
            <MenuItem value="nome_asc">Nome (A–Z)</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" type="submit">Buscar</Button>
      </Box>

      <Typography variant="h6" sx={{ mb: 1.5 }}>
        {loading
          ? (qParam || deptParam || canonParam
              ? `Carregando resultados para ${qParam ? `“${qParam}”` : ''}${qParam && (deptParam || canonParam) ? ' · ' : ''}${deptParam ? `Depto: ${deptParam}` : ''}${deptParam && canonParam ? ' · ' : ''}${canonParam ? `Categoria: ${canonParam}` : ''}…`
              : 'Carregando…')
          : `${ordered.length} resultado(s) ${qParam ? `para “${qParam}”` : ''}${deptParam ? ` · Depto: ${deptParam}` : ''}${canonParam ? ` · Categoria: ${canonParam}` : ''} (Página ${pageParam})`
        }
      </Typography>

      {/* GRID PRINCIPAL: sidebar + resultados */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2, alignItems: 'start' }}>
        {/* Cards */}
        <Box>
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 5 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(auto-fill, minmax(205px, 1fr))',
                  md: 'repeat(auto-fill, minmax(220px, 1fr))',
                  lg: 'repeat(auto-fill, minmax(230px, 1fr))',
                },
                columnGap: GRID_COL_GAP,
                rowGap: GRID_ROW_GAP,
                alignItems: 'stretch',
              }}
            >
              {ordered.map((p) => {
                const origins = extractOrigins(p);
                const gid = groupKeyFor(p);

                const isStock = origins.some(isStockcenterOrigin);
                const hasZaffari = origins.some(isZaffariOrigin);

                // Promo só para Stock
                const promoFlag = Boolean(
                  p.is_promo ||
                  p.promo ||
                  p?.__raw?.promo === true ||
                  p?.__raw?.promo === 1 ||
                  p?.__raw?.promo === '1' ||
                  String(p?.__raw?.promo).toLowerCase() === 'true' ||
                  (Number.isFinite(p.preco_promo) && Number.isFinite(p.preco_original) && p.preco_promo > 0 && p.preco_original > 0 && p.preco_promo < p.preco_original)
                );
                const style = isStock ? promoStyleFor(p.tipo_promo) : null;
                const aplicarPromoVisual = Boolean(style || (isStock && promoFlag));

                const descontoPerc = Number.isFinite(p.desconto_perc)
                  ? p.desconto_perc
                  : (Number.isFinite(p.preco_original) && Number.isFinite(p.preco_promo) && p.preco_promo < p.preco_original)
                    ? Math.round(((p.preco_original - p.preco_promo) / p.preco_original) * 100)
                    : 0;

                const precoAtualFmt = aplicarPromoVisual
                  ? (p.preco_promo_fmt || p.preco_fmt)
                  : (p.preco_fmt || p.preco_original_fmt || '—');

                const priceMin = aplicarPromoVisual ? PRICE_MIN_PROMO : PRICE_MIN_NO_PROMO;

                return (
                  <Card
                    key={p.id ?? gid}
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      boxShadow: 1,
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      component={Link}
                      to={`/produto/${encodeURIComponent(gid)}`}
                      state={{ product: p, gid }}
                      sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <CardMedia
                        component="img"
                        image={p.imagem || p.imagem_link || ''}
                        alt={p.nome}
                        sx={{ height: IMG_H, objectFit: 'contain', borderRadius: 1, border: '1px solid #eee' }}
                        onError={(e) => { e.currentTarget.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='; }}
                      />
                    </Box>

                    {/* Conteúdo interno */}
                    <CardContent
                      sx={{
                        p: 0,
                        display: 'grid',
                        gridTemplateRows: 'auto auto auto auto 1fr auto',
                        rowGap: 0.75,
                        flexGrow: 1
                      }}
                    >
                      {/* Título */}
                      <Box
                        component={Link}
                        to={`/produto/${encodeURIComponent(gid)}`}
                        state={{ product: p, gid }}
                        sx={{ textDecoration:'none', color:'inherit' }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: TITLE_MIN_H
                          }}
                        >
                          {p.nome}
                        </Typography>
                      </Box>

                      {/* Depto */}
                      <Typography variant="caption" color="text.secondary">
                        {p.departamento || 'Sem departamento'}
                      </Typography>

                      {/* Preço */}
                      <Box sx={{ minHeight: priceMin, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        {aplicarPromoVisual ? (
                          <>
                            {/* Badge do tipo — APENAS Stock Center */}
                            <Box sx={{ display:'flex', alignItems:'center', gap: 1, mb: 0.25 }}>
                              {isStock && style && (
                                <Chip label={style.chip.label} size="small" sx={style.chip.sx} />
                              )}
                            </Box>

                            {/* Preço + /un (sem logo inline) */}
                            <Box sx={{ mb: 0.25, display:'flex', alignItems:'center', gap: 0.5 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight:800,
                                  lineHeight:1,
                                  display:'inline',
                                  color: isStock ? (style?.priceColor || 'success.main') : 'success.main'
                                }}
                              >
                                {precoAtualFmt}
                              </Typography>
                              <Typography variant="caption">/un</Typography>
                            </Box>

                            <Box sx={{ display:'flex', alignItems:'center', gap: 1 }}>
                              {/* % OFF e preço riscado — APENAS Stock Center */}
                              {isStock && !!descontoPerc && (
                                <Chip label={`${descontoPerc}% OFF`} size="small" sx={{ bgcolor:'success.main', color:'#fff', fontWeight:700, height:20, borderRadius:'999px' }} />
                              )}
                              {isStock && p.preco_original_fmt && (
                                <Typography variant="body2" sx={{ color:'error.main', textDecoration:'line-through' }}>
                                  {p.preco_original_fmt}
                                </Typography>
                              )}
                            </Box>
                          </>
                        ) : (
                          <Box sx={{ display:'flex', alignItems:'center', gap: 0.25 }}>
                            <Typography variant="subtitle1" color="success.main" sx={{ fontWeight:700, display:'inline' }}>
                              {precoAtualFmt}
                            </Typography>
                            <Typography variant="caption">/un</Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Origens — logo do Zaffari fica AQUI, abaixo do preço */}
                      <Box sx={{ minHeight: ORIGINS_MIN_H, display:'flex', alignItems:'center', gap: 1 }}>
                        {origins.slice(0, 3).map((o) => {
                          const logo = findLogoForOrigin(o);
                          return logo ? (
                            <Tooltip key={o} title={o}>
                              <Box component="img" src={logo.src} alt={logo.alt} sx={{ height: 18, objectFit: 'contain' }} />
                            </Tooltip>
                          ) : (
                            <Chip key={o} size="small" label={prettyOrigin(o)} variant="outlined" />
                          );
                        })}
                      </Box>

                      {/* Spacer flexível */}
                      <Box />

                      {/* Botão */}
                      <Button variant="contained" color="success" size="small" fullWidth sx={{ height: BUTTON_H }}>
                        Adicionar
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}

          {!loading && !ordered.length && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography>Nenhum produto encontrado.</Typography>
            </Box>
          )}

          {/* paginação */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <Button variant="outlined" onClick={irParaPaginaAnterior} disabled={pageParam <= 1 || loading}>Anterior</Button>
            <Typography>Página {pageParam}</Typography>
            <Button variant="outlined" onClick={irParaProximaPagina} disabled={!hasNextPage || loading}>Próxima</Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
