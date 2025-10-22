import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { prefetchAll, getPrefetched } from '../search/searchPrefetch.js';

const SUGGESTION_LIMIT = Number(import.meta.env.VITE_SUGGESTION_LIMIT || 15);
const DEBOUNCE_MS = Number(import.meta.env.VITE_SEARCH_DEBOUNCE_MS || 160);
const MIN_LEN = 2;

export default function useHeaderLogic() {
  // header/menus
  const [pesquisa, setPesquisa] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  const handleProfileMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => { setAnchorEl(null); handleMobileMenuClose(); };
  const handleMobileMenuOpen = (e) => setMobileMoreAnchorEl(e.currentTarget);
  const handleMobileMenuClose = () => setMobileMoreAnchorEl(null);
  const handleSubmit = (e) => { e.preventDefault(); };

  // busca (dropdown)
  const [openPanel, setOpenPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');

  const debRef = useRef(null);
  const searchIdRef = useRef(0);

  const doSearch = useCallback(async (q) => {
    searchIdRef.current += 1;
    const myId = searchIdRef.current;

    setOpenPanel(true);
    setLoading(true);
    setError('');

    try {
      // 1) imediato via cache
      const cached = getPrefetched(q);
      if (cached?.length && myId === searchIdRef.current) {
        setResults(cached.slice(0, Math.max(SUGGESTION_LIMIT, 60)));
      }
      // 2) prefetch rápido com buffer maior p/ diversidade
      const snap = await prefetchAll(q, { fast: true, targetCount: 300 });
      if (myId === searchIdRef.current) {
        setResults(Array.isArray(snap) ? snap.slice(0, Math.max(SUGGESTION_LIMIT, 60)) : []);
      }
    } catch (e) {
      if (myId === searchIdRef.current) {
        setError(`Falha ao buscar (${e.message}).`);
        setResults([]);
      }
    } finally {
      if (myId === searchIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = pesquisa.trim();
    if (q.length < MIN_LEN) { setResults([]); setError(''); return; }

    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { doSearch(q); }, DEBOUNCE_MS);

    return () => { if (debRef.current) clearTimeout(debRef.current); };
  }, [pesquisa, doSearch]);

  const handleSelectSuggestion = (item) => {
    setPesquisa(item?.nome || '');
    setOpenPanel(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setOpenPanel(false);
    if (e.key === 'Enter') setOpenPanel(false);
  };
  const onClickAway = () => setOpenPanel(false);

  const visibleResults = useMemo(() => results.slice(0, SUGGESTION_LIMIT), [results]);

  return {
    // busca
    pesquisa, setPesquisa,
    openPanel, setOpenPanel,
    loading, error,
    results, visibleResults,
    handleSelectSuggestion, handleKeyDown, onClickAway,

    // menus/header
    anchorEl, mobileMoreAnchorEl,
    isMenuOpen, isMobileMenuOpen,
    handleSubmit, handleProfileMenuOpen,
    handleMenuClose, handleMobileMenuOpen, handleMobileMenuClose,
  };
}
