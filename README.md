# Web-Site-Consulta-Precos

Aplicação para **busca e comparação de produtos** coletados em redes de varejo, com regras de promoção por origem, deduplicação de resultados e histórico de preços.

---

## 🎯 Objetivo do Projeto
- Permitir ao usuário pesquisar produtos rapidamente e comparar preços entre origens/lojas.

---

## 🧱 Arquitetura & Tecnologias
- **Backend:** Fastify + @fastify/postgres, @fastify/cors, @fastify/compress, dotenv
- **Banco de Dados:** PostgreSQL (extensão `unaccent` usada nas consultas)
- **Frontend:** React (Vite) + Material UI (MUI)
- **Comunicação:** REST JSON
- **Scraping:** Scraping de dados vindos dos mercados, feito diretamente pelo raspberry pi

---

## ✅ Pré‑requisitos
- **Node.js 18+**
- **PostgreSQL 14+** 
- **pnpm** ou **npm**

---

## ⚙️ Configuração do Ambiente

### 1) Banco de Dados (PostgreSQL)
1. Crie um banco (ex.: `mercados`):
   ```sql
   CREATE DATABASE mercados;
   \c mercados;
   ```
2. Habilite a extensão **unaccent**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS unaccent;
   ```
3. (Opcional) Crie a tabela **produtos** mínima compatível com o código:
   ```sql
   CREATE TABLE IF NOT EXISTS produtos (
     id SERIAL PRIMARY KEY,
     produto_id TEXT,              -- ID da origem/coleta (quando houver)
     nome_produto TEXT NOT NULL,
     departamento TEXT,
     marca TEXT,
     origem TEXT,                  -- ex.: 'Stok Center', 'Zaffari'
     imagem_link TEXT,
     preco_original NUMERIC(12,2),
     preco_promo NUMERIC(12,2),
     promo BOOLEAN,                -- indicador de oferta
     tipo_promo TEXT,              -- 'Oferta' | 'Clube' | 'Mais por menos'
     data_coleta DATE,
     created_at TIMESTAMP DEFAULT now()
   );
   -- Índices úteis
   CREATE INDEX IF NOT EXISTS idx_produtos_nome_unaccent ON produtos (lower(unaccent(nome_produto)));
   CREATE INDEX IF NOT EXISTS idx_produtos_departamento ON produtos (lower(unaccent(coalesce(departamento,''))));
   CREATE INDEX IF NOT EXISTS idx_produtos_marca ON produtos (lower(unaccent(coalesce(marca,''))));
   CREATE INDEX IF NOT EXISTS idx_produtos_origem ON produtos (lower(unaccent(coalesce(origem,''))));
   ```

### 2) Variáveis de Ambiente

#### Backend (`backend/.env`)
```ini
PGHOST=localhost
PGDATABASE=mercados
PGUSER=seu_usuario
PGPASSWORD=sua_senha
PORT=3000
```

#### Frontend (`webapp/.env`)
```ini
VITE_API_BASE=http://localhost:3000
VITE_PAGE_SIZE=100
VITE_API_CONCURRENCY=24
VITE_MAX_PAGES_FULL=2000
```

---

## 🚀 Execução

### Backend
```bash
cd backend
# npm i fastify @fastify/postgres @fastify/cors @fastify/compress dotenv
node server.js
# ou: node --env-file=.env server.js
```
- **Rotas**:
  - `GET /produtos` → lista/busca com filtros e paginação
  - `GET /produtos/historico?gid=...` → série histórica por **gid**
- **Parâmetros aceitos em `/produtos`**:
  - `q` = texto da busca (prefixo + termos, com `unaccent`)
  - `dept` = departamentos 
  - `marca` = marcas 
  - `origem` = lojas/redes 
  - `canon` = códigos  (ex.: `HORTIFRUTI,CARNES,OFERTAS` — expandidos via `SECTOR_MAP`)
  - Paginação: `page` (1..N), `limit` (até 1000; default 100)

**Exemplos com cURL**
```bash
curl http://localhost:3000/

curl "http://localhost:3000/produtos?q=leite&page=1&limit=50"

curl "http://localhost:3000/produtos?dept=Frios%20e%20Latic%C3%ADnios&canon=OFERTAS"

curl "http://localhost:3000/produtos/historico?gid=id:12345"

curl "http://localhost:3000/produtos/historico?gid=nm:leite%20uht%201l|italac"
```

### Frontend
```bash
cd webapp
# npm i
# npm run dev
# http://localhost:5173
```
- **Arquivos-chave**:
  - `src/pages/search/searchPrefetch.js`: normalização, prefetch/paginação, histórico por `gid`, facetas e **deduplicação** (`groupKeyFor`).
  - `src/pages/search/Results.jsx`: grid responsivo (MUI), filtros por departamento, ordenação, **regras de promoção por origem** e logos.
- **Cores do `tipo_promo`**:
  - **Oferta** → vermelho
  - **Clube** → preto
  - **Mais por menos** → azul claro

---

## 🧪 Regras de Negócio 
- **Promo Visual**: chip por `tipo_promo`, `% OFF` e preço original riscado.
- **Deduplicação**: `produto_id` ou `nm:{{nome_norm}}|{{marca_norm}}`.
- **`OFERTAS`**: backend filtra por `promo IS TRUE`.

---
