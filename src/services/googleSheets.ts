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

// URL padrão da planilha do Google Sheets (pode ser sobrescrita pelo link fornecido pelo usuário)
export const DEFAULT_GOOGLE_SHEETS_URL = '';

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
  const cleanUrl = url.trim();

  // Se for Mercado Livre e ainda não tiver os parâmetros de afiliado
  if (cleanUrl.includes('mercadolivre.com.br') || cleanUrl.includes('meli.la')) {
    if (!cleanUrl.includes('matt_tool')) {
      const separator = cleanUrl.includes('?') ? '&' : '?';
      return `${cleanUrl}${separator}matt_tool=${ML_AFFILIATE_TOOL}&matt_word=${ML_AFFILIATE_WORD}&forceInApp=true`;
    }
  }

  return cleanUrl;
}

/**
 * Parser de CSV robusto (respeita quebras de linha e vírgulas dentro de aspas)
 */
function parseCsv(csvText: string): Record<string, string>[] {
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

  const data: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const record: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = row[c] !== undefined ? row[c] : '';
    }
    data.push(record);
  }

  return data;
}

/**
 * Localiza o valor de um campo a partir de vários nomes possíveis de colunas
 */
function findField(record: Record<string, string>, possibleNames: string[]): string {
  for (const name of possibleNames) {
    const cleanName = name.toLowerCase();
    // Busca exata ou que contenha o nome
    const key = Object.keys(record).find(k => k === cleanName || k.includes(cleanName));
    if (key && record[key]) {
      return record[key].trim();
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
 * Busca e converte os produtos da planilha do Google Sheets
 */
export async function fetchSheetProducts(sheetUrlOrId?: string): Promise<ClubeProduct[]> {
  const targetUrl = sheetUrlOrId || DEFAULT_GOOGLE_SHEETS_URL;
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
    const title = findField(rec, ['titulo', 'title', 'nome', 'produto', 'name', 'item']);
    const priceRaw = findField(rec, ['preco', 'price', 'valor', 'por', 'preco_atual']);
    const urlRaw = findField(rec, ['link', 'url', 'link_produto', 'afiliado', 'loja', 'href']);

    // Só inclui se tiver pelo menos título ou link
    if (!title && !urlRaw) return;

    const originalPriceRaw = findField(rec, ['preco_antigo', 'preco_original', 'original_price', 'de', 'valor_antigo']);
    const discount = findField(rec, ['desconto', 'discount', 'off', 'pct', 'porcentagem']);
    const image = findField(rec, ['imagem', 'image', 'foto', 'foto_url', 'img', 'link_imagem', 'foto_link']);
    const category = findField(rec, ['categoria', 'category', 'departamento', 'secao', 'tipo']);
    const badge = findField(rec, ['badge', 'destaque', 'tag', 'selo', 'tipo_destaque']);
    const description = findField(rec, ['descricao', 'description', 'desc', 'detalhes']);

    products.push({
      id: `sheet_p_${index + 1}`,
      title: title || 'Oferta Exclusiva',
      price: formatPrice(priceRaw),
      originalPrice: originalPriceRaw ? formatPrice(originalPriceRaw) : undefined,
      discount: discount ? (discount.includes('%') || discount.toUpperCase().includes('OFF') ? discount : `${discount}% OFF`) : undefined,
      image: image || undefined,
      url: formatProductLink(urlRaw),
      category: category || 'Geral',
      badge: badge || undefined,
      description: description || undefined,
    });
  });

  return products;
}
