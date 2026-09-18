import { createClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../config/providerConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProviderConfig {
  codigo: string;
  nome: string;
  api_url: string;
  api_token: string;
  api_app: string;
  logo_url?: string;
  icone_url?: string;
  fundo_url?: string;
  cor_fundo?: string;
  webhook_url?: string;
  webhook_verificacao_url?: string;
  whatsapp_number?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  versao_app_loja?: string;
  versao_app_minima?: string;
  url_playstore?: string;
  url_appstore?: string;
  forcar_atualizacao?: boolean;
  mensagem_atualizacao?: string;
}

const CACHE_LOGO_KEY = '@isp_app_cached_logo_url';
const CACHE_ICON_KEY = '@isp_app_cached_icon_url';
const CACHE_COLORS_KEY = '@isp_app_cached_provider_colors';
const CACHE_BG_KEY = '@isp_app_cached_provider_bg';

// Inicializa o cliente do Supabase
export const supabase = createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY
);

// Padrão fallback para ambiente de testes/desenvolvimento
const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  codigo: 'webconnect',
  nome: 'WebConnect Telecom',
  api_url: 'https://webcnnect.sgp.tsmx.com.br',
  api_token: '9720002b-a4f6-4c48-9a20-65f86669f6d6',
  api_app: 'App',
  logo_url: undefined,
  icone_url: undefined,
  fundo_url: undefined,
  cor_fundo: '#080B11',
  webhook_url: 'https://n8n.zentos.com.br/webhook/recebeocorrenciaapp',
  webhook_verificacao_url: 'https://n8n.zentos.com.br/webhook/enviar-codigo-verificacao',
  whatsapp_number: '5581999999999',
  primary_color: '#2563EB',
  secondary_color: '#1E40AF',
  accent_color: '#10B981',
};

/**
 * Busca as configurações e credenciais do provedor no Supabase pelo código,
 * salvando e atualizando a logo, ícone, fundo de tela e a paleta de cores localmente no aparelho.
 */
export async function getProviderConfig(providerCode: string): Promise<ProviderConfig> {
  try {
    let cachedLogo: string | null = null;
    let cachedIcon: string | null = null;
    let cachedColors: { primary?: string; secondary?: string; accent?: string } | null = null;
    let cachedBg: { fundo_url?: string; cor_fundo?: string } | null = null;

    try {
      cachedLogo = await AsyncStorage.getItem(CACHE_LOGO_KEY);
      cachedIcon = await AsyncStorage.getItem(CACHE_ICON_KEY);
      const rawColors = await AsyncStorage.getItem(CACHE_COLORS_KEY);
      if (rawColors) {
        cachedColors = JSON.parse(rawColors);
      }
      const rawBg = await AsyncStorage.getItem(CACHE_BG_KEY);
      if (rawBg) {
        cachedBg = JSON.parse(rawBg);
      }
    } catch (_) {}

    // Se a URL do Supabase não foi configurada ainda, usa os dados padrão
    if (
      !APP_CONFIG.SUPABASE_URL ||
      APP_CONFIG.SUPABASE_URL.includes('SEU-PROJETO') ||
      !APP_CONFIG.SUPABASE_ANON_KEY ||
      APP_CONFIG.SUPABASE_ANON_KEY.includes('SUA_CHAVE_ANON')
    ) {
      console.log('Supabase não configurado. Utilizando configurações padrão do provedor.');
      return {
        ...DEFAULT_PROVIDER_CONFIG,
        logo_url: cachedLogo || DEFAULT_PROVIDER_CONFIG.logo_url,
        icone_url: cachedIcon || DEFAULT_PROVIDER_CONFIG.icone_url,
        fundo_url: cachedBg?.fundo_url || DEFAULT_PROVIDER_CONFIG.fundo_url,
        cor_fundo: cachedBg?.cor_fundo || DEFAULT_PROVIDER_CONFIG.cor_fundo,
        primary_color: cachedColors?.primary || DEFAULT_PROVIDER_CONFIG.primary_color,
        secondary_color: cachedColors?.secondary || DEFAULT_PROVIDER_CONFIG.secondary_color,
        accent_color: cachedColors?.accent || DEFAULT_PROVIDER_CONFIG.accent_color,
      };
    }

    const { data, error } = await supabase
      .from('provedores')
      .select('*')
      .eq('codigo', providerCode)
      .single();

    if (error) {
      console.error('Erro ao buscar provedor no Supabase:', error.message);
      return {
        ...DEFAULT_PROVIDER_CONFIG,
        logo_url: cachedLogo || DEFAULT_PROVIDER_CONFIG.logo_url,
        icone_url: cachedIcon || DEFAULT_PROVIDER_CONFIG.icone_url,
        fundo_url: cachedBg?.fundo_url || DEFAULT_PROVIDER_CONFIG.fundo_url,
        cor_fundo: cachedBg?.cor_fundo || DEFAULT_PROVIDER_CONFIG.cor_fundo,
        primary_color: cachedColors?.primary || DEFAULT_PROVIDER_CONFIG.primary_color,
        secondary_color: cachedColors?.secondary || DEFAULT_PROVIDER_CONFIG.secondary_color,
        accent_color: cachedColors?.accent || DEFAULT_PROVIDER_CONFIG.accent_color,
      };
    }

    if (data) {
      // Extração da Logo
      const fetchedLogo = (data.logo_url || data.logo || data.logo_base64 || '').trim();
      if (fetchedLogo && fetchedLogo !== cachedLogo) {
        await AsyncStorage.setItem(CACHE_LOGO_KEY, fetchedLogo).catch(() => {});
      }
      const activeLogo = fetchedLogo || cachedLogo || undefined;

      // Extração do Ícone
      const fetchedIcon = (data.icone_url || data.icon_url || data.icone || '').trim();
      if (fetchedIcon && fetchedIcon !== cachedIcon) {
        await AsyncStorage.setItem(CACHE_ICON_KEY, fetchedIcon).catch(() => {});
      }
      const activeIcon = fetchedIcon || cachedIcon || undefined;

      // Extração e Cache das Cores
      const fetchedPrimary = data.cor_primaria || data.primary_color || cachedColors?.primary || DEFAULT_PROVIDER_CONFIG.primary_color;
      const fetchedSecondary = data.cor_secundaria || data.secondary_color || cachedColors?.secondary || DEFAULT_PROVIDER_CONFIG.secondary_color;
      const fetchedAccent = data.cor_destaque || data.accent_color || cachedColors?.accent || DEFAULT_PROVIDER_CONFIG.accent_color;

      const newColorsObj = { primary: fetchedPrimary, secondary: fetchedSecondary, accent: fetchedAccent };
      await AsyncStorage.setItem(CACHE_COLORS_KEY, JSON.stringify(newColorsObj)).catch(() => {});

      // Extração e Cache do Fundo de Tela
      const fetchedFundoUrl = (data.fundo_url || data.background_url || '').trim();
      const fetchedCorFundo = (data.cor_fundo || data.background_color || '').trim() || cachedBg?.cor_fundo || '#080B11';
      
      const newBgObj = { fundo_url: fetchedFundoUrl, cor_fundo: fetchedCorFundo };
      await AsyncStorage.setItem(CACHE_BG_KEY, JSON.stringify(newBgObj)).catch(() => {});

      console.log('Configurações do provedor, logo, ícone e cores carregadas do Supabase:', data.nome);
      return {
        codigo: data.codigo || providerCode,
        nome: data.nome || 'Provedor',
        api_url: data.api_url || DEFAULT_PROVIDER_CONFIG.api_url,
        api_token: data.api_token || DEFAULT_PROVIDER_CONFIG.api_token,
        api_app: data.api_app || 'App',
        logo_url: activeLogo,
        icone_url: activeIcon,
        fundo_url: fetchedFundoUrl || cachedBg?.fundo_url || undefined,
        cor_fundo: fetchedCorFundo,
        webhook_url: data.webhook_url || DEFAULT_PROVIDER_CONFIG.webhook_url,
        webhook_verificacao_url: data.webhook_verificacao_url || DEFAULT_PROVIDER_CONFIG.webhook_verificacao_url,
        whatsapp_number: data.whatsapp_number || data.whatsapp || data.telefone || DEFAULT_PROVIDER_CONFIG.whatsapp_number,
        primary_color: fetchedPrimary,
        secondary_color: fetchedSecondary,
        accent_color: fetchedAccent,
        versao_app_loja: data.versao_app_loja || data.versao_loja || undefined,
        versao_app_minima: data.versao_app_minima || data.versao_minima || undefined,
        url_playstore: data.url_playstore || data.playstore_url || 'https://play.google.com/store/apps/details?id=br.com.webconnect.cliente',
        url_appstore: data.url_appstore || data.appstore_url || undefined,
        forcar_atualizacao: data.forcar_atualizacao === true || data.force_update === true,
        mensagem_atualizacao: data.mensagem_atualizacao || data.update_message || undefined,
      };
    }
  } catch (err) {
    console.error('Exceção ao conectar no Supabase:', err);
  }

  return DEFAULT_PROVIDER_CONFIG;
}
