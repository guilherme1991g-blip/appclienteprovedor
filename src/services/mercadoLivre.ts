// Constantes Oficiais do Programa de Afiliados do Mercado Livre
export const ML_MATT_TOOL = '14392997';
export const ML_MATT_WORD = 'ge20260720212555432';

export type MLCategory =
  | 'todas'
  | 'cupons'
  | 'celulares'
  | 'informatica'
  | 'tv'
  | 'eletro'
  | 'casa'
  | 'ferramentas'
  | 'moda'
  | 'automotivo'
  | 'esportes'
  | 'beleza';

export interface MLCategoryTab {
  id: MLCategory;
  label: string;
  icon: string;
  categoryUrl: string;
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

// Todas as Categorias Oficiais do Mercado Livre no Clube
export const ML_CATEGORIES: MLCategoryTab[] = [
  { id: 'todas', label: 'Todas as Ofertas', icon: 'Flame', categoryUrl: 'https://www.mercadolivre.com.br/ofertas' },
  { id: 'cupons', label: 'Cupons de Desconto', icon: 'Ticket', categoryUrl: 'https://www.mercadolivre.com.br/cupons' },
  { id: 'celulares', label: 'Celulares & Telefonia', icon: 'Smartphone', categoryUrl: 'https://lista.mercadolivre.com.br/celulares-telefones/' },
  { id: 'informatica', label: 'Informática & Wi-Fi', icon: 'Wifi', categoryUrl: 'https://lista.mercadolivre.com.br/informatica/' },
  { id: 'tv', label: 'Smart TVs & Áudio', icon: 'Tv', categoryUrl: 'https://lista.mercadolivre.com.br/eletronicos-audio-video/' },
  { id: 'eletro', label: 'Eletrodomésticos', icon: 'Zap', categoryUrl: 'https://lista.mercadolivre.com.br/eletrodomesticos/' },
  { id: 'casa', label: 'Casa & Decoração', icon: 'Home', categoryUrl: 'https://lista.mercadolivre.com.br/casa-moveis-decoracao/' },
  { id: 'ferramentas', label: 'Ferramentas', icon: 'ShieldCheck', categoryUrl: 'https://lista.mercadolivre.com.br/ferramentas/' },
  { id: 'moda', label: 'Moda & Calçados', icon: 'ShoppingBag', categoryUrl: 'https://lista.mercadolivre.com.br/calcados-roupas-bolsas/' },
  { id: 'automotivo', label: 'Automotivo', icon: 'Radio', categoryUrl: 'https://lista.mercadolivre.com.br/acessorios-veiculos/' },
  { id: 'esportes', label: 'Esportes & Fitness', icon: 'Activity', categoryUrl: 'https://lista.mercadolivre.com.br/esportes-fitness/' },
  { id: 'beleza', label: 'Beleza & Cuidados', icon: 'Sparkles', categoryUrl: 'https://lista.mercadolivre.com.br/beleza-cuidado-pessoal/' },
];

// Cupons Oficiais em Destaque
export const ML_COUPONS: MLCoupon[] = [
  {
    id: 'c1',
    code: 'MELI20',
    title: 'R$ 20 OFF em Todo o Mercado Livre',
    description: 'Válido em compras acima de R$ 199 no aplicativo oficial.',
    discountTag: 'R$ 20 OFF',
    minPurchase: 'Acima de R$ 199',
    affiliateUrl: formatAffiliateUrl('https://www.mercadolivre.com.br/cupons'),
  },
  {
    id: 'c2',
    code: 'TECH50',
    title: 'R$ 50 OFF em Eletrônicos & Telefonia',
    description: 'Válido para celulares, roteadores, notebooks e TVs.',
    discountTag: 'R$ 50 OFF',
    minPurchase: 'Acima de R$ 400',
    affiliateUrl: formatAffiliateUrl('https://lista.mercadolivre.com.br/informatica/'),
  },
  {
    id: 'c3',
    code: 'CASA15',
    title: '15% OFF em Eletrodomésticos & Cozinha',
    description: 'Válido para Air Fryers, cafeteiras, panelas e utilidades.',
    discountTag: '15% OFF',
    minPurchase: 'Acima de R$ 150',
    affiliateUrl: formatAffiliateUrl('https://lista.mercadolivre.com.br/eletrodomesticos/'),
  },
  {
    id: 'c4',
    code: 'MELIMAIS',
    title: 'Frete Grátis com Meli+',
    description: 'Entrega rápida e gratuita em milhares de produtos selecionados.',
    discountTag: 'FRETE GRÁTIS',
    minPurchase: 'Sem valor mínimo',
    affiliateUrl: formatAffiliateUrl('https://www.mercadolivre.com.br/assinaturas/melimais'),
  },
];

// Produtos Oficiais em Destaque com imagens JPEG verificadas que carregam 100%
export const ML_PRODUCTS: MLProduct[] = [
  // --- CELULARES & TELEFONIA ---
  {
    id: 'p-cel-1',
    title: 'Smartphone Samsung Galaxy A15 128GB 4GB RAM Câmera Tripla 50MP Tela 6.5"',
    price: 'R$ 899,00',
    originalPrice: 'R$ 1.299,00',
    discount: '30% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_988192-MLA116411932758_092026-O.jpg',
    category: 'celulares',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/samsung-galaxy-a15'),
    freeShipping: true,
    badge: 'Super Oferta',
  },
  {
    id: 'p-cel-2',
    title: 'Power Bank Carregador Portátil Basike 20.000mAh Carga Rápida Universal',
    price: 'R$ 129,90',
    originalPrice: 'R$ 199,90',
    discount: '35% OFF',
    installments: 'em até 4x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_744601-MLA99934274785_112025-O.jpg',
    category: 'celulares',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/power-bank-20000mah'),
    freeShipping: true,
    badge: 'Destaque',
  },
  {
    id: 'p-cel-3',
    title: 'Smartphone Motorola Moto G54 5G 256GB 8GB RAM Câmera 50MP OIS Bateria 5000mAh',
    price: 'R$ 1.149,00',
    originalPrice: 'R$ 1.599,00',
    discount: '28% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_900432-MLA113518359539_062026-O.jpg',
    category: 'celulares',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/moto-g54-5g'),
    freeShipping: true,
    badge: '5G Pronto',
  },

  // --- INFORMÁTICA & WI-FI ---
  {
    id: 'p-inf-1',
    title: 'Câmera Segurança Wi-Fi TP-Link Tapo C200 1080p 360° Pan/Tilt Visão Noturna',
    price: 'R$ 199,00',
    originalPrice: 'R$ 279,00',
    discount: '28% OFF',
    installments: 'em até 6x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_756409-MLA115252629948_082026-O.jpg',
    category: 'informatica',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/tapo-c200'),
    freeShipping: true,
    badge: 'Mais Vendido',
  },
  {
    id: 'p-inf-2',
    title: 'Mochila Para Notebook Impermeável Reforçada Executiva com Entrada USB',
    price: 'R$ 79,90',
    originalPrice: 'R$ 139,00',
    discount: '42% OFF',
    installments: 'em até 3x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_927792-MLB91185357960_092025-O.jpg',
    category: 'informatica',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/mochila-notebook-reforcada'),
    freeShipping: true,
    badge: 'Impermeável',
  },
  {
    id: 'p-inf-3',
    title: 'Roteador Wi-Fi Mesh Gigabit TP-Link Dual Band Alta Velocidade e Cobertura Total',
    price: 'R$ 489,00',
    originalPrice: 'R$ 649,00',
    discount: '24% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_783146-MLA111544883867_052026-O.jpg',
    category: 'informatica',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/roteador-mesh-tp-link-gigabit'),
    freeShipping: true,
    badge: 'Ideal p/ Fibra',
  },

  // --- SMART TVS & ÁUDIO ---
  {
    id: 'p-tv-1',
    title: 'Smart TV 43" 4K UHD HDR Crystal Gaming Hub Conexão Wi-Fi e Bluetooth Bivolt',
    price: 'R$ 1.899,00',
    originalPrice: 'R$ 2.499,00',
    discount: '24% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_870227-MLA116260093488_092026-O.jpg',
    category: 'tv',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/smart-tv-43-4k-uhd'),
    freeShipping: true,
    badge: 'Cinema 4K',
  },
  {
    id: 'p-tv-2',
    title: 'Caixa de Som Portátil Bluetooth À Prova D\'Água Som Potente Bateria Longa Duração',
    price: 'R$ 199,00',
    originalPrice: 'R$ 299,00',
    discount: '33% OFF',
    installments: 'em até 6x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_683636-MLA110860943472_052026-O.jpg',
    category: 'tv',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/caixa-som-bluetooth-portatil'),
    freeShipping: true,
  },
  {
    id: 'p-tv-3',
    title: 'Fone de Ouvido Bluetooth Sem Fio Pure Bass com Microfone Bateria Até 50 Horas',
    price: 'R$ 189,00',
    originalPrice: 'R$ 279,00',
    discount: '32% OFF',
    installments: 'em até 6x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_841702-MLA110401871238_052026-O.jpg',
    category: 'tv',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/fone-ouvido-bluetooth-sem-fio'),
    freeShipping: true,
  },

  // --- ELETRODOMÉSTICOS ---
  {
    id: 'p-ele-1',
    title: 'Fritadeira Sem Óleo Air Fryer Family 4 Litros Antiaderente 1500W Preto Inox',
    price: 'R$ 269,90',
    originalPrice: 'R$ 449,90',
    discount: '40% OFF',
    installments: 'em até 8x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_721013-MLA95939753067_102025-O.jpg',
    category: 'eletro',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/air-fryer-4l'),
    freeShipping: true,
    badge: 'Mais Vendido',
  },
  {
    id: 'p-ele-2',
    title: 'Liquidificador Turbo Potência 1200W Copo Grande 3 Litros Jarra Resistente',
    price: 'R$ 139,90',
    originalPrice: 'R$ 199,90',
    discount: '30% OFF',
    installments: 'em até 4x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_605578-MLA113633610823_062026-O.jpg',
    category: 'eletro',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/liquidificador-turbo-1200w'),
    freeShipping: true,
  },

  // --- CASA & DECORAÇÃO ---
  {
    id: 'p-cas-1',
    title: 'Panela Pressão Ceramic Pressure Indução 6,8L Revestimento Cerâmico Seguro',
    price: 'R$ 499,00',
    originalPrice: 'R$ 699,00',
    discount: '28% OFF',
    installments: 'em até 10x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_722728-MLA110061030541_042026-O.jpg',
    category: 'casa',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/panela-pressao-ceramic-pressure'),
    freeShipping: true,
  },
  {
    id: 'p-cas-2',
    title: 'Smart Speaker com Alexa Echo Pop Som Envolvente Wi-Fi & Bluetooth Bivolt',
    price: 'R$ 299,00',
    originalPrice: 'R$ 399,00',
    discount: '25% OFF',
    installments: 'em até 6x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_868127-MLA118013296557_092026-O.jpg',
    category: 'casa',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/echo-pop-alexa'),
    freeShipping: true,
    badge: 'Casa Inteligente',
  },

  // --- FERRAMENTAS ---
  {
    id: 'p-fer-1',
    title: 'Parafusadeira e Furadeira de Impacto a Bateria 12V com Maleta e 24 Acessórios',
    price: 'R$ 179,90',
    originalPrice: 'R$ 289,90',
    discount: '37% OFF',
    installments: 'em até 5x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_875689-MLA107805437119_022026-O.jpg',
    category: 'ferramentas',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/parafusadeira-furadeira-impacto-12v'),
    freeShipping: true,
    badge: 'Alta Potência',
  },
  {
    id: 'p-fer-2',
    title: 'Jogo Kit de Ferramentas Completo 129 Peças com Maleta Uso Doméstico e Profissional',
    price: 'R$ 119,90',
    originalPrice: 'R$ 189,90',
    discount: '36% OFF',
    installments: 'em até 3x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_788146-MLB116537413239_082026-O.jpg',
    category: 'ferramentas',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/jogo-ferramentas-129-pecas'),
    freeShipping: true,
  },

  // --- MODA & CALÇADOS ---
  {
    id: 'p-mod-1',
    title: 'Tênis Esportivo Academia Corrida Caminhada Leve Macio Masculino e Feminino',
    price: 'R$ 149,90',
    originalPrice: 'R$ 259,90',
    discount: '42% OFF',
    installments: 'em até 4x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_908689-MLB91907933450_092025-O.jpg',
    category: 'moda',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/tenis-esportivo-caminhada-confortavel'),
    freeShipping: true,
    badge: 'Conforto',
  },

  // --- AUTOMOTIVO ---
  {
    id: 'p-aut-1',
    title: 'Compressor de Ar Digital Portátil Calibrador Pneus Carro Moto Bike Bateria Recarregável',
    price: 'R$ 139,90',
    originalPrice: 'R$ 219,90',
    discount: '36% OFF',
    installments: 'em até 4x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_766187-MLA116823502429_082026-O.jpg',
    category: 'automotivo',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/compressor-ar-digital-portatil-carro'),
    freeShipping: true,
    badge: 'Portátil',
  },

  // --- ESPORTES & FITNESS ---
  {
    id: 'p-esp-1',
    title: 'Creatina 100% Pura Monohidratada 300g Força e Ganho Muscular Laudo Aprovado',
    price: 'R$ 79,90',
    originalPrice: 'R$ 119,90',
    discount: '33% OFF',
    installments: 'em até 2x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_947330-MLB109370482257_032026-O.jpg',
    category: 'esportes',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/creatina-monohidratada-pura-300g'),
    freeShipping: true,
    badge: '100% Pura',
  },

  // --- BELEZA & CUIDADOS ---
  {
    id: 'p-bel-1',
    title: 'Máquina Barbeador e Aparador de Pelos Elétrico Profissional Vintage Dragão USB',
    price: 'R$ 49,90',
    originalPrice: 'R$ 89,90',
    discount: '44% OFF',
    installments: 'em até 2x sem juros',
    image: 'https://http2.mlstatic.com/D_NQ_NP_799612-MLA95359719699_102025-O.jpg',
    category: 'beleza',
    url: formatAffiliateUrl('https://lista.mercadolivre.com.br/maquina-barbeador-eletrico-vintage-dragao'),
    freeShipping: true,
    badge: 'Top Vendas',
  },
];
