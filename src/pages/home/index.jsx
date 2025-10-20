// src/pages/home/index.jsx (SEM Grid do MUI — layout via Box + CSS Grid)

import bannerCarnes from '../../img/carnes.png';
import bannerOfertas from '../../img/ofertas.png';
import bannerItens from '../../img/Itens.png';
import bannerChurrasco from '../../img/churrasco.png';
import React from 'react';
import { prefetchAll } from '../search/searchPrefetch.js';
import {
  AppBar, Box, Toolbar, IconButton, Typography,
  InputBase, Badge, MenuItem, Menu,
  Paper, List, ListItemButton, ListItemAvatar, Avatar, ListItemText,
  Divider, CircularProgress, ClickAwayListener, Button
} from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, styled, alpha } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../img/logo.png';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import AccountCircle from '@mui/icons-material/AccountCircle';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import MoreIcon from '@mui/icons-material/MoreVert';

import useHeaderLogic from './homeHelper';
import HeroBannerCard from '../../components/HeroBannerCard';
import BotoesSetores from '../../components/BotoesSetores';

// rótulos bonitos dos códigos canônicos
import { SECTOR_LABEL } from '../../lib/sectorMap';

/* ====== estilos ====== */
const Search = styled('form')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.25) },
  width: '100%',
  maxWidth: 'none',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2.5),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  width: '100%',
  display: 'block',
  color: 'inherit',
  '& .MuiInputBase-input': {
    width: '100%',
    padding: theme.spacing(1.2, 1.5, 1.2, 0),
    paddingLeft: `calc(1em + ${theme.spacing(5)})`,
    transition: theme.transitions.create('width'),
    fontSize: '1rem',
    [theme.breakpoints.down('sm')]: { fontSize: '0.95rem' },
  },
}));

export default function Home() {
  const navigate = useNavigate();
  const [prefetching, setPrefetching] = React.useState(false);
  const [warmKey, setWarmKey] = React.useState('');

  const {
    pesquisa, setPesquisa,
    anchorEl, mobileMoreAnchorEl,
    isMenuOpen, isMobileMenuOpen,
    handleSubmit, handleProfileMenuOpen,
    handleMenuClose, handleMobileMenuOpen, handleMobileMenuClose,
    openPanel, setOpenPanel,
    loading, error, results, visibleResults,
    handleSelectSuggestion, handleKeyDown, onClickAway
  } = useHeaderLogic();

  // pré-aquece a query
  React.useEffect(() => {
    const q = pesquisa.trim();
    if (q.length < 2) { setWarmKey(''); return; }
    const id = setTimeout(() => {
      prefetchAll(q, { fast: true, targetCount: 200 })
        .then(() => setWarmKey(q))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(id);
  }, [pesquisa]);

  const goToResults = async () => {
    const q = pesquisa.trim();
    if (q.length < 2) return;
    setOpenPanel(false);
    setPrefetching(true);
    try {
      const initial = await prefetchAll(q, { fast: true, targetCount: 300 });
      navigate(`/buscar?q=${encodeURIComponent(q)}`, { state: { initial } });
    } finally {
      setPrefetching(false);
    }
  };

  const onSubmitSearch = async (e) => { e.preventDefault(); await goToResults(); };

  const menuId = 'primary-search-account-menu';
  const mobileMenuId = 'primary-search-account-menu-mobile';

  const renderMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={menuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={handleMenuClose}>Perfil</MenuItem>
      <MenuItem onClick={handleMenuClose}>Minha conta</MenuItem>
    </Menu>
  );

  const renderMobileMenu = (
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      open={isMobileMenuOpen}
      onClose={handleMobileMenuClose}
    >
      <MenuItem>
        <IconButton size="large" aria-label="4 novas mensagens" color="inherit">
          <Badge badgeContent={4} color="error">
            <MailIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
          </Badge>
        </IconButton>
        <p>Mensagens</p>
      </MenuItem>
      <MenuItem>
        <IconButton size="large" aria-label="17 notificações" color="inherit">
          <Badge badgeContent={17} color="error">
            <NotificationsIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
          </Badge>
        </IconButton>
        <p>Notificações</p>
      </MenuItem>
      <MenuItem onClick={handleProfileMenuOpen}>
        <IconButton
          size="large"
          aria-label="Conta do usuário"
          aria-controls="primary-search-account-menu"
          aria-haspopup="true"
          color="inherit"
        >
          <AccountCircle sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
        </IconButton>
        <p>Perfil</p>
      </MenuItem>
    </Menu>
  );

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px

  // Banners — usar canon quando possível (para combinar com backend restritivo)
  const banners = [
    { key: 'carnes',    canon: 'CARNES',    img: bannerCarnes,    alt: 'Seleção de Carnes',   pos: '10% 50%' },
    { key: 'ofertas',   canon: 'OFERTAS',   img: bannerOfertas,   alt: 'Ofertas',             pos: '30% 50%' },
    { key: 'itens',     canon: 'BAZAR',     img: bannerItens,     alt: 'Itens práticos',      pos: '80% 50%' },
    { key: 'churrasco', canon: 'CHURRASCO', img: bannerChurrasco, alt: 'Para seu churrasco',  pos: '85% 50%' },
  ];

  const H1 = { xs: 160, sm: 210, md: 240 };
  const H2 = { xs: 160, sm: 210, md: 240 };

  // mesmo padding horizontal
  const CONTENT_PX = { xs: 2, sm: 4, md: 10 };

  // carrossel mobile
  const carouselRef = React.useRef(null);
  const go = (dir) => {
    const node = carouselRef.current;
    if (!node) return;
    const w = node.getBoundingClientRect().width;
    const idx = Math.round(node.scrollLeft / w);
    const next = Math.min(Math.max(idx + dir, 0), banners.length - 1);
    node.scrollTo({ left: next * w, behavior: 'smooth' });
  };

  // CATEGORIAS (usa ?canon=)
  const categoriasMenu = [
    { label: SECTOR_LABEL.HORTIFRUTI,         canon: 'HORTIFRUTI' },
    { label: SECTOR_LABEL.FRIOS_LATICINIOS,   canon: 'FRIOS_LATICINIOS' },
    { label: SECTOR_LABEL.CARNES,             canon: 'CARNES' },
    { label: SECTOR_LABEL.BEBIDAS,            canon: 'BEBIDAS' },
    { label: SECTOR_LABEL.MERCEARIA,          canon: 'MERCEARIA' },
    { label: SECTOR_LABEL.LIMPEZA,            canon: 'LIMPEZA' },
    { label: SECTOR_LABEL.HIGIENE_BELEZA,     canon: 'HIGIENE_BELEZA' },
    { label: SECTOR_LABEL.OFERTAS,            canon: 'OFERTAS' },
  ];

  // Corredores (cards)
  const corredores = [
    { src: 'src/img/mercearia.png',  alt: 'Mercearia',          canon: 'MERCEARIA' },
    { src: 'src/img/bebidas.png',    alt: 'Bebidas',            canon: 'BEBIDAS' },
    { src: 'src/img/carness.png',    alt: 'Carnes',             canon: 'CARNES' },
    { src: 'src/img/padaria.png',    alt: 'Padaria',            canon: 'PADARIA' },
    { src: 'src/img/congelados.png', alt: 'Congelados',         canon: 'CONGELADOS' },
    { src: 'src/img/frios.png',      alt: 'Frios e Laticínios', canon: 'FRIOS_LATICINIOS' },
    { src: 'src/img/hortifruti.png', alt: 'Hortifruti',         canon: 'HORTIFRUTI' },
    { src: 'src/img/higiene.png',    alt: 'Higiene e Beleza',   canon: 'HIGIENE_BELEZA' },
    { src: 'src/img/limpeza.png',    alt: 'Limpeza',            canon: 'LIMPEZA' },
    { src: 'src/img/pets.png',       alt: 'Pets',               canon: 'PETS' },
    { src: 'src/img/bazar.png',      alt: 'Bazar',              canon: 'BAZAR' },
    { src: 'src/img/eletro.png',     alt: 'Eletro',             canon: 'ELETRO' },
  ];

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', backgroundColor: '#f9f9f9', m: 0, p: 0 }}>
      <AppBar position="static" sx={{ m: 0 }}>
        <Toolbar
          sx={{
            display: 'grid',
            gridTemplateColumns: 'auto minmax(0, 1fr) auto',
            alignItems: 'center',
            columnGap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: { xs: 120, sm: 160, md: 220 } }}>
            <IconButton size="large" edge="start" color="inherit" aria-label="menu" sx={{ mr: 1 }}>
              <MenuIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
            </IconButton>

            <Box
              component="img"
              src={logo}
              alt="Logo"
              sx={{
                height: { xs: 56, sm: 72, md: 88, lg: 100 },
                width: 'auto',
                ml: { xs: 1, sm: 2, md: 'clamp(16px, 2.5vw, 32px)', lg: 'clamp(24px, 3vw, 48px)' },
              }}
            />
          </Box>

          {/* SEARCH */}
          <Box
            sx={{
              justifySelf: 'center',
              minWidth: 0,
              width: '80%',
              maxWidth: { md: 1200, lg: 1400 },
              px: { xs: 2, sm: 3 },
            }}
          >
            <ClickAwayListener onClickAway={onClickAway}>
              <Box sx={{ position: 'relative' }}>
                <Search onSubmit={onSubmitSearch} role="search" aria-label="Pesquisar produtos">
                  <SearchIconWrapper>
                    <SearchIcon sx={{ fontSize: { xs: 22, sm: 24, md: 26 } }} />
                  </SearchIconWrapper>
                  <StyledInputBase
                    placeholder="Pesquisar…"
                    inputProps={{ 'aria-label': 'search' }}
                    value={pesquisa}
                    onChange={(e) => { setPesquisa(e.target.value); if (!openPanel) setOpenPanel(true); }}
                    onFocus={() => { if (!openPanel && pesquisa.trim().length >= 1) setOpenPanel(true); }}
                    onKeyDown={handleKeyDown}
                    onClick={() => { if (!openPanel) setOpenPanel(true); }}
                  />
                </Search>

                {openPanel && (
                  <Paper
                    elevation={6}
                    sx={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      left: 0,
                      right: 0,
                      zIndex: (theme) => theme.zIndex.modal,
                      borderRadius: 2,
                      overflow: 'hidden',
                      maxHeight: 420,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Box sx={{ px: 2, py: 1 }}>
                      {loading && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CircularProgress size={18} />
                          <Typography variant="body2" color="text.secondary">
                            Buscando “{pesquisa}”…
                          </Typography>
                        </Box>
                      )}
                      {!loading && error && (
                        <Typography variant="body2" color="error">{error}</Typography>
                      )}
                      {!loading && !error && (
                        <Typography variant="body2" color="text.secondary">
                          {visibleResults.length
                            ? `Mostrando ${visibleResults.length} de ${results.length} resultado(s)`
                            : pesquisa?.trim().length >= 2
                              ? 'Nenhum resultado.'
                              : 'Digite ao menos 2 caracteres.'}
                        </Typography>
                      )}
                    </Box>

                    <Divider />

                    <Box sx={{ overflowY: 'auto' }}>
                      <List dense disablePadding>
                        {visibleResults.map((p, idx) => (
                          <ListItemButton
                            key={`${p.id || p._id || p.codigo || p.nome}-${idx}`}
                            onClick={() => handleSelectSuggestion(p)}
                            sx={{ py: 1, alignItems: 'flex-start' }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                variant="rounded"
                                src={p.imagem || p.imagem_link || p.url_imagem || ''}
                                alt={p.nome}
                                imgProps={{ loading: 'lazy', decoding: 'async' }}
                                sx={{ width: 44, height: 44 }}
                              >
                                {(p.nome?.[0] || 'P').toUpperCase()}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primaryTypographyProps={{ variant: 'body1' }}
                              secondaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                              primary={p.nome}
                              secondary={[
                                p.departamento && `Depto: ${p.departamento}`,
                                (p.preco_fmt || p.preco) && `Preço: ${p.preco_fmt || p.preco}`
                              ].filter(Boolean).join(' · ')}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Box>

                    <Divider />
                    <Box sx={{ p: 1.5 }}>
                      <Button fullWidth variant="contained" color="success" disabled={prefetching} onClick={goToResults}>
                        {prefetching ? 'PREPARANDO…' : 'Ver todos os resultados'}
                      </Button>
                    </Box>
                  </Paper>
                )}
              </Box>
            </ClickAwayListener>
          </Box>

          {/* ícones direita */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifySelf: 'end' }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
              <IconButton size="large" aria-label="4 novas mensagens" color="inherit">
                <Badge badgeContent={4} color="error">
                  <MailIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
                </Badge>
              </IconButton>

              <IconButton size="large" aria-label="17 notificações" color="inherit">
                <Badge badgeContent={17} color="error">
                  <NotificationsIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
                </Badge>
              </IconButton>

              <IconButton
                size="large"
                edge="end"
                aria-label="Conta do usuário"
                aria-controls={menuId}
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <AccountCircle sx={{ fontSize: { xs: 24, sm: 28, md: 32 } }} />
              </IconButton>
            </Box>

            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
              <IconButton
                size="large"
                aria-label="mostrar mais"
                aria-controls={mobileMenuId}
                aria-haspopup="true"
                onClick={handleMobileMenuOpen}
                color="inherit"
              >
                <MoreIcon sx={{ fontSize: { xs: 24, sm: 28 } }} />
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {renderMobileMenu}
      {renderMenu}

      {/* categorias (menu verde) */}
      <Box
        component="nav"
        sx={{
          m: 0,
          p: 0,
          backgroundColor: '#008650',
          px: { xs: 1, sm: 2 },
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 2.5 },
          mb: { xs: 2, sm: 3, md: 4 },
          justifyContent: { xs: 'flex-start', md: 'center' },
          flexWrap: { xs: 'nowrap', md: 'wrap' },
          overflowX: { xs: 'auto', md: 'visible' },
          whiteSpace: { xs: 'nowrap', md: 'normal' },
          scrollSnapType: { xs: 'x mandatory', md: 'none' },
          '::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {categoriasMenu.map(({ label, canon }) => (
          <Typography
            key={canon}
            component={Link}
            to={`/buscar?canon=${encodeURIComponent(canon)}`}
            variant="body1"
            sx={{
              color: 'white',
              textDecoration: 'none',
              px: { xs: 1.25, sm: 2 },
              py: 0.75,
              fontWeight: 700,
              fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
              borderRadius: 1,
              cursor: 'pointer',
              transition: 'background .15s ease',
              '&:hover': { backgroundColor: '#00663f' },
              scrollSnapAlign: 'start',
              whiteSpace: 'nowrap',
            }}
            aria-label={`Ir para ${label}`}
          >
            {label}
          </Typography>
        ))}
      </Box>

      {/* BANNERS — desktop */}
      {!isMobile ? (
        <Box sx={{ px: CONTENT_PX, pt: 2 }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
              gap: 3
            }}
          >
            <Box>
              <Link
                to={
                  banners[0].canon
                    ? `/buscar?canon=${encodeURIComponent(banners[0].canon)}`
                    : `/buscar?q=${encodeURIComponent(banners[0].termoDeBusca || '')}`
                }
                style={{ textDecoration: 'none' }}
              >
                <HeroBannerCard image={banners[0].img} alt={banners[0].alt}
                  imgPosition={banners[0].pos} sx={{ height: H1 }} />
              </Link>
            </Box>
            <Box>
              <Link
                to={
                  banners[1].canon
                    ? `/buscar?canon=${encodeURIComponent(banners[1].canon)}`
                    : `/buscar?q=${encodeURIComponent(banners[1].termoDeBusca || '')}`
                }
                style={{ textDecoration: 'none' }}
              >
                <HeroBannerCard image={banners[1].img} alt={banners[1].alt}
                  imgPosition={banners[1].pos} sx={{ height: H1 }} />
              </Link>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 3,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
              gap: 3
            }}
          >
            <Box>
              <Link
                to={
                  banners[2].canon
                    ? `/buscar?canon=${encodeURIComponent(banners[2].canon)}`
                    : `/buscar?q=${encodeURIComponent(banners[2].termoDeBusca || '')}`
                }
                style={{ textDecoration: 'none' }}
              >
                <HeroBannerCard image={banners[2].img} alt={banners[2].alt}
                  imgPosition={banners[2].pos} sx={{ height: H2 }} />
              </Link>
            </Box>
            <Box>
              <Link
                to={
                  banners[3].canon
                    ? `/buscar?canon=${encodeURIComponent(banners[3].canon)}`
                    : `/buscar?q=${encodeURIComponent(banners[3].termoDeBusca || '')}`
                }
                style={{ textDecoration: 'none' }}
              >
                <HeroBannerCard image={banners[3].img} alt={banners[3].alt}
                  imgPosition={banners[3].pos} sx={{ height: H2 }} />
              </Link>
            </Box>
          </Box>
        </Box>
      ) : (
        // BANNERS — mobile (carrossel)
        <Box sx={{ position: 'relative', px: CONTENT_PX, pt: 2 }}>
          <Box
            ref={carouselRef}
            sx={{
              display: 'flex',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              gap: 2,
              '::-webkit-scrollbar': { display: 'none' },
              scrollBehavior: 'smooth',
            }}
          >
            {banners.map((b) => (
              <Box key={b.key} sx={{ flex: '0 0 100%', scrollSnapAlign: 'start' }}>
                <Link
                  to={
                    b.canon
                      ? `/buscar?canon=${encodeURIComponent(b.canon)}`
                      : `/buscar?q=${encodeURIComponent(b.termoDeBusca || '')}`
                  }
                  style={{ textDecoration: 'none' }}
                >
                  <HeroBannerCard image={b.img} alt={b.alt}
                    imgPosition={b.pos} sx={{ height: { xs: 115 } }} />
                </Link>
              </Box>
            ))}
          </Box>

          <IconButton
            onClick={() => go(-1)}
            size="small"
            sx={{
              position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,.35)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,.5)' }
            }}
            aria-label="anterior"
          >
            <ChevronLeftIcon />
          </IconButton>

          <IconButton
            onClick={() => go(1)}
            size="small"
            sx={{
              position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)',
              bgcolor: 'rgba(0,0,0,.35)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,.5)' }
            }}
            aria-label="próximo"
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}

      {/* TÍTULO + GRID DOS CORREDORES */}
      <Box sx={{ px: CONTENT_PX, pt: 4, pb: 4 }}>
        <Typography variant="h5" fontWeight="bold">Corredores</Typography>
      </Box>

      <Box sx={{ px: CONTENT_PX, pb: 4 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(6, 1fr)'
            },
            gap: { xs: 1.5, sm: 2, md: 2.5 },
            alignItems: 'stretch'
          }}
        >
          {corredores.map((c) => (
            <Box key={c.canon}>
              <BotoesSetores
                src={c.src}
                alt={c.alt}
                aria-label={c.alt}
                ratio={3.25}
                borderRadius={4}
                boxShadow={5}
                fit="contain"
                imgScale={0.86}
                onClick={() => navigate(`/buscar?canon=${encodeURIComponent(c.canon)}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/buscar?canon=${encodeURIComponent(c.canon)}`);
                  }
                }}
                role="button"
                tabIndex={0}
                sx={{
                  transition: 'transform .15s ease, box-shadow .15s ease',
                  '&:hover': { transform: 'translateY(-2px)', boxShadow: 8 }
                }}
              />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
