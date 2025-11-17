const API_BASE  = import.meta.env.VITE_API_BASE  || 'https://api-banco-mercados.onrender.com';
export const PAGE_SIZE = Number(import.meta.env.VITE_PAGE_SIZE || 100);

const CONCURRENCY = Number(import.meta.env.VITE_API_CONCURRENCY || 24);
const MAX_PAGES_FULL = Number(import.meta.env.VITE_MAX_PAGES_FULL || 2000);

/* ========= Normalização & util ========= */
const strip = (s) => String(s ?? '').trim();
const norm = (s) => strip(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Normaliza string/array/set para "v1,v2,v3" ordenado
function normalizeMultiInput(v) {
  if (!v) return '';
  const arr = Array.isArray(v) || v instanceof Set ? Array.from(v) : String(v).split(',');
  const out = arr.map(strip).filter(Boolean);
  return out.length ? out.sort((a,b)=>a.localeCompare(b)).join(',') : '';
}


export const fmtBRL = (v) =>
  Number.isFinite(Number(v))
    ? Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '';

const STOPWORDS = new Set([
  'de','da','do','das','dos','e','ou','com','para','por','em','no','na','nos','nas',
  'a','o','as','os','d','c','ao','sem'
]);

const TOKEN_FIX = {
  'bebiba':'bebida',
  'capuccino':'cappuccino', 'cappucino':'cappuccino',
  'iogurt':'iogurte',
  'lactea':'lacteo','lacteas':'lacteo','lacteos':'lacteo',
  'uth':'uht',
};

const SYN = {
  'leite':['uht','lacteo','ninho','italac','elege','tirol','ccgl','itambe','piracanjuba','integral','desnatado','semidesnatado','semi','longa vida','longavida'],
  'uht':['leite','tetra','tetrapak','tetra pak','caixa','caixinha','com tampa','tampa','longa vida','longavida'],
  'lactose':['lacfree','zero lactose','sem lactose','lac free','lac-free'],
  'caixa':['cx','cxa','caixinha','tetra','tetrapak','tetra pak','com tampa','tampa','longa vida','longavida'],
  'cx':['caixa','cxa','caixinha'],
  'cxa':['caixa','cx','caixinha'],
  'garrafa':['pet','garrafa pet'],
  'pet':['garrafa','garrafa pet'],
  'copo':['pote'],
  'bandeja':['cartela'],
  'sache':['sachet','sachê'],
  'litro':['l','lt','litr','litros','1l','1 l','15l','1,5l','1.5l'],
  '1l':['1 l','litro','litros','1000ml','1.0l'],
  '500ml':['0,5l','0.5l','1/2l','0,5 l','0.5 l'],
  'integral':['inteiro','normal'],
  'desnatado':['light','magro'],
  'semidesnatado':['semi-desnatado','semi'],
  'semi':['semidesnatado','semi-desnatado'],
  'achocolatado':['nescau','ovomaltine','nesquik','cacau'],
  'po':['po.','pó','po ','po','em po','em pó'],
  'cafe':['café','expresso','capsula','capsulas','cápsula','cápsulas','soluvel','solúvel','tres','dolce gusto','nespresso'],
  'acucar':['açucar','açúcar','refinado','cristal','demerara','mascavo'],
  'arroz':['tipo 1','agulhinha','parboilizado','integral'],
  'feijao':['feijão','carioca','carioquinha','preto'],
  'oleo':['óleo','soja','girassol','canola','milho'],
  'refri':['refrigerante','refrig','ref','soda','cola','coca','coca-cola','guarana','guaraná','pepsi','fanta','sprite'],
  'agua':['água','mineral','sem gas','sem gás','com gas','com gás'],
  'biscoito':['bolacha','rosquinha','cookie','wafer'],
  'higiene':['sabonete','shampoo','condicionador','desodorante'],
  'limpeza':['detergente','sabao','sabão','sabao em po','sabão em pó','amaciante','candida','água sanitaria','agua sanitaria','alvejante'],
};

function unitVariants(tok){
  const out=new Set([tok]);
  const mL=tok.match(/^(\d+(?:[.,]\d+)?)(l|lt|litro|litros)$/i);
  const mML=tok.match(/^(\d+)\s*ml$/i);
  if(mL){ const n=mL[1].replace(',','.'); out.add(`${n}l`); out.add(`${n} l`); out.add('litro'); out.add('litros'); }
  if(mML){ const n=mML[1]; out.add(`${n}ml`); out.add(`${n} ml`); if(n==='1000'){ out.add('1l'); out.add('1 l'); out.add('litro'); } }
  return Array.from(out);
}

export function tokenize(q){
  let toks = norm(q)
    .replace(/(\d+),(\d+)\s*l\b/g,'$1.$2l')
    .split(/\s+/).filter(Boolean)
    .map(t=>TOKEN_FIX[t]||t)
    .filter(t=>!STOPWORDS.has(t)&&t.length>=2);

  const expanded=[];
  for(const t of toks){ const vs=unitVariants(t); expanded.push(vs[0]); for(let i=1;i<vs.length;i++) expanded.push(vs[i]); }
  return expanded;
}

function collectAllStrings(obj, depth=0, maxDepth=2, out=[]){
  if(!obj||depth>maxDepth) return out;
  for(const k of Object.keys(obj)){
    const v=obj[k]; if(v==null) continue;
    if(typeof v==='string'||typeof v==='number') out.push(String(v));
    else if(typeof v==='object') collectAllStrings(v, depth+1, maxDepth, out);
  }
  return out;
}

function normalizeDateStr(s){
  const raw = strip(s);
  if(!raw) return '';
  const d1 = new Date(raw);
  if(!isNaN(d1)) return d1.toISOString().slice(0,10);
  const m = raw.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
  if(m){
    const [_,dd,mm,yyyy] = m;
    const d2 = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    if(!isNaN(d2)) return d2.toISOString().slice(0,10);
  }
  return raw;
}

// Normaliza o texto do tipo de promoção para uma chave estável
function normalizePromoKey(tipoRaw){
  const t = norm(tipoRaw);
  if(!t) return '';
  if(t.startsWith('oferta')) return 'oferta';
  if(t.startsWith('clube')) return 'clube';
  if(t.includes('mais') && t.includes('menos')) return 'mais_por_menos';
  return t;
}

export function normalizeProduto(p){
  const nome = strip(p.nome_produto||p.nome||p.titulo||'');
  const departamento = strip(p.departamento||p.categoria||p.depto||p.setor||p.setor_produto||'');
  const codigo = strip(p.codigo||p.sku||p.part_number||p.ean||'');
  const marca = strip(p.marca||p.brand||p.fabricante||'');
  const desc  = strip(p.descricao||p.descricao_detalhada||p.descr||'');
  const produto_id = strip(p.produto_id || p.product_id || '');
  const origem = strip(p.origem || p.mercado || p.loja || p.rede || '');

  const preco_original = Number(p.preco_original ?? p.preco ?? p.preco_atual ?? p.price);
  const preco_promo    = Number(p.preco_promo ?? p.precoPromocional ?? p.preco_oferta);

  //campo tipo_promo vindo do backend
  const tipo_promo_raw = strip(p.tipo_promo || p.tipoPromo || p.promo_tipo || '');
  const tipo_promo_key = normalizePromoKey(tipo_promo_raw);

  // coluna/flag promo
  const rawPromo = p.promo;
  const promoStr = String(rawPromo).toLowerCase();
  const promo_bool =
    rawPromo === true || rawPromo === 1 || rawPromo === '1' ||
    promoStr === 'true' || promoStr === 't' || promoStr === 'yes' || promoStr === 'y' || promoStr === 'sim';

  const hasPromoByPrice =
    Number.isFinite(preco_promo) &&
    Number.isFinite(preco_original) &&
    preco_promo > 0 &&
    preco_promo < preco_original;

  const hasPromoType = !!tipo_promo_key;
  const is_promo = promo_bool || hasPromoByPrice || hasPromoType;

  const preco_exibe = is_promo
    ? (Number.isFinite(preco_promo) ? preco_promo : (Number.isFinite(preco_original) ? preco_original : Number(p.preco)))
    : (Number.isFinite(preco_original) ? preco_original : Number(p.preco));

  const desconto_perc = (is_promo && Number.isFinite(preco_original) && Number.isFinite(preco_promo) && preco_original > 0)
    ? Math.round(((preco_original - preco_promo) / preco_original) * 100)
    : 0;

  const preco_fmt = fmtBRL(preco_exibe);
  const preco_original_fmt = fmtBRL(preco_original);
  const preco_promo_fmt = fmtBRL(preco_promo);

  const imagem = strip(p.imagem_link||p.url_imagem||p.imagem||'');
  const data_coleta = normalizeDateStr(p.data_coleta || p.dataColeta || p.data || p.coletado_em);
  const baseId = p.id ?? p._id ?? p.codigo ?? nome;
  const id = (typeof baseId==='string'?baseId.trim():baseId) || Math.random().toString(36).slice(2);
  const nNome=norm(nome);
  const nMarca=norm(marca);
  const fullHay = norm(collectAllStrings(p).join(' '));

  return {
    id, nome, departamento, codigo, marca, desc, produto_id, origem,
    preco: preco_exibe, preco_fmt,
    preco_original, preco_original_fmt,
    preco_promo, preco_promo_fmt,
    desconto_perc, is_promo, promo: promo_bool,
    tipo_promo: tipo_promo_raw,
    tipo_promo_key,
    data_coleta, imagem,
    __n:nNome, __m:nMarca, __hay:fullHay, __raw:p
  };
}

export function scoreProduct(prod, tokens, originalQuery) {
  if (!tokens || !tokens.length) return 1;
  const nNome = prod.__n;
  let score = 0;
  if (nNome.includes(norm(originalQuery))) score += 50;
  if (tokens.length > 0 && nNome.startsWith(tokens[0])) score += 20;
  tokens.forEach(token => { if (nNome.includes(token)) score += 5; });
  return score;
}

// ===== Busca & cache =====
const queryCache = new Map();
// inclui dept/marca/origem/canon na chave
const keyOf = (q, page, dept='', marca='', origem='', canon='') => {
  const toks = tokenize(q).join(' ') || '*';
  const d = normalizeMultiInput(dept);
  const m = normalizeMultiInput(marca);
  const o = normalizeMultiInput(origem);
  const c = normalizeMultiInput(canon);
  return `${toks}|page:${page}|dept:${d}|marca:${m}|origem:${o}|canon:${c}`;
};

export const getPrefetched = (q, page = 1, dept = '', marca = '', origem = '', canon = '') =>
  queryCache.get(keyOf(q, page, dept, marca, origem, canon))?.items || [];

async function fetchSearchResults(query, page, dept='', marca='', origem='', canon='') {
  const params = new URLSearchParams();
  params.set('limit', String(PAGE_SIZE));
  params.set('page', String(page));

  const q = query && query.trim();
  if (q) params.set('q', q);

  const d = normalizeMultiInput(dept);
  const m = normalizeMultiInput(marca);
  const o = normalizeMultiInput(origem);
  const c = normalizeMultiInput(canon);
  if (d) params.set('dept', d);
  if (m) params.set('marca', m);
  if (o) params.set('origem', o);
  if (c) params.set('canon', c);

  const url = `${API_BASE}/produtos?${params.toString()}`;
  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`Erro na API: ${resp.status}`);
  const data = await resp.json();
  const rawItems = Array.isArray(data) ? data : (data.items || []);
  return rawItems.map(normalizeProduto);
}

export async function prefetchAll(q, opts = {}) {
  const page  = opts.page  || 1;
  const dept  = opts.dept  || '';
  const marca = opts.marca || '';
  const origem= opts.origem|| '';
  const canon = opts.canon || '';

  const k = keyOf(q, page, dept, marca, origem, canon);
  const cached = queryCache.get(k);
  if (cached?.items)   return cached.items;
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    try {
      const items = await fetchSearchResults(q, page, dept, marca, origem, canon);
      const scoredItems = items.map(p => ({ ...p, __score: scoreProduct(p, tokenize(q), q) }));
      scoredItems.sort((a, b) => (b.__score || 0) - (a.__score || 0));

      const rec = queryCache.get(k);
      if (rec) { rec.items = scoredItems; delete rec.promise; }
      else queryCache.set(k, { items: scoredItems });

      if (opts.onProgress) opts.onProgress(scoredItems);
      return scoredItems;
    } catch (error) {
      console.error("Falha ao buscar dados:", error);
      queryCache.delete(k);
      throw error;
    }
  })();

  queryCache.set(k, { promise });
  return promise;
}

// Facetas
export function facetize(items){
  const byDept=new Map(), byMarca=new Map(), byOrigem=new Map();
  for(const it of items||[]){
    const d=it.departamento||'Outros';
    const m=it.marca||'—';
    const o=it.origem||'—';
    byDept.set(d,(byDept.get(d)||0)+1);
    byMarca.set(m,(byMarca.get(m)||0)+1);
    byOrigem.set(o,(byOrigem.get(o)||0)+1);
  }
  const toArr=(m)=>Array.from(m,([key,count])=>({key,label:key,count})).sort((a,b)=>b.count-a.count);
  return {
    departamentos: toArr(byDept),
    marcas: toArr(byMarca),
    origens: toArr(byOrigem),
  };
}

// === Chave de agrupamento (corrigida: usa __m real) ===
export function groupKeyFor(p){
  if (p.produto_id) return `id:${p.produto_id}`;
  return `nm:${p.__n}|${p.__m}`;
}

// --------------------------
// HISTÓRICO — FAST endpoint
// --------------------------
const historyCache = new Map(); // cache por gid

export async function fetchHistoryByGroupId(groupId){
  const k = `hist|${groupId}`;
  if (historyCache.has(k)) return historyCache.get(k);

  const url = `${API_BASE}/produtos/historico?gid=${encodeURIComponent(groupId)}`;
  const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!resp.ok) throw new Error(`Erro ao consultar histórico (${resp.status})`);

  const arr = await resp.json();
  const out = (arr || [])
    .filter(h => Number.isFinite(Number(h.preco_exibe)))
    .map(h => ({
      data: String(h.data).slice(0,10),
      preco_original: Number(h.preco_original),
      preco_promo: Number(h.preco_promo),
      preco_exibe: Number(h.preco_exibe)
    }))
    .sort((a,b)=> a.data.localeCompare(b.data));

  historyCache.set(k, out);
  return out;
}


const pageCache = new Map();
async function fetchPage(page){
  if(pageCache.has(page)) return pageCache.get(page);
  const params=new URLSearchParams();
  params.set('page',String(page));
  params.set('limit',String(PAGE_SIZE));
  const url = `${API_BASE}/produtos?${params.toString()}`;

  const resp=await fetch(url, { headers:{Accept:'application/json'}});
  if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const data=await resp.json();
  const raw=Array.isArray(data)?data:(Array.isArray(data?.items)?data.items:[]);
  const normalized=raw.map(normalizeProduto);
  const result={ items: normalized, hasMore: raw.length===PAGE_SIZE };
  pageCache.set(page,result);
  return result;
}
