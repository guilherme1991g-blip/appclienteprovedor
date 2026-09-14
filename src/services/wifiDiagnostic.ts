import { NativeModules, Platform } from 'react-native';
import * as Network from 'expo-network';

export interface WifiInfoResult {
  ssid: string | null;
  bssid: string | null;
  frequencyMHz: number | null;
  frequencyBand: '2.4 GHz' | '5.8 GHz' | '6 GHz' | 'Dados Móveis' | 'Desconhecida';
  detectionMethod: 'native_mhz' | 'ssid_pattern' | 'latency_profiling' | 'cellular';
  signalLevel: number | null;
  isDualBandHint: boolean;
  recommendation: string | null;
}

/**
 * Converts a raw frequency in MHz to human-readable Wi-Fi band
 */
export function parseFrequencyBand(freqMHz: number): '2.4 GHz' | '5.8 GHz' | '6 GHz' | 'Desconhecida' {
  if (freqMHz >= 2400 && freqMHz <= 2500) {
    return '2.4 GHz';
  } else if (freqMHz >= 4900 && freqMHz <= 5895) {
    return '5.8 GHz';
  } else if (freqMHz >= 5925 && freqMHz <= 7125) {
    return '6 GHz';
  }
  return 'Desconhecida';
}

/**
 * Analyzes SSID name for common 5G / 2.4G naming conventions used by ISPs and routers
 */
export function analyzeSsidPattern(ssid: string | null): {
  detectedBand: '2.4 GHz' | '5.8 GHz' | null;
  hasMatching5gCandidate: boolean;
} {
  if (!ssid) return { detectedBand: null, hasMatching5gCandidate: false };

  const lower = ssid.toLowerCase().trim();

  // Explicit 5GHz patterns
  const is5G =
    lower.includes('5g') ||
    lower.includes('5.8g') ||
    lower.includes('5.8ghz') ||
    lower.includes('5ghz') ||
    lower.includes('_5g') ||
    lower.includes('-5g') ||
    lower.includes(' 5g') ||
    lower.includes('plus') ||
    lower.includes('ac');

  // Explicit 2.4GHz patterns
  const is24G =
    lower.includes('2.4g') ||
    lower.includes('2.4ghz') ||
    lower.includes('2.4') ||
    lower.includes('2g') ||
    lower.includes('_2g') ||
    lower.includes('-2g') ||
    lower.includes(' 2g');

  if (is5G && !is24G) {
    return { detectedBand: '5.8 GHz', hasMatching5gCandidate: false };
  }

  if (is24G) {
    return { detectedBand: '2.4 GHz', hasMatching5gCandidate: true };
  }

  return { detectedBand: null, hasMatching5gCandidate: true };
}

/**
 * Safely inspects native device Wi-Fi details (Android WifiManager / iOS Network / safe fallbacks)
 */
export async function getDetailedWifiInfo(
  gatewayLatencyAvg: number,
  gatewayJitter: number
): Promise<WifiInfoResult> {
  let ssid: string | null = null;
  let bssid: string | null = null;
  let frequencyMHz: number | null = null;
  let signalLevel: number | null = null;

  const netState = await Network.getNetworkStateAsync();

  if (netState.type === Network.NetworkStateType.CELLULAR) {
    return {
      ssid: null,
      bssid: null,
      frequencyMHz: null,
      frequencyBand: 'Dados Móveis',
      detectionMethod: 'cellular',
      signalLevel: null,
      isDualBandHint: false,
      recommendation: 'Conecte-se à rede Wi-Fi da sua residência para diagnosticar o roteador.',
    };
  }

  // Attempt 1: Safe query to native modules if available in runtime
  try {
    const wifiModule =
      (NativeModules as any).RNWifi ||
      (NativeModules as any).RNNetworkInfo ||
      (NativeModules as any).WifiManager;

    if (wifiModule) {
      if (typeof wifiModule.getFrequency === 'function') {
        const freq = await wifiModule.getFrequency();
        if (typeof freq === 'number' && freq > 0) {
          frequencyMHz = freq;
        }
      }
      if (typeof wifiModule.getCurrentWifiSSID === 'function') {
        ssid = await wifiModule.getCurrentWifiSSID();
      } else if (typeof wifiModule.getSSID === 'function') {
        ssid = await wifiModule.getSSID();
      }
      if (typeof wifiModule.getCurrentSignalStrength === 'function') {
        signalLevel = await wifiModule.getCurrentSignalStrength();
      }
    }
  } catch (_e) {
    // Native module not linked in current JS bundle / permission denied, silently fallback
  }

  // Decision Logic:
  // 1. If native frequency in MHz is present (Android hardware query)
  if (frequencyMHz && frequencyMHz > 0) {
    const band = parseFrequencyBand(frequencyMHz);
    const is24 = band === '2.4 GHz';
    return {
      ssid,
      bssid,
      frequencyMHz,
      frequencyBand: band,
      detectionMethod: 'native_mhz',
      signalLevel,
      isDualBandHint: is24,
      recommendation: is24
        ? `Seu smartphone está no canal 2.4 GHz (${frequencyMHz} MHz). Recomendamos conectar na rede 5.8 GHz para velocidade máxima.`
        : `Excelente! Conectado na frequência de alta velocidade (${frequencyMHz} MHz).`,
    };
  }

  // 2. If SSID pattern is recognizable (iOS / Android without location permission)
  const pattern = analyzeSsidPattern(ssid);
  if (pattern.detectedBand) {
    const is24 = pattern.detectedBand === '2.4 GHz';
    return {
      ssid,
      bssid,
      frequencyMHz: is24 ? 2437 : 5745,
      frequencyBand: pattern.detectedBand,
      detectionMethod: 'ssid_pattern',
      signalLevel,
      isDualBandHint: is24,
      recommendation: is24
        ? `Identificado rede 2.4 GHz pelo nome${ssid ? ` ("${ssid}")` : ''}. Procure uma rede com o mesmo nome terminada em "_5G" nas configurações de Wi-Fi.`
        : `Conectado na rede 5.8 GHz de alta velocidade.`,
    };
  }

  // 3. Fallback: Ultra-low latency & jitter profiling for the Gateway (5.8 GHz < 5ms & Jitter < 3ms)
  const isLikely5G = gatewayLatencyAvg > 0 && gatewayLatencyAvg <= 5 && gatewayJitter <= 3;
  const estimatedBand = isLikely5G ? '5.8 GHz' : '2.4 GHz';

  return {
    ssid,
    bssid,
    frequencyMHz: isLikely5G ? 5745 : 2437,
    frequencyBand: estimatedBand,
    detectionMethod: 'latency_profiling',
    signalLevel,
    isDualBandHint: !isLikely5G,
    recommendation: !isLikely5G
      ? `A latência e estabilidade do sinal indicam conexão em 2.4 GHz. Se o seu roteador tiver rede 5.8 GHz, conecte-se nela para menor latência.`
      : `Latência local extremamente baixa (${gatewayLatencyAvg}ms), compatível com a banda 5.8 GHz.`,
  };
}
