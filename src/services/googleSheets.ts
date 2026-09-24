// src/services/googleSheets.ts
// Integração dinâmica com Google Sheets para a vitrine do Clube de Desconto

export interface ClubeProduct {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image?: string;
  url: string;
  category?: string;
  badge?: string;
  description?: string;
}

// URL padrão da planilha do Google Sheets configurada pelo usuário
export const DEFAULT_GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1x9iANkItmf_GCXzELhd6fbzzevM1tYyVo_JQ3j71PN0/edit?usp=sharing';

const ML_AFFILIATE_TOOL = '14392997';
const ML_AFFILIATE_WORD = 'ge20260720212555432';

/**
 * Converte qualquer formato de URL do Google Sheets para a URL de exportação pública CSV
 */
export function getGoogleSheetCsvUrl(inputUrlOrId: string): string {
  if (!inputUrlOrId) return '';
  const trimmed = inputUrlOrId.trim();

  // Caso seja URL de "Publicar na Web" (pubhtml ou pub)
  if (trimmed.includes('/pubhtml') || trimmed.includes('/pub?')) {
    return trimmed.replace(/\/pubhtml.*$/, '/pub?output=csv').replace(/output=[^&]+/, 'output=csv');
  }

  // Caso seja link padrão do Google Sheets (ex: https://docs.google.com/spreadsheets/d/ID/edit...)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  if (match) {
    const id = match[1];
    const gid = gidMatch ? `&gid=${gidMatch[1]}` : '';
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid}`;
  }

  // Caso seja apenas o ID bruto da planilha
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return `https://docs.google.com/spreadsheets/d/${trimmed}/export?format=csv`;
  }

  return trimmed;
}

/**
 * Anexa com segurança as tags de afiliado se for um link do Mercado Livre
 */
export function formatProductLink(url: string): string {
  if (!url) return 'https://www.mercadolivre.com.br';
  let cleanUrl = url.trim();

  // Se for Mercado Livre e ainda não tiver os parâmetros de afiliado
  if (cleanUrl.includes('mercadolivre.com.br') || cleanUrl.includes('meli.la')) {
    if (!cleanUrl.includes('matt_tool')) {
      const hashIndex = cleanUrl.indexOf('#');
      let base = cleanUrl;
      let hash = '';
      if (hashIndex !== -1) {
        base = cleanUrl.substring(0, hashIndex);
        hash = cleanUrl.substring(hashIndex);
      }
      const separator = base.includes('?') ? '&' : '?';
      cleanUrl = `${base}${separator}matt_tool=${ML_AFFILIATE_TOOL}&matt_word=${ML_AFFILIATE_WORD}&forceInApp=true${hash}`;
    }
  }

  return cleanUrl;
}

interface CsvParsedRecord {
  _row: string[];
  [header: string]: any;
}

/**
 * Parser de CSV robusto (respeita quebras de linha e vírgulas dentro de aspas)
 */
function parseCsv(csvText: string): CsvParsedRecord[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if (char === '\r') {
        // Ignora CR
      } else if (char === '\n') {
        currentRow.push(currentCell.trim());
        if (currentRow.some(c => c.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];

  // Linha 0 = Cabeçalhos
  const headers = rows[0].map(h =>
    h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  );

  const data: CsvParsedRecord[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const record: CsvParsedRecord = { _row: row };
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = row[c] !== undefined ? row[c] : '';
    }
    data.push(record);
  }

  return data;
}

/**
 * Localiza o valor de um campo a partir de vários nomes possíveis de colunas
 * Prioriza buscas exatas para evitar colisão entre preco_original e preco_atual.
 */
function findField(record: CsvParsedRecord, possibleNames: string[]): string {
  const keys = Object.keys(record);

  // 1. Busca exata de cabeçalho
  for (const name of possibleNames) {
    const cleanName = name.toLowerCase();
    const exactKey = keys.find(k => k === cleanName);
    if (exactKey && record[exactKey] && String(record[exactKey]).trim()) {
      return String(record[exactKey]).trim();
    }
  }

  // 2. Busca parcial segura
  for (const name of possibleNames) {
    const cleanName = name.toLowerCase();
    const partialKey = keys.find(k => {
      if (!k.includes(cleanName)) return false;
      // Prevenir colisão: se busca preço atual, não aceitar colunas com 'original', 'antigo' ou 'de'
      if (
        (cleanName === 'preco' || cleanName === 'preco_atual' || cleanName === 'price' || cleanName === 'por') &&
        (k.includes('original') || k.includes('antigo') || k.includes('de'))
      ) {
        return false;
      }
      return true;
    });
    if (partialKey && record[partialKey] && String(record[partialKey]).trim()) {
      return String(record[partialKey]).trim();
    }
  }

  return '';
}

/**
 * Formata valor de preço caso venha como número puro (ex: 99.9 -> R$ 99,90)
 */
function formatPrice(value: string): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.startsWith('R$')) return trimmed;

  const num = parseFloat(trimmed.replace(',', '.'));
  if (!isNaN(num)) {
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  return trimmed;
}

/**
 * Infere a categoria do produto com base no título caso a planilha não tenha coluna explícita
 */
export function inferCategory(title: string): string {
  const t = title.toLowerCase();

  // Calçados
  if (/(t[eê]nis|sapat[eê]nis|chinelo|botina|bota|sand[aá]lia|sapato|cal[cç]ado|crocs)/i.test(t)) {
    return 'Calçados';
  }

  // Mochilas e Bolsas
  if (/(mochila|bolsa|mala|carteira|pochete|porta[- ]notebook)/i.test(t)) {
    return 'Mochilas & Bolsas';
  }

  // Esporte & Fitness
  if (/(fitness|treino|academia|dry[\s-]?fit|t[eé]rmica|legging|corrida|prote[cç][aã]o uv)/i.test(t)) {
    return 'Esporte & Fitness';
  }

  // Moda Feminina
  if (/(feminina|feminino|mulher|saia|vestido|calcinha|cropped|pantalona|blusinha|flare)/i.test(t)) {
    return 'Moda Feminina';
  }

  // Moda Masculina
  if (/(masculin[oa]|homem|sunga|cueca|bermuda|camisa|camiseta|cal[cç]a|short)/i.test(t)) {
    return 'Moda Masculina';
  }

  // Acessórios
  if (/(meia|meias|[oó]culos|bon[eé]|rel[oó]gio|cinto|roup[aã]o)/i.test(t)) {
    return 'Acessórios';
  }

  return 'Outros';
}

/**
 * Busca e converte os produtos da planilha do Google Sheets
 */
export async function fetchSheetProducts(sheetUrlOrId?: string): Promise<ClubeProduct[]> {
  const targetUrl = (sheetUrlOrId && sheetUrlOrId.trim()) ? sheetUrlOrId.trim() : DEFAULT_GOOGLE_SHEETS_URL;
  if (!targetUrl || targetUrl.trim().length === 0) {
    return [];
  }

  const csvUrl = getGoogleSheetCsvUrl(targetUrl);
  const response = await fetch(csvUrl, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao acessar planilha: HTTP ${response.status}`);
  }

  const csvText = await response.text();
  const records = parseCsv(csvText);

  const products: ClubeProduct[] = [];

  records.forEach((rec, index) => {
    // 1. Título do produto (com fallback posicional da coluna 1)
    const rawTitle = findField(rec, ['nome', 'titulo', 'title', 'produto', 'name', 'item']) || rec._row[1] || '';
    const title = rawTitle.replace(/\s+/g, ' ').trim();

    // 2. Link do produto (com fallback posicional da coluna 6)
    const urlRaw = findField(rec, ['link_do_produto', 'link', 'url', 'link_produto', 'afiliado', 'loja', 'href']) || rec._row[6] || '';

    // Só inclui se tiver pelo menos título ou link
    if (!title && !urlRaw) return;

    // 3. Preços e Desconto (com fallbacks posicionais das colunas 2, 3 e 4)
    const originalPriceRaw = findField(rec, ['preco_original', 'preco_antigo', 'original_price', 'de', 'valor_antigo']) || rec._row[2] || '';
    const priceRaw = findField(rec, ['preco_atual', 'por', 'preco_promocional', 'preco_final', 'valor_atual', 'preco', 'price', 'valor']) || rec._row[3] || '';
    const discountRaw = findField(rec, ['desconto', 'discount', 'off', 'pct', 'porcentagem']) || rec._row[4] || '';

    // 4. Imagem (com fallback posicional da coluna 5)
    const imageRaw = findField(rec, ['imagem', 'image', 'foto', 'foto_url', 'img', 'link_imagem', 'foto_link']) || rec._row[5] || '';

    // 5. Categoria (com inferência automática se não informada)
    const explicitCategory = findField(rec, ['categoria', 'category', 'departamento', 'secao', 'tipo']);
    const category = (explicitCategory && explicitCategory !== 'Geral') ? explicitCategory : inferCategory(title);

    // 6. Badge em destaque (ex: Oferta imperdível se desconto for alto)
    let badge = findField(rec, ['badge', 'destaque', 'tag', 'selo', 'tipo_destaque']);
    if (!badge && discountRaw) {
      const discountNumber = parseInt(discountRaw.replace(/\D/g, ''), 10);
      if (discountNumber >= 65) {
        badge = 'OFERTA IMPERDÍVEL';
      } else if (discountNumber >= 50) {
        badge = 'SUPER DESCONTO';
      }
    }

    const description = findField(rec, ['descricao', 'description', 'desc', 'detalhes']);
    const codeId = findField(rec, ['codigo', 'id', 'cod']) || rec._row[0] || `sheet_p_${index + 1}`;

    const discount = discountRaw
      ? (discountRaw.includes('%') || discountRaw.toUpperCase().includes('OFF') ? discountRaw : `${discountRaw}% OFF`)
      : undefined;

    products.push({
      id: codeId,
      title: title || 'Oferta Exclusiva',
      price: formatPrice(priceRaw),
      originalPrice: originalPriceRaw ? formatPrice(originalPriceRaw) : undefined,
      discount: discount,
      image: imageRaw || undefined,
      url: formatProductLink(urlRaw),
      category: category || 'Geral',
      badge: badge || undefined,
      description: description || undefined,
    });
  });

  return products;
}
