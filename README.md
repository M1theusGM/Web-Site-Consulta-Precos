# Web-Site-Consulta-Precos

Aplicação para **busca e comparação de produtos** coletados de redes de varejo.

---

## 🎯 Objetivo do Projeto
- Permitir ao usuário pesquisar produtos rapidamente e comparar preços entre supermercados.

---

## 🧱 Arquitetura & Tecnologias 
 
> O frontend consome uma **API REST externa** definida por variável de ambiente.

- **Frontend:** React (Vite) + **Material UI (MUI)** + **React Router**
- **Build/Dev:** Vite
- **Estilos:** MUI + CSS local (`src/index.css`, `pages/*/style.css`)
- **Tipografia:** `@fontsource/roboto`
- **Roteamento SPA:**
  - `/` → Home
  - `/buscar` → Resultados/Pesquisa
  - `/produto/:gid` → Histórico de preços (por **gid**)
- **API Externa (REST JSON):**
  - Base: `VITE_API_BASE` (padrão no código: `https://api-banco-mercados.onrender.com`)
  - Endpoints esperados:
    - `GET /produtos` → lista/busca com filtros e paginação
    - `GET /produtos/historico?gid=...` → série histórica por **gid**

### 📁 Estrutura principal de pastas 

```
site-comparativo/
├─ index.html
├─ package.json
├─ vite.config.js
└─ src/
   ├─ App.jsx
   ├─ index.css
   ├─ main.jsx
   ├─ img/                  # logos e imagens de setores/banners
   ├─ lib/
   │  └─ sectorMap.js       # mapa canônico de setores
   ├─ components/
   │  ├─ BotoesSetores.jsx
   │  └─ HeroBannerCard.jsx
   └─ pages/
      ├─ home/
      │  ├─ homeHelper.js
      │  ├─ index.jsx
      │  └─ style.css
      ├─ product/
      │  └─ PriceHistory.jsx
      └─ search/
         ├─ Results.jsx
         └─ searchPrefetch.js   # normalização, prefetch/paginação, histórico por gid...
```

---

## ✅ Pré-requisitos
- **Node.js 18+** (recomendado **20 LTS**)
- **npm** 

> Como a API é externa, **não** é necessário PostgreSQL nem servidor Node backend neste repositório.

---

## 🚀 Execução (Frontend)

Instale e rode:

```bash
npm i
npm run dev
# abra http://localhost:5173
```

---

## 🔌 Integração com a API (contrato esperado pelo frontend)

- **Rotas:**
  - `GET /produtos`
  - `GET /produtos/historico?gid=...`

- **Parâmetros aceitos em `/produtos`** (o frontend envia conforme filtros da UI):
  - `q` = texto da busca (tokens normalizados)
  - `dept` = departamentos (string com múltiplos)
  - `marca` = marcas (string com múltiplos)
  - `origem` = lojas/redes (string com múltiplos)
  - `canon` = códigos canônicos (ex.: `HORTIFRUTI,CARNES,OFERTAS` — expandidos via `SECTOR_MAP`)
  - Paginação: `page` (1..N), `limit` (default do app: `VITE_PAGE_SIZE`)

- **Histórico por grupo:**
  - `GET /produtos/historico?gid=<group-id>`
  - `gid` é gerado pelo app:  
    - se houver `produto_id`: `id:<produto_id>`  
    - senão: `nm:<nome_normalizado>|<marca_normalizada>`

---

## 🎛️ Telas & Arquivos-chave do Frontend

- `src/pages/search/searchPrefetch.js`
  - **Normalização** (nome/marca/unidades/sinônimos)
  - **Prefetch & paginação** (cache por chave de busca/filtros)
  - **Facetas** (departamento, marca, origem)
  - **Deduplicação**: `groupKeyFor(p)` → `id:<produto_id>` ou `nm:<__n>|<__m>`
  - **Histórico**: `fetchHistoryByGroupId(gid)`
- `src/pages/search/Results.jsx`
  - Listagem (MUI), filtros (dept/marca/origem), ordenação
  - **Regras de promoção por origem** 
  - Exibição de **chips** por `tipo_promo` logo abaixo do preço
- `src/pages/product/PriceHistory.jsx`
  - Consome `/produtos/historico?gid=...` e exibe série/variações
- `src/lib/sectorMap.js`
  - `SECTOR_MAP` e `buildDeptListFromCanon(canon)` para expandir aliases

---

## 🎨 Cores do `tipo_promo` (UI atual)
- **Oferta** → `#d32f2f` (texto branco)
- **Clube** → `#111` (texto branco)
- **Mais por menos** → `#e3f2fd` (borda `#90caf9`)

---

## 🧪 Regras de Negócio (preservadas)
- **Promo Visual**: chip por `tipo_promo`, `% OFF` e preço original riscado (quando aplicável).
- **Deduplicação**: `produto_id` ou `nm:{{nome_norm}}|{{marca_norm}}`.
- **`OFERTAS`**: o backend (externo) deve responder apenas itens promocionais quando solicitado por `canon`/filtros apropriados.

---

## 🧩 Dependências principais (do projeto do ZIP)
- `react`, `react-dom`, **`react-router-dom`**
- **`@mui/material`**, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
- `@fontsource/roboto`
- Dev: `vite`, `@vitejs/plugin-react`, `eslint`

---
