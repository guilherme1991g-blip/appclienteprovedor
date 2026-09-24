// src/services/googleSheets.ts
// Integração dinâmica com Google Sheets para a vitrine do Clube de Desconto (com suporte a múltiplas abas/folhas)

export interface ClubeProduct {
  id: string;
  title: string;
  price: string;
  priceNumber?: number;
  originalPrice?: string;
  discount?: string;
  discountNumber?: number;
  image?: string;
  url: string;
  category?: string;
  subcategory?: string;
  tvSizeGroup?: string;
  badge?: string;
  description?: string;
  sheetTab?: string;
}

export interface SheetTab {
  name: string;
  gid: string;
}

// URL padrão da planilha do Google Sheets configurada pelo usuário
export const DEFAULT_GOOGLE_SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1x9iANkItmf_GCXzELhd6fbzzevM1tYyVo_JQ3j71PN0/edit?usp=sharing';

// Abas conhecidas da planilha oficial do usuário como fallback seguro
export const DEFAULT_KNOWN_TABS: SheetTab[] = [
  { name: 'calcados rolpas e bolsa', gid: '0' },
  { name: 'celulares', gid: '427205087' },
  { name: 'Tv', gid: '733253340' },
  { name: 'Ferramenta', gid: '965243209' },
];

const ML_AFFILIATE_TOOL = '14392997';
const ML_AFFILIATE_WORD = 'ge20260720212555432';

/**
 * Extrai o ID da planilha do Google a partir de qualquer formato de link
 */
export function extractSpreadsheetId(inputUrlOrId: string): string {
  if (!inputUrlOrId) return '';
  const trimmed = inputUrlOrId.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) return trimmed;
  return '';
}

/**
 * Descobre dinamicamente todas as abas (folhas) de uma planilha do Google Sheets
 */
export async function discoverSheetTabs(spreadsheetId: string): Promise<SheetTab[]> {
  if (!spreadsheetId) return DEFAULT_KNOWN_TABS;
  try {
    const htmlUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/htmlview`;
    const res = await fetch(htmlUrl, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
    if (!res.ok) return DEFAULT_KNOWN_TABS;
    const html = await res.text();
    const regex = /items\.push\({\s*name:\s*"([^"]+)"[^}]+gid:\s*"([0-9-]+)"/g;
    const tabs: SheetTab[] = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      tabs.push({ name: match[1].trim(), gid: match[2].trim() });
    }
    return tabs.length > 0 ? tabs : DEFAULT_KNOWN_TABS;
  } catch (err) {
    console.warn('Erro ao descobrir abas da planilha:', err);
    return DEFAULT_KNOWN_TABS;
  }
}

/**
 * Converte qualquer formato de URL do Google Sheets para a URL de exportação pública CSV
 */
export function getGoogleSheetCsvUrl(inputUrlOrId: string, gid?: string): string {
  if (!inputUrlOrId) return '';
  const trimmed = inputUrlOrId.trim();

  // Caso seja URL de "Publicar na Web" (pubhtml ou pub)
  if (trimmed.includes('/pubhtml') || trimmed.includes('/pub?')) {
    let url = trimmed.replace(/\/pubhtml.*$/, '/pub?output=csv').replace(/output=[^&]+/, 'output=csv');
    if (gid && !url.includes('gid=')) {
      url += `&gid=${gid}`;
    }
    return url;
  }

  // Caso seja link padrão do Google Sheets (ex: https://docs.google.com/spreadsheets/d/ID/edit...)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const gidMatch = trimmed.match(/[#&?]gid=([0-9]+)/);
  const targetGid = gid !== undefined ? gid : (gidMatch ? gidMatch[1] : undefined);

  if (match) {
    const id = match[1];
    const gidParam = targetGid !== undefined ? `&gid=${targetGid}` : '';
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gidParam}`;
  }

  // Caso seja apenas o ID bruto da planilha
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    const gidParam = targetGid !== undefined ? `?format=csv&gid=${targetGid}` : '?format=csv';
    return `https://docs.google.com/spreadsheets/d/${trimmed}/export${gidParam}`;
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
 * Converte valor de preço textual brasileiro ou numérico para número (ex: "R$ 1.499" -> 1499, "R$ 78,11" -> 78.11)
 */
export function parsePriceNumber(priceStr: string | number): number {
  if (typeof priceStr === 'number') return isNaN(priceStr) ? 0 : priceStr;
  if (!priceStr) return 0;
  const clean = String(priceStr).replace(/[^\d.,]/g, '').trim();
  if (clean.includes(',')) {
    const parts = clean.split(',');
    const whole = parts[0].replace(/\./g, '');
    const decimal = parts[1];
    return parseFloat(`${whole}.${decimal}`) || 0;
  }
  const whole = clean.replace(/\./g, '');
  return parseFloat(whole) || 0;
}

/**
 * Extrai o grupo de tamanho de tela para TVs a partir do título
 */
export function extractTvSizeGroup(title: string): string | undefined {
  if (!title) return undefined;
  const regexExplicit = /\b(24|32|40|42|43|50|55|58|60|65|70|75|85)\s*(?:''|"|”|polegadas?|pol)?\b/i;
  const match = title.match(regexExplicit);
  if (match) {
    const inches = parseInt(match[1], 10);
    if (inches <= 32) return 'Até 32"';
    if (inches <= 43) return '40" a 43"';
    if (inches <= 55) return '50" a 55"';
    return '60" ou mais';
  }
  return undefined;
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

  return 'Moda & Vestuário';
}

/**
 * Define a categoria e subcategoria do produto com base na aba da planilha e título
 */
export function resolveCategoryAndSubcategory(
  tabName: string,
  title: string,
  explicitCategory?: string
): { category: string; subcategory: string } {
  const cleanTab = tabName.toLowerCase().trim();

  // 1. Celulares
  if (cleanTab.includes('celular') || cleanTab.includes('smartphone')) {
    const t = title.toLowerCase();
    let sub = 'Outros Celulares';
    if (/samsung|galaxy/i.test(t)) sub = 'Samsung Galaxy';
    else if (/motorola|moto/i.test(t)) sub = 'Motorola Moto';
    else if (/xiaomi|poco|redmi/i.test(t)) sub = 'Xiaomi & Poco';
    else if (/realme/i.test(t)) sub = 'Realme';
    return { category: 'Celulares', subcategory: sub };
  }

  // 2. Smart TVs
  if (cleanTab.includes('tv') || cleanTab.includes('televis')) {
    const t = title.toLowerCase();
    let sub = 'Outras Smart TVs';
    if (/lg/i.test(t)) sub = 'Smart TVs LG';
    else if (/samsung/i.test(t)) sub = 'Smart TVs Samsung';
    else if (/philco/i.test(t)) sub = 'Smart TVs Philco';
    else if (/tcl|philips/i.test(t)) sub = 'TCL & Philips';
    return { category: 'Smart TVs', subcategory: sub };
  }

  // 3. Ferramentas
  if (cleanTab.includes('ferramenta')) {
    const t = title.toLowerCase();
    let sub = 'Outras Ferramentas';
    if (/(furadeira|parafusadeira|impacto)/i.test(t)) sub = 'Furadeiras & Parafusadeiras';
    else if (/(esmerilhadeira|lixadeira)/i.test(t)) sub = 'Esmerilhadeiras';
    else if (/(serra)/i.test(t)) sub = 'Serras & Discos';
    else if (/(solda|inversora|mig|tig)/i.test(t)) sub = 'Máquinas de Solda';
    else if (/(jogo|kit|chave|maleta|soquete|catraca|broca)/i.test(t)) sub = 'Jogos de Ferramentas';
    return { category: 'Ferramentas', subcategory: sub };
  }

  // 4. Moda, Calçados e Bolsas
  if (cleanTab.includes('calcado') || cleanTab.includes('roupa') || cleanTab.includes('bolsa')) {
    const t = title.toLowerCase();
    let sub = 'Vestuário & Moda';
    if (/(t[eê]nis|sapat[eê]nis|chinelo|botina|bota|sand[aá]lia|sapato|cal[cç]ado)/i.test(t)) sub = 'Tênis & Calçados';
    else if (/(mochila|bolsa|mala|carteira|pochete)/i.test(t)) sub = 'Mochilas & Bolsas';
    else if (/(fitness|treino|academia|dry[\s-]?fit|t[eé]rmica|legging|corrida)/i.test(t)) sub = 'Fitness & Treino';
    else if (/(feminina|feminino|mulher|saia|vestido|calcinha|cropped|pantalona|blusinha|flare)/i.test(t)) sub = 'Moda Feminina';
    else if (/(masculin[oa]|homem|sunga|cueca|bermuda|camisa|camiseta|cal[cç]a|short)/i.test(t)) sub = 'Moda Masculina';
    return { category: 'Moda & Calçados', subcategory: sub };
  }

  // Fallback
  const catName = explicitCategory && explicitCategory.trim() && explicitCategory.trim() !== 'Geral'
    ? explicitCategory.trim()
    : tabName.charAt(0).toUpperCase() + tabName.slice(1);

  return { category: catName, subcategory: 'Geral' };
}

/**
 * Processa o CSV de uma aba e converte em produtos tipados
 */
function parseSheetCsvRecords(csvText: string, tab: SheetTab): ClubeProduct[] {
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

    // 5. Categoria e Subcategoria (baseadas na aba da planilha e título)
    const explicitCategory = findField(rec, ['categoria', 'category', 'departamento', 'secao', 'tipo']);
    const { category, subcategory } = resolveCategoryAndSubcategory(tab.name, title, explicitCategory);

    // 6. Percentual numérico de desconto
    const discountNumber = discountRaw ? parseInt(discountRaw.replace(/\D/g, ''), 10) || 0 : 0;

    // 7. Badge em destaque (ex: Oferta imperdível se desconto for alto)
    let badge = findField(rec, ['badge', 'destaque', 'tag', 'selo', 'tipo_destaque']);
    if (!badge && discountNumber > 0) {
      if (discountNumber >= 65) {
        badge = 'OFERTA IMPERDÍVEL';
      } else if (discountNumber >= 50) {
        badge = 'SUPER DESCONTO';
      } else if (discountNumber >= 40) {
        badge = 'DESTAQUE';
      }
    }

    const description = findField(rec, ['descricao', 'description', 'desc', 'detalhes']);
    const rawId = findField(rec, ['codigo', 'id', 'cod']) || rec._row[0] || `item_${index + 1}`;
    const uniqueId = `${tab.gid}_${rawId}`;

    const discount = discountRaw
      ? (discountRaw.includes('%') || discountRaw.toUpperCase().includes('OFF') ? discountRaw : `${discountRaw}% OFF`)
      : undefined;

    const priceNumber = parsePriceNumber(priceRaw);
    const isTv = tab.name.toLowerCase().includes('tv') || tab.name.toLowerCase().includes('televis') || category === 'Smart TVs';
    const tvSizeGroup = isTv ? extractTvSizeGroup(title) : undefined;

    products.push({
      id: uniqueId,
      title: title || 'Oferta Exclusiva',
      price: formatPrice(priceRaw),
      priceNumber: priceNumber > 0 ? priceNumber : undefined,
      originalPrice: originalPriceRaw ? formatPrice(originalPriceRaw) : undefined,
      discount: discount,
      discountNumber,
      image: imageRaw || undefined,
      url: formatProductLink(urlRaw),
      category: category || 'Geral',
      subcategory: subcategory || 'Geral',
      tvSizeGroup,
      badge: badge || undefined,
      description: description || undefined,
      sheetTab: tab.name,
    });
  });

  return products;
}

/**
 * Busca e converte os produtos de TODAS as abas (folhas) da planilha do Google Sheets
 */
export async function fetchSheetProducts(sheetUrlOrId?: string): Promise<ClubeProduct[]> {
  const targetUrl = (sheetUrlOrId && sheetUrlOrId.trim()) ? sheetUrlOrId.trim() : DEFAULT_GOOGLE_SHEETS_URL;
  if (!targetUrl || targetUrl.trim().length === 0) {
    return [];
  }

  const spreadsheetId = extractSpreadsheetId(targetUrl);
  const gidMatch = targetUrl.match(/[#&?]gid=([0-9]+)/);

  // Se o usuário passou uma URL com um gid específico diferente de 0, carrega somente aquela aba
  if (gidMatch && gidMatch[1] !== '0') {
    const specificGid = gidMatch[1];
    const csvUrl = getGoogleSheetCsvUrl(targetUrl, specificGid);
    const response = await fetch(csvUrl, { headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) {
      throw new Error(`Falha ao acessar aba ${specificGid}: HTTP ${response.status}`);
    }
    const csvText = await response.text();
    return parseSheetCsvRecords(csvText, { name: 'Ofertas', gid: specificGid });
  }

  // Caso contrário, descobre todas as abas (folhas) e carrega os produtos de todas elas
  const tabs = await discoverSheetTabs(spreadsheetId);

  const fetchPromises = tabs.map(async tab => {
    try {
      const csvUrl = getGoogleSheetCsvUrl(targetUrl, tab.gid);
      const res = await fetch(csvUrl, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) {
        console.warn(`Aba "${tab.name}" (gid: ${tab.gid}) retornou HTTP ${res.status}`);
        return [];
      }
      const csvText = await res.text();
      return parseSheetCsvRecords(csvText, tab);
    } catch (err) {
      console.warn(`Erro ao carregar aba "${tab.name}":`, err);
      return [];
    }
  });

  const results = await Promise.all(fetchPromises);
  const allProducts: ClubeProduct[] = [];
  results.forEach(tabProducts => {
    allProducts.push(...tabProducts);
  });

  return allProducts;
}
