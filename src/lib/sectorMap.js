// src/lib/sectorMap.js
// Códigos canônicos -> lista de aliases/nomes equivalentes usados pelas redes
// Cobertura dos 17 departamentos informados

export const SECTOR_MAP = {
  LIMPEZA: [
    'Limpeza', 'Produtos de Limpeza', 'Material de Limpeza', 'Limpeza Doméstica'
  ],
  HORTIFRUTI: [
    'Hortifruti', 'Horti Fruti', 'Horti-Fruti', 'Frutas e Verduras', 'Frutas, Legumes e Verduras', 'FLV'
  ],
  ELETRO: [
    'Eletro', 'Eletroportáteis', 'Eletrônicos'
  ],
  BEBIDAS: [
    'Bebidas', 'Refrigerantes', 'Sucos', 'Água'
  ],
  MERCEARIA: [
    'Mercearia', 'Mercearia Alimentos', 'Secos e Molhados', 'Alimentos', 'Produtos Saudáveis'
  ],
  FRIOS_LATICINIOS: [
    'Frios e Laticínios', 'Frios Laticínios', 'Frios', 'Laticínios', 'Laticinios'
  ],
  CARNES: [
    'Carnes', 'Açougue', 'Bovinos', 'Suínos', 'Aves'
  ],
  PETS: [
    'Pets', 'Pet Shop', 'Pet'
  ],
  PADARIA: [
    'Padaria', 'Padaria e Confeitaria', 'Confeitaria', 'Panificados', 'Pães e Bolos'
  ],
  CONGELADOS: [
    'Congelados', 'Surgelados'
  ],
  BAZAR: [
    'Bazar', 'Utilidades Domésticas', 'UD'
  ],
  HIGIENE_BELEZA: [
    'Higiene e Beleza', 'Higiene', 'Perfumaria', 'Beleza'
  ],
  CHURRASCO: ['Bazar', 'Carnes'],
};

// Rótulos para exibir no front
export const SECTOR_LABEL = {
  LIMPEZA: 'LIMPEZA',
  HORTIFRUTI: 'HORTIFRUTI',
  ELETRO: 'ELETRO',
  BEBIDAS: 'BEBIDAS',
  MERCEARIA: 'MERCEARIA',
  FRIOS_LATICINIOS: 'FRIOS E LATICÍNIOS',
  CARNES: 'CARNES',
  PETS: 'PETS',
  PADARIA: 'PADARIA',
  CONGELADOS: 'CONGELADOS',
  BAZAR: 'BAZAR',
  HIGIENE_BELEZA: 'HIGIENE E BELEZA',
  SAUDAVEIS: 'PRODUTOS SAUDÁVEIS',
  OFERTAS: 'OFERTAS',
  CHURRASCO: 'CHURRASCO',
};

// Constrói “v1,v2,v3” com todos os aliases de um ou vários códigos canônicos
export function buildDeptListFromCanon(canon) {
  const list = Array.isArray(canon)
    ? canon
    : String(canon || '').split(',').map(s => s.trim()).filter(Boolean);

  const set = new Set();
  for (const code of list) {
    const aliases = SECTOR_MAP[code] || [];
    for (const a of aliases) set.add(a);
  }
  return [...set].join(',');
}
