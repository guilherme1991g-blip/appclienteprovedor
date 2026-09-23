// Constantes Oficiais do Programa de Afiliados do Mercado Livre
export const ML_MATT_TOOL = '14392997';
export const ML_MATT_WORD = 'ge20260720212555432';

export type MLCategory = 'todas' | 'celulares' | 'informatica' | 'casa' | 'tv' | 'cupons';

export interface MLCategoryTab {
  id: MLCategory;
  label: string;
  icon: string;
}

export interface MLProduct {
  id: string;
  title: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  installments?: string;
  image: string;
  category: MLCategory;
  url: string;
  freeShipping?: boolean;
  badge?: string;
}

export interface MLCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountTag: string;
  minPurchase?: string;
  affiliateUrl: string;
}

/**
 * Anexa automaticamente os parâmetros oficiais de rastreamento de afiliado a qualquer URL do Mercado Livre.
 */
export function formatAffiliateUrl(
  rawUrl: string,
  mattTool: string = ML_MATT_TOOL,
  mattWord: string = ML_MATT_WORD
): string {
  if (!rawUrl) return 'https://www.mercadolivre.com.br';

  try {
    const [baseUrl, hash] = rawUrl.split('#');
    const separator = baseUrl.includes('?') ? '&' : '?';
    const trackedUrl = `${baseUrl}${separator}matt_tool=${mattTool}&matt_word=${mattWord}&forceInApp=true`;
    return hash ? `${trackedUrl}#${hash}` : trackedUrl;
  } catch {
    return rawUrl;
  }
}

/**
 * Cria um link de busca direta no Mercado Livre já com os parâmetros de afiliado.
 */
export function buildSearchAffiliateUrl(
  query: string,
  mattTool: string = ML_MATT_TOOL,
  mattWord: string = ML_MATT_WORD
): string {
  const cleanQuery = encodeURIComponent(query.trim().replace(/\s+/g, '-'));
  return `https://lista.mercadolivre.com.br/${cleanQuery}?matt_tool=${mattTool}&matt_word=${mattWord}&forceInApp=true`;
}

// Categorias disponíveis no Clube de Descontos
export const ML_CATEGORIES: MLCategoryTab[] = [
  { id: 'todas', label: 'Todas as Ofertas', icon: 'Flame' },
  { id: 'cupons', label: 'Cupons Ativos', icon: 'Ticket' },
  { id: 'celulares', label: 'Celulares & Tablets', icon: 'Smartphone' },
  { id: 'informatica', label: 'Informática & Wi-Fi', icon: 'Wifi' },
  { id: 'casa', label: 'Casa & Eletro', icon: 'Home' },
  { id: 'tv', label: 'Smart TVs & Áudio', icon: 'Tv' },
];

// Cupons em Destaque
export const ML_COUPONS: MLCoupon[] = [
  {
    id: 'c1',
    code: 'MELI20',
    title: 'R$ 20 OFF em Todo o Site',
    description: 'Válido em compras acima de R$ 199 pelo app do Mercado Livre.',
    discountTag: 'R$ 20 OFF',
    minPurchase: 'Acima de R$ 199',
    affiliateUrl: formatAffiliateUrl('https://www.mercadolivre.com.br/cupons'),
  },
  {
    id: 'c2',
    code: 'TECH50',
    title: 'R$ 50 OFF em Eletrônicos & Informática',
    description: 'Válido para celulares, roteadores, notebooks e acessórios.',
    discountTag: 'R$ 50 OFF',
    minPurchase: 'Acima de R$ 400',
    affiliateUrl: formatAffiliateUrl('https://www.mercadolivre.com.br/c/informatica'),
  },
  {
    id: 'c3',
    code: 'CASA15',
    title: '15% OFF em Casa & Eletrodomésticos',
    description: 'Desconto em Air Fryers, aspiradores, cafeteiras e panelas.',
    discountTag: '15% OFF',
    minPurchase: 'Acima de R$ 150',
    affiliateUrl: formatAffiliateUrl('https://www.mercadolivre.com.br/c/eletrodomesticos'),
  },
  {
    id: 'c4',
    code: 'MELIMAIS',
    title: 'Frete Grátis & Benefícios Exclusivos',
    description: 'Aproveite entrega rápida gratuita nos produtos identificados.',
    discountTag: 'FRETE GRÁTIS',
    minPurchase: 'Sem valor mínimo',
    affiliateUrl: formatAffiliateUrl('https://www.mercadolivre.com.br/assinaturas/melimais'),
  },
];

// Produtos e Ofertas em Destaque
export const ML_PRODUCTS: MLProduct[] = [
  // --- INFORMÁTICA & WI-FI ---
  {
    id: 'p-wifi-1',
    title: 'TP-Link Tapo C200 Câmera de Segurança Wifi 1080P 360° Pan/Tilt Visão Noturna',
    price: 'R$ 199,00',
    originalPrice: 'R$ 279,00',
    discount: '28% OFF',
    installments: 'em até 6x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_756409-MLA115252629948_082026-AB.webp',
    category: 'informatica',
    url: formatAffiliateUrl('https://www.mercadolivre.com.br/tp-link-tapo-c200-camera-de-seguranca-wifi-1080p-360-pantilt/p/MLB18593981'),
    freeShipping: true,
    badge: 'Mais Vendido',
  },
  {
    id: 'p-wifi-2',
    title: 'Roteador Wi-Fi Mesh TP-Link Deco M4 AC1200 Gigabit Dual Band (Kit 2 Unidades)',
    price: 'R$ 489,00',
    originalPrice: 'R$ 649,00',
    discount: '24% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_892842-MLU74504176211_022024-AB.webp',
    category: 'informatica',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/roteador-tp-link-deco-m4'),
    freeShipping: true,
    badge: 'Ideal p/ Wi-Fi',
  },
  {
    id: 'p-wifi-3',
    title: 'Repetidor TP-Link Extensor De Alcance Wi-Fi 300mbps Tl-wa850re Bivolt',
    price: 'R$ 119,90',
    originalPrice: 'R$ 169,00',
    discount: '29% OFF',
    installments: 'em até 4x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_914619-MLA46618408489_072021-AB.webp',
    category: 'informatica',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/repetidor-tp-link-wa850re'),
    freeShipping: true,
  },
  {
    id: 'p-info-4',
    title: 'Kit Teclado e Mouse Sem Fio Logitech MK220 ABNT2 Preto Pilhas Inclusas',
    price: 'R$ 139,00',
    originalPrice: 'R$ 189,00',
    discount: '26% OFF',
    installments: 'em até 4x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_794273-MLA48439166708_122021-AB.webp',
    category: 'informatica',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/teclado-mouse-logitech-mk220'),
    freeShipping: true,
  },

  // --- CELULARES & TABLETS ---
  {
    id: 'p-cel-1',
    title: 'Smartphone Samsung Galaxy A15 4G 128GB 4GB RAM Câmera Tripla 50MP Tela 6.5"',
    price: 'R$ 899,00',
    originalPrice: 'R$ 1.299,00',
    discount: '30% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_988192-MLA116411932758_092026-AB.webp',
    category: 'celulares',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/samsung-galaxy-a15-128gb'),
    freeShipping: true,
    badge: 'Super Oferta',
  },
  {
    id: 'p-cel-2',
    title: 'Smartphone Motorola Moto G54 5G 256GB 8GB RAM Câmera 50MP OIS Bateria 5000mAh',
    price: 'R$ 1.149,00',
    originalPrice: 'R$ 1.599,00',
    discount: '28% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_975716-MLA116411932758_092026-AB.webp',
    category: 'celulares',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/moto-g54-5g-256gb'),
    freeShipping: true,
    badge: '5G Pronto',
  },
  {
    id: 'p-cel-3',
    title: 'Xiaomi Redmi Note 13 4G 256GB 8GB RAM Tela AMOLED 120Hz Câmera 108MP',
    price: 'R$ 1.289,00',
    originalPrice: 'R$ 1.799,00',
    discount: '28% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_781423-MLU74504176211_022024-AB.webp',
    category: 'celulares',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/xiaomi-redmi-note-13-256gb'),
    freeShipping: true,
  },

  // --- CASA & ELETRO ---
  {
    id: 'p-casa-1',
    title: 'Fritadeira Sem Óleo Air Fryer Mondial Family 4 Litros Inox Preto 1500W',
    price: 'R$ 279,90',
    originalPrice: 'R$ 449,90',
    discount: '37% OFF',
    installments: 'em até 8x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_721013-MLA95939753067_102025-AB.webp',
    category: 'casa',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/air-fryer-mondial-4l'),
    freeShipping: true,
    badge: 'Destaque',
  },
  {
    id: 'p-casa-2',
    title: 'Smart Speaker com Alexa Echo Pop Compacta Som Envolvente com Wi-Fi & Bluetooth',
    price: 'R$ 299,00',
    originalPrice: 'R$ 399,00',
    discount: '25% OFF',
    installments: 'em até 6x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_868127-MLA118013296557_092026-AB.webp',
    category: 'casa',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/echo-pop-alexa'),
    freeShipping: true,
    badge: 'Casa Inteligente',
  },
  {
    id: 'p-casa-3',
    title: 'Panela Pressão Brinox Ceramic Pressure Indução 6,8L Revestimento Cerâmico Vanilla',
    price: 'R$ 499,00',
    originalPrice: 'R$ 699,00',
    discount: '28% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_721013-MLA95939753067_102025-AB.webp',
    category: 'casa',
    url: formatAffiliateUrl('https://www.mercadolivre.com.br/panela-pressao-brinox-ceramic-pressure-inducao-68l-vanilla/p/MLB22931744'),
    freeShipping: true,
  },

  // --- SMART TVS & ÁUDIO ---
  {
    id: 'p-tv-1',
    title: 'Smart TV Samsung 43" Crystal UHD 4K HDR Gaming Hub Wi-Fi Bluetooth',
    price: 'R$ 1.899,00',
    originalPrice: 'R$ 2.499,00',
    discount: '24% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_756409-MLA115252629948_082026-AB.webp',
    category: 'tv',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/smart-tv-samsung-43-crystal-uhd-4k'),
    freeShipping: true,
    badge: 'Cinema em Casa',
  },
  {
    id: 'p-tv-2',
    title: 'Caixa de Som Portátil JBL Go 4 Bluetooth À Prova D\'Água e Poeira Original',
    price: 'R$ 269,00',
    originalPrice: 'R$ 349,00',
    discount: '23% OFF',
    installments: 'em até 6x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_892842-MLU74504176211_022024-AB.webp',
    category: 'tv',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/jbl-go-4-original'),
    freeShipping: true,
  },
  {
    id: 'p-tv-3',
    title: 'Fone de Ouvido Bluetooth JBL Tune 520BT Sem Fio Bateria Até 57 Horas Pure Bass',
    price: 'R$ 249,00',
    originalPrice: 'R$ 329,00',
    discount: '24% OFF',
    installments: 'em até 6x sem juros',
    image: 'https://http2.mlstatic.com/D_Q_NP_2X_914619-MLA46618408489_072021-AB.webp',
    category: 'tv',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/jbl-tune-520bt'),
    freeShipping: true,
  },
];
