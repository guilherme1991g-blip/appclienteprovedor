import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Clipboard,
  Modal,
  Image,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Wifi,
  Globe,
  MapPin,
  ArrowLeft,
  Home,
  FileText,
  CreditCard,
  MessageSquare,
  MessageCircle,
  Activity,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  AlertTriangle,
  ExternalLink,
  QrCode,
  Clock,
  CircleDot,
  ChevronDown,
  ChevronUp,
  Check,
  Square,
  CheckSquare,
  Unlock,
  Bell,
  X,
} from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import BrandLogo from '@/components/BrandLogo';
import { APP_CONFIG } from '@/config/providerConfig';
import { getProviderConfig, ProviderConfig, supabase } from '@/services/supabase';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Helper function to validate CPF (Brazilian Taxpayer Registry for Individuals)
function validateCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  let remainder;

  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;

  return true;
}

// Helper function to validate CNPJ (Brazilian Registry of Legal Entities)
function validateCNPJ(cnpj: string): boolean {
  const cleanCNPJ = cnpj.replace(/\D/g, '');
  if (cleanCNPJ.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleanCNPJ)) return false;

  let size = cleanCNPJ.length - 2;
  let numbers = cleanCNPJ.substring(0, size);
  const digits = cleanCNPJ.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleanCNPJ.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

// Returns the nearest business day (Mon-Fri) as 'YYYY-MM-DD HH:MM'
function getNearestBusinessDayString(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  if (day === 0) now.setDate(now.getDate() + 1); // Sunday -> Monday
  if (day === 6) now.setDate(now.getDate() + 2); // Saturday -> Monday
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

// Formats document automatically to CPF or CNPJ mask
function formatAutoDocument(value: string): string {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 11) {
    // CPF: 000.000.000-00
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  } else {
    // CNPJ: 00.000.000/0000-00
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .substring(0, 18);
  }
}

// Helper to format Date string to DD/MM/YYYY
function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

// Parses DD/MM/AAAA HH:MM:SS or ISO 8601 format to timestamp for mathematical sorting
function parseOcorrenciaDate(dateStr: string): number {
  if (!dateStr) return 0;
  
  // Try direct parsing first for ISO/standard formats
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed) && !dateStr.includes('/')) {
    return parsed;
  }

  try {
    const parts = dateStr.split(' ');
    if (parts.length >= 1) {
      const dateParts = parts[0].split('/');
      if (dateParts.length === 3) {
        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Months are 0-indexed in JS
        const year = parseInt(dateParts[2], 10);
        
        let hour = 0, minute = 0, second = 0;
        if (parts[1]) {
          const timeParts = parts[1].split(':');
          hour = parseInt(timeParts[0], 10) || 0;
          minute = parseInt(timeParts[1], 10) || 0;
          second = timeParts[2] ? parseInt(timeParts[2], 10) : 0;
        }
        
        return new Date(year, month, day, hour, minute, second).getTime();
      }
    }
  } catch (e) {
    console.error('parseOcorrenciaDate error:', e);
  }

  return 0;
}

// Helper to format currency
function formatCurrency(val: number | string): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 'R$ 0,00';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

// Helper to format bytes
function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Helper to format session duration
function formatSessionDuration(start: string, stop: string | null): string {
  const startTime = new Date(start).getTime();
  const stopTime = stop ? new Date(stop).getTime() : new Date().getTime();
  const diffMs = stopTime - startTime;
  if (diffMs <= 0) return 'Alguns segundos';
  
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHrs > 24) {
    const days = Math.floor(diffHrs / 24);
    const hours = diffHrs % 24;
    return `${days}d e ${hours}h`;
  }
  if (diffHrs > 0) {
    return `${diffHrs}h e ${diffMins}min`;
  }
  return `${diffMins} min`;
}

// Helper to extract phone number from SGP client/contract response
function extractClientPhone(client: any, contrato?: any): string {
  if (!client) return '';

  const searchInObj = (obj: any): string => {
    if (!obj || typeof obj !== 'object') return '';
    const keys = Object.keys(obj);
    for (const key of keys) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('cpf') ||
        lowerKey.includes('cnpj') ||
        lowerKey === 'id' ||
        lowerKey.includes('data') ||
        lowerKey.includes('vencimento') ||
        lowerKey.includes('valor')
      ) {
        continue;
      }
      const val = obj[key];
      if (typeof val === 'string' || typeof val === 'number') {
        const cleaned = String(val).replace(/\D/g, '');
        if (cleaned.length >= 10 && cleaned.length <= 13) {
          return cleaned;
        }
      } else if (typeof val === 'object' && val !== null) {
        const res = searchInObj(val);
        if (res) return res;
      }
    }
    return '';
  };

  let foundPhone = '';

  if (client.contatos) {
    foundPhone = searchInObj(client.contatos);
  }

  if (!foundPhone) {
    foundPhone = searchInObj(client);
  }

  if (!foundPhone && contrato) {
    foundPhone = searchInObj(contrato);
  }

  console.log('Resultado da busca de telefone:', foundPhone);
  return foundPhone;
}

interface ContractDisplay {
  id: number;
  planName: string;
  address: string;
  status: string;
  clientName: string;
  phone?: string;
  // Metadata Details
  popId?: string;
  dataCadastro?: string;
  vencimento?: string | number;
  formaCobranca?: string;
  centralLogin?: string;
  centralSenha?: string;
  // Connection Details
  pppoeLogin?: string;
  pppoeSenha?: string;
  ip?: string;
  mac?: string;
  grupo?: string;
  // Wi-Fi Details
  wifiSsid?: string;
  wifiPassword?: string;
  wifiSsid5?: string;
  wifiPassword5?: string;
  // Detailed address
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

type ScreenState = 'LOGIN' | 'SELECT_CONTRACT' | 'DASHBOARD';
async function registerForPushNotificationsAsync() {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificações do Provedor',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2563EB',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Permissão de notificações não concedida pelo usuário.');
      return null;
    }
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;
    } catch (e) {
      console.log('Aviso Expo Push Token:', e);
      try {
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        token = deviceToken.data;
      } catch (err2) {
        console.log('Aviso Device Push Token:', err2);
      }
    }
  } else {
    console.log('Para testar push real de servidor, utilize um aparelho celular físico.');
  }

  return token;
}

export default function LoginScreen() {
  const [providerConfig, setProviderConfig] = useState<ProviderConfig>({
    codigo: APP_CONFIG.PROVIDER_CODE,
    nome: 'WebConnect Telecom',
    api_url: 'https://webcnnect.sgp.tsmx.com.br',
    api_token: '9720002b-a4f6-4c48-9a20-65f86669f6d6',
    api_app: 'App',
    logo_url: undefined,
    webhook_url: 'https://n8n.zentos.com.br/webhook/recebeocorrenciaapp',
    primary_color: '#2563EB',
    secondary_color: '#1E40AF',
    accent_color: '#10B981',
  });

  const primaryColor = providerConfig.primary_color || '#2563EB';
  const secondaryColor = providerConfig.secondary_color || '#1E40AF';
  const accentColor = providerConfig.accent_color || '#10B981';

  const [rememberMe, setRememberMe] = useState(true);

  React.useEffect(() => {
    getProviderConfig(APP_CONFIG.PROVIDER_CODE).then(config => {
      if (config) {
        setProviderConfig(config);
      }
    });
  }, []);

  const [documentInput, setDocumentInput] = useState('');

  // Restaura sessão salva caso o cliente tenha optado por "Manter-me conectado"
  React.useEffect(() => {
    const restoreSavedSession = async () => {
      try {
        const savedDoc = await AsyncStorage.getItem('@isp_app_saved_doc');
        const savedContractId = await AsyncStorage.getItem('@isp_app_saved_contract_id');

        if (savedDoc) {
          setDocumentInput(savedDoc);
          const raw = savedDoc.replace(/\D/g, '');
          const isCpf = raw.length <= 11;
          const valid = isCpf ? (raw.length === 11 && validateCPF(raw)) : (raw.length === 14 && validateCNPJ(raw));
          setDetectedType(isCpf ? 'CPF' : 'CNPJ');
          setIsValid(valid);

          if (valid) {
            setLoading(true);
            const config = await getProviderConfig(APP_CONFIG.PROVIDER_CODE);
            const apiUrl = config?.api_url || providerConfig.api_url;
            const apiToken = config?.api_token || providerConfig.api_token;
            const apiApp = config?.api_app || providerConfig.api_app;

            const res = await fetch(`${apiUrl}/api/ura/clientes/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                app: apiApp,
                token: apiToken,
                cpfcnpj: raw,
              }),
            });
            const data = await res.json();
            setLoading(false);

            if (res.ok && data) {
              const parsedContracts: ContractDisplay[] = [];
              let rawTitulos: any[] = [];
              const clientsList = data.clientes || [];
              clientsList.forEach((client: any) => {
                if (client.titulos && Array.isArray(client.titulos)) {
                  rawTitulos = rawTitulos.concat(client.titulos);
                }
                const contractsList = client.contratos || [];
                contractsList.forEach((contrato: any) => {
                  let planName = 'Plano de Internet';
                  let pppoeLogin = '';
                  let pppoeSenha = '';
                  let ip = '';
                  let mac = '';
                  let grupo = '';
                  let wifiSsid = '';
                  let wifiPassword = '';
                  let wifiSsid5 = '';
                  let wifiPassword5 = '';

                  if (contrato.servicos && Array.isArray(contrato.servicos) && contrato.servicos.length > 0) {
                    const serv = contrato.servicos[0];
                    if (serv.plano) {
                      if (typeof serv.plano === 'object') {
                        planName = serv.plano.descricao || serv.plano.nome || serv.plano.description || 'Plano de Internet';
                      } else if (typeof serv.plano === 'string') {
                        planName = serv.plano;
                      }
                    }
                    pppoeLogin = serv.login || '';
                    pppoeSenha = serv.senha || '';
                    ip = serv.ip || '';
                    mac = serv.mac || '';
                    grupo = serv.grupo || '';
                    wifiSsid = serv.wifi_ssid || '';
                    wifiPassword = serv.wifi_password || '';
                    wifiSsid5 = serv.wifi_ssid_5 || '';
                    wifiPassword5 = serv.wifi_password_5 || '';
                  }

                  let addressStr = '';
                  let street = '';
                  let num = '';
                  let neighborhood = '';
                  let city = '';
                  let state = '';
                  let cep = '';

                  const addr = contrato.endereco || client.endereco;
                  if (addr) {
                    if (typeof addr === 'object') {
                      street = addr.logradouro || '';
                      num = addr.numero || '';
                      neighborhood = addr.bairro || '';
                      city = addr.cidade || '';
                      state = addr.uf || '';
                      cep = addr.cep || '';

                      const parts = [];
                      if (addr.logradouro) parts.push(addr.logradouro);
                      if (addr.numero) parts.push(addr.numero);
                      if (addr.bairro) parts.push(addr.bairro);
                      if (addr.cidade) parts.push(addr.cidade);
                      if (addr.uf) parts.push(addr.uf);
                      addressStr = parts.join(', ');
                    } else if (typeof addr === 'string') {
                      addressStr = addr;
                    }
                  }

                  parsedContracts.push({
                    id: contrato.id,
                    planName,
                    address: addressStr || 'Endereço não cadastrado',
                    status: contrato.status || 'Ativo',
                    clientName: client.nome || 'Cliente',
                    phone: extractClientPhone(client, contrato),
                    popId: contrato.pop_id || '',
                    dataCadastro: contrato.dataCadastro || '',
                    vencimento: contrato.vencimento || '',
                    formaCobranca: contrato.formaCobranca || '',
                    centralLogin: contrato.contratoCentralLogin || '',
                    centralSenha: contrato.contratoCentralSenha || '',
                    pppoeLogin,
                    pppoeSenha,
                    ip,
                    mac,
                    grupo,
                    wifiSsid,
                    wifiPassword,
                    wifiSsid5,
                    wifiPassword5,
                    street,
                    number: num,
                    neighborhood,
                    city,
                    state,
                    cep,
                  });
                });
              });

              setAllTitulos(rawTitulos);

              const validContracts = parsedContracts.filter(c => {
                const statusLower = (c.status || '').toLowerCase().trim();
                return statusLower === 'ativo' || statusLower === 'suspenso';
              });

              if (validContracts.length === 1) {
                setSelectedContract(validContracts[0]);
                setActiveTab('HOME');
                setScreenState('DASHBOARD');
              } else if (validContracts.length > 1) {
                setContracts(validContracts);
                if (savedContractId) {
                  const matched = validContracts.find(c => c.id.toString() === savedContractId);
                  if (matched) {
                    setSelectedContract(matched);
                    setActiveTab('HOME');
                    setScreenState('DASHBOARD');
                  } else {
                    setScreenState('SELECT_CONTRACT');
                  }
                } else {
                  setScreenState('SELECT_CONTRACT');
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Session restore error:', e);
      }
    };

    restoreSavedSession();
  }, []);
  const [detectedType, setDetectedType] = useState<'CPF' | 'CNPJ'>('CPF');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [screenState, setScreenState] = useState<ScreenState>('LOGIN');
  const [contracts, setContracts] = useState<ContractDisplay[]>([]);
  const [selectedContract, setSelectedContract] = useState<ContractDisplay | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>('HOME');

  // Invoices (Titulos) State
  const [allTitulos, setAllTitulos] = useState<any[]>([]);
  const [loadingFinanceiro, setLoadingFinanceiro] = useState(false);

  // Live Connection Status States
  const [loadingConexao, setLoadingConexao] = useState(false);
  const [conexaoOnline, setConexaoOnline] = useState<boolean | null>(null);
  const [conexaoSessions, setConexaoSessions] = useState<any[]>([]);

  // Pix Modal States
  const [selectedPixCode, setSelectedPixCode] = useState<string | null>(null);
  const [selectedPixAmount, setSelectedPixAmount] = useState<string | number | null>(null);

  // Push Notifications State
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [receivedNotification, setReceivedNotification] = useState<Notifications.Notification | null>(null);

  React.useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        console.log('Expo Push Token obtido:', token);
      }
    });

    const notificationListener = Notifications.addNotificationReceivedListener(noti => {
      setReceivedNotification(noti);
      console.log('Notificação recebida no app:', noti);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notificação tocada pelo usuário:', response);
    });

    return () => {
      try {
        notificationListener?.remove?.();
        responseListener?.remove?.();
      } catch (e) {}
    };
  }, []);

  const syncPushTokenToSupabase = async (contractObj?: ContractDisplay | null, docNumber?: string) => {
    if (!expoPushToken) return;
    try {
      const rawPhone = (contractObj?.phone || '').replace(/\D/g, '');
      const cleanCpf = (docNumber || documentInput || '').replace(/\D/g, '');

      let phoneWithout55 = rawPhone;
      let phoneWith55 = rawPhone;

      if (rawPhone) {
        phoneWithout55 = rawPhone.startsWith('55') && rawPhone.length >= 12 ? rawPhone.substring(2) : rawPhone;
        phoneWith55 = rawPhone.startsWith('55') ? rawPhone : `55${rawPhone}`;
      }

      const primaryPhoneKey = phoneWithout55 || cleanCpf || (contractObj ? `contract_${contractObj.id}` : '');
      if (!primaryPhoneKey) return;

      console.log('Sincronizando Push Token no Supabase:', {
        telefone: primaryPhoneKey,
        telefone_completo: phoneWith55 || cleanCpf,
        contrato_id: contractObj?.id || null,
        cpf: cleanCpf,
      });

      const { error } = await supabase.from('push_tokens').upsert({
        telefone: primaryPhoneKey,
        telefone_completo: phoneWith55 || cleanCpf,
        contrato_id: contractObj?.id || null,
        cpf: cleanCpf,
        push_token: expoPushToken,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'telefone' });

      if (error) {
        console.log('Aviso ao sincronizar token no Supabase:', error.message);
      } else {
        console.log('Push token sincronizado no Supabase com sucesso:', primaryPhoneKey);
      }
    } catch (e) {
      console.log('Exceção syncPushTokenToSupabase:', e);
    }
  };

  React.useEffect(() => {
    if (selectedContract && expoPushToken) {
      syncPushTokenToSupabase(selectedContract, documentInput);
    }
  }, [selectedContract, expoPushToken]);

  const sendTestPushNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 Teste de Notificação',
          body: 'Seu aplicativo está pronto para receber avisos de faturas e comunicados!',
          data: { modulo: 'teste' },
          sound: true,
        },
        trigger: null,
      });
      Alert.alert(
        '🔔 Central de Notificações',
        `Seu aplicativo está ativo para receber notificações!\n\nPush Token:\n${expoPushToken ? expoPushToken.substring(0, 25) + '...' : 'Registrando...'}\n\nEnviamos uma notificação de teste para o seu celular.`,
        [{ text: 'OK' }]
      );
    } catch (e) {
      console.error('Erro ao agendar notificação:', e);
      Alert.alert('Erro', 'Não foi possível disparar a notificação de teste.');
    }
  };

  // Toggle Visibility for passwords
  const [showPppoePassword, setShowPppoePassword] = useState(false);
  const [showWifiPassword, setShowWifiPassword] = useState(false);

  // Support Tickets & Form States
  const [loadingSuporte, setLoadingSuporte] = useState(false);
  const [suporteTickets, setSuporteTickets] = useState<any[]>([]);
  const [supportContact, setSupportContact] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportMotive, setSupportMotive] = useState('2'); // default to '2' (Suporte - Sem Acesso)
  const [isMotiveDropdownOpen, setIsMotiveDropdownOpen] = useState(false);
  const [supportContent, setSupportContent] = useState('');
  const [submittingSupport, setSubmittingSupport] = useState(false);

  // WhatsApp Verification States
  const [supportVerified, setSupportVerified] = useState(false);
  const [verificationPhone, setVerificationPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const countdownRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  // Notifications Center Modal State & Realtime Unread Badge
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notificationHistory, setNotificationHistory] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenIdRef = React.useRef<string | null>(null);

  const fetchNotificationHistory = async (showLoading = false): Promise<any[]> => {
    if (showLoading) setLoadingNotifications(true);
    try {
      const rawPhone = (selectedContract?.phone || '').replace(/\D/g, '');
      const cleanCpf = (documentInput || '').replace(/\D/g, '');
      const phoneWithout55 = rawPhone.startsWith('55') && rawPhone.length >= 12 ? rawPhone.substring(2) : rawPhone;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      let query = supabase.from('notificacoes_historico').select('*').gte('created_at', sevenDaysAgo);
      
      const filterConditions = [];
      if (phoneWithout55) filterConditions.push(`telefone.eq.${phoneWithout55}`);
      if (rawPhone) filterConditions.push(`telefone_completo.eq.${rawPhone}`);
      if (cleanCpf) filterConditions.push(`telefone.eq.${cleanCpf}`);

      if (filterConditions.length > 0) {
        query = query.or(filterConditions.join(','));
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(30);

      if (error) {
        console.log('Aviso ao carregar histórico de notificações:', error.message);
        return [];
      } else {
        setNotificationHistory(data || []);
        return data || [];
      }
    } catch (err) {
      console.log('Exceção ao buscar notificações:', err);
      return [];
    } finally {
      if (showLoading) setLoadingNotifications(false);
    }
  };

  // Active polling & Supabase Realtime Listener for new incoming notifications
  React.useEffect(() => {
    if (!selectedContract) return;

    const checkNewNotifications = async () => {
      const data = await fetchNotificationHistory();
      if (data && data.length > 0) {
        const newest = data[0];
        if (newest && newest.id) {
          if (lastSeenIdRef.current !== null && newest.id !== lastSeenIdRef.current) {
            setUnreadCount(prev => prev + 1);
          }
          lastSeenIdRef.current = newest.id;
        }
      }
    };

    checkNewNotifications();
    const interval = setInterval(checkNewNotifications, 10000);

    const channelName = `realtime_notif_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes_historico' },
        (payload) => {
          console.log('Nova notificação recebida em tempo real via Supabase:', payload.new);
          if (payload.new && payload.new.id) {
            if (lastSeenIdRef.current === payload.new.id) return;
            lastSeenIdRef.current = payload.new.id;
          }

          setUnreadCount(prev => prev + 1);
          setNotificationHistory(prev => [payload.new, ...prev]);
        }
      )
      .subscribe((status) => {
        console.log(`Status Conexão Realtime (${channelName}):`, status);
      });

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [selectedContract]);

  const handleOpenNotificationCenter = () => {
    setIsNotificationModalOpen(true);
    setUnreadCount(0); // Clears unread badge when opening notification center
    fetchNotificationHistory(true);
  };

  const formatPhone = (text: string) => {
    const raw = text.replace(/\D/g, '').substring(0, 11);
    if (raw.length <= 2) {
      return raw;
    } else if (raw.length <= 6) {
      return `(${raw.substring(0, 2)}) ${raw.substring(2)}`;
    } else if (raw.length <= 10) {
      return `(${raw.substring(0, 2)}) ${raw.substring(2, 6)}-${raw.substring(6)}`;
    } else {
      return `(${raw.substring(0, 2)}) ${raw.substring(2, 7)}-${raw.substring(7)}`;
    }
  };

  const fetchSupportTickets = () => {
    if (!selectedContract) return;
    setLoadingSuporte(true);

    const contratoId = parseInt(selectedContract.id.toString(), 10) || selectedContract.id;

    fetch(`${providerConfig.api_url}/api/ura/ocorrencia/list/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app: providerConfig.api_app,
        token: providerConfig.api_token,
        contrato: contratoId,
      })
    })
      .then(async (res) => {
        const data = await res.json();
        console.log('Ocorrências recebidas da URA API para contrato', contratoId, ':', data);
        setLoadingSuporte(false);
        const list = Array.isArray(data)
          ? data
          : (data && Array.isArray(data.ocorrencias) ? data.ocorrencias : []);
        setSuporteTickets(list);
      })
      .catch((err) => {
        setLoadingSuporte(false);
        console.error('Fetch support tickets error:', err);
        setSuporteTickets([]);
      });
  };

  const handleSubmitSupport = () => {
    if (!supportContent.trim()) {
      alert('Por favor, descreva o problema.');
      return;
    }

    setSubmittingSupport(true);

    let motivoos = '100';
    let ocorrenciatipo = '5';

    if (supportMotive === '1') {
      motivoos = '1';
      ocorrenciatipo = '3';
    } else if (supportMotive === '2') {
      motivoos = '2';
      ocorrenciatipo = '1';
    } else if (supportMotive === '4') {
      motivoos = '4';
      ocorrenciatipo = '5';
    } else if (supportMotive === '5') {
      motivoos = '100';
      ocorrenciatipo = '5';
    }

    const bodyData = {
      token: providerConfig.api_token,
      app: providerConfig.api_app,
      cpfcnpj: documentInput.replace(/\D/g, ''),
      contrato: selectedContract!.id.toString(),
      conteudo: supportContent.trim(),
      contato: selectedContract!.clientName || 'Cliente',
      os_prioridade: '2',
      motivoos,
      ocorrenciatipo,
      data_hora_agendamento: getNearestBusinessDayString(),
      os_tecnico_responsavel: 'samuel',
      setor: '1'
    };

    console.log('Enviando solicitação de chamado com dados:', bodyData);

    const postData = Object.keys(bodyData)
      .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(bodyData[key as keyof typeof bodyData]))
      .join('&');

    fetch(`${providerConfig.api_url}/api/central/chamado/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postData
    })
      .then(async (res) => {
        console.log('Resposta HTTP do chamado:', res.status);
        const data = await res.json();
        console.log('Corpo da resposta do chamado:', data);
        
        setSubmittingSupport(false);
        if (res.ok && data) {
          if (data.status === 3) {
            alert(`Você já possui um chamado aberto para esta categoria (Protocolo: ${data.protocolo}).`);
          } else if (data.status === 0 && data.msg && data.msg !== '') {
            alert(`Erro ao abrir chamado: ${data.msg}`);
          } else {
            alert(`Ordem de serviço aberta com sucesso! Protocolo: ${data.protocolo || 'N/A'}`);
            
            // Dispara dados para o Webhook do n8n
            const protocoloStr = data.protocolo || 'N/A';
            const clienteStr = selectedContract?.clientName || 'Cliente';
            const descricaoStr = supportContent.trim();
            const localStr = selectedContract?.neighborhood || selectedContract?.city || 'Não informado';
            const obsStr = 'Aberto pelo app do cliente';

            const webhookMessage = `🚨 *OS Aberta!!*\n📋 *Protocolo:* ${protocoloStr}\n👤 *Cliente:* ${clienteStr}\n📝 *Descrição:* ${descricaoStr}\n📍 *Local:* ${localStr}\n📝 *Obs:* ${obsStr}`;

            const targetWebhook = providerConfig.webhook_url || 'https://n8n.zentos.com.br/webhook/recebeocorrenciaapp';

            fetch(targetWebhook, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                mensagem: webhookMessage,
                text: webhookMessage,
                protocolo: protocoloStr,
                cliente: clienteStr,
                descricao: descricaoStr,
                local: localStr,
                obs: obsStr,
              }),
            }).catch((wErr) => console.error('Erro ao enviar ocorrência para o webhook:', wErr));

            setSupportContent('');
            setSupportMotive('5');
            fetchSupportTickets();
          }
        } else {
          alert('Erro de comunicação com o servidor.');
        }
      })
      .catch((err) => {
        setSubmittingSupport(false);
        console.error('Submit ticket error detail:', err);
        alert('Erro ao enviar sua solicitação. Tente novamente.');
      });
  };

  React.useEffect(() => {
    if (screenState === 'DASHBOARD' && activeTab === 'SUPORTE' && selectedContract) {
      fetchSupportTickets();
    }
  }, [activeTab, screenState, selectedContract]);

  // Cleanup countdown timer on unmount
  React.useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // Format phone number as (XX) XXXXX-XXXX
  const formatPhoneInput = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  };

  // Send verification code via WhatsApp
  const handleSendVerificationCode = async () => {
    const cleanPhone = verificationPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      Alert.alert('Atenção', 'Informe um número de WhatsApp válido com DDD.');
      return;
    }

    setSendingCode(true);

    try {
      // Generate 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

      // Save code to Supabase verification_codes table
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min
      const { error: insertError } = await supabase
        .from('verification_codes')
        .insert({
          phone: fullPhone,
          code: code,
          cpf_cnpj: documentInput.replace(/\D/g, ''),
          provider_code: providerConfig.codigo || 'webconnect',
          expires_at: expiresAt,
          used: false,
        });

      if (insertError) {
        console.error('Erro ao salvar código:', insertError);
        Alert.alert('Erro', 'Não foi possível gerar o código. Tente novamente.');
        setSendingCode(false);
        return;
      }

      // Send code via n8n webhook to WhatsApp (supports production webhook and test fallback)
      const primaryWebhookUrl = providerConfig.webhook_verificacao_url || 'https://n8n.zentos.com.br/webhook/enviar-codigo-verificacao';
      const message = `🔐 Seu código de verificação WebConnect é: *${code}*\n\nVálido por 5 minutos.\nNão compartilhe este código com ninguém.`;

      const webhookPayload = {
        phone: fullPhone,
        code: code,
        message: message,
        text: message,
        cliente: selectedContract?.clientName || 'Cliente',
        cpf_cnpj: documentInput.replace(/\D/g, ''),
      };

      try {
        const response = await fetch(primaryWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });

        // Se a URL de teste não estiver ouvindo (404) ou se for produção
        if (!response.ok) {
          const alternateUrl = primaryWebhookUrl.includes('/webhook-test/')
            ? primaryWebhookUrl.replace('/webhook-test/', '/webhook/')
            : primaryWebhookUrl.replace('/webhook/', '/webhook-test/');

          console.log(`Webhook retornou status ${response.status}. Tentando URL alternativa: ${alternateUrl}`);
          await fetch(alternateUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload),
          }).catch((err) => console.error('Erro ao enviar webhook alternativo:', err));
        }
      } catch (webhookErr) {
        console.warn('Tentativa primária de webhook falhou, tentando alternativa...', webhookErr);
        const fallbackUrl = primaryWebhookUrl.includes('/webhook-test/')
          ? primaryWebhookUrl.replace('/webhook-test/', '/webhook/')
          : primaryWebhookUrl.replace('/webhook/', '/webhook-test/');
        await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        }).catch((err) => console.error('Erro ao enviar webhook fallback:', err));
      }

      setCodeSent(true);
      setSendingCode(false);

      // Start countdown for resend (60 seconds)
      setCodeCountdown(60);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setCodeCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert('Código Enviado! ✅', `Um código de 6 dígitos foi enviado para o WhatsApp ${formatPhoneInput(cleanPhone)}. Verifique suas mensagens.`);
    } catch (err) {
      console.error('Erro ao enviar código de verificação:', err);
      Alert.alert('Erro', 'Não foi possível enviar o código. Verifique sua conexão e tente novamente.');
      setSendingCode(false);
    }
  };

  // Verify the code entered by the user
  const handleVerifyCode = async () => {
    const cleanCode = verificationCode.replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      Alert.alert('Atenção', 'Digite o código de 6 dígitos recebido no WhatsApp.');
      return;
    }

    const cleanPhone = verificationPhone.replace(/\D/g, '');
    const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    setVerifyingCode(true);

    try {
      const { data, error } = await supabase.rpc('verify_code', {
        p_phone: fullPhone,
        p_code: cleanCode,
      });

      setVerifyingCode(false);

      if (error) {
        console.error('Erro ao verificar código:', error);
        Alert.alert('Erro', 'Não foi possível verificar o código. Tente novamente.');
        return;
      }

      if (data && data.verified) {
        setSupportVerified(true);
        if (countdownRef.current) clearInterval(countdownRef.current);
        // Auto-submit the support ticket after verification
        handleSubmitSupport();
        // Reset verification states for next time
        setCodeSent(false);
        setVerificationCode('');
        setVerificationPhone('');
      } else {
        Alert.alert('Código Inválido ❌', data?.message || 'Código inválido ou expirado. Tente novamente.');
        setVerificationCode('');
      }
    } catch (err) {
      setVerifyingCode(false);
      console.error('Erro ao verificar código:', err);
      Alert.alert('Erro', 'Não foi possível verificar o código. Tente novamente.');
    }
  };


  const fetchFinanceData = () => {
    if (!selectedContract) return;
    setLoadingFinanceiro(true);

    const rawDoc = documentInput.replace(/\D/g, '');

    fetch(`${providerConfig.api_url}/api/ura/clientes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app: providerConfig.api_app,
        token: providerConfig.api_token,
        cpfcnpj: rawDoc,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        setLoadingFinanceiro(false);
        if (response.ok && data) {
          let rawTitulos: any[] = [];
          const clientsList = data.clientes || [];
          clientsList.forEach((client: any) => {
            if (client.titulos && Array.isArray(client.titulos)) {
              rawTitulos = rawTitulos.concat(client.titulos);
            }
          });
          setAllTitulos(rawTitulos);
        }
      })
      .catch((err) => {
        setLoadingFinanceiro(false);
        console.error('Fetch finance data error:', err);
      });
  };

  React.useEffect(() => {
    if (screenState === 'DASHBOARD' && selectedContract) {
      fetchFinanceData();
    }
  }, [screenState, selectedContract]);

  // Fetch connection status and history dynamically
  React.useEffect(() => {
    if (screenState === 'DASHBOARD' && activeTab === 'TESTE' && selectedContract && selectedContract.pppoeLogin) {
      setLoadingConexao(true);
      
      const bodyData = {
        token: providerConfig.api_token,
        app: providerConfig.api_app,
        username: selectedContract.pppoeLogin,
      };
      
      const postData = Object.keys(bodyData)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(bodyData[key as keyof typeof bodyData]))
        .join('&');

      fetch(`${providerConfig.api_url}/ws/radius/radacct/list/all/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData,
      })
        .then(async (res) => {
          const data = await res.json();
          setLoadingConexao(false);
          if (res.ok && data && data.result && data.result.length > 0) {
            const clientData = data.result[0];
            setConexaoOnline(clientData.online === true);
            setConexaoSessions(clientData.radacct || []);
          } else {
            setConexaoOnline(false);
            setConexaoSessions([]);
          }
        })
        .catch((err) => {
          setLoadingConexao(false);
          console.error('Radius fetch error:', err);
          setConexaoOnline(false);
          setConexaoSessions([]);
        });
    }
  }, [activeTab, screenState, selectedContract]);

  const handleInputChange = (text: string) => {
    const formatted = formatAutoDocument(text);
    setDocumentInput(formatted);
    setErrorMsg('');

    const raw = formatted.replace(/\D/g, '');
    if (raw.length <= 11) {
      setDetectedType('CPF');
      setIsValid(raw.length === 11 && validateCPF(raw));
    } else {
      setDetectedType('CNPJ');
      setIsValid(raw.length === 14 && validateCNPJ(raw));
    }
  };

  const handleLogin = () => {
    const raw = documentInput.replace(/\D/g, '');
    const isCpf = raw.length <= 11;
    
    if (isCpf && !validateCPF(raw)) {
      setErrorMsg('CPF inválido. Por favor, verifique os números.');
      return;
    }
    if (!isCpf && !validateCNPJ(raw)) {
      setErrorMsg('CNPJ inválido. Por favor, verifique os números.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    // Calls URA clientes API
    fetch(`${providerConfig.api_url}/api/ura/clientes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app: providerConfig.api_app,
        token: providerConfig.api_token,
        cpfcnpj: raw,
      }),
    })
      .then(async (response) => {
        setLoading(false);
        const data = await response.json();
        console.log('API Result:', data);

        if (response.ok && data) {
          const parsedContracts: ContractDisplay[] = [];
          
          // Store raw titles
          let rawTitulos: any[] = [];

          const clientsList = data.clientes || [];
          clientsList.forEach((client: any) => {
            // Concat client titles
            if (client.titulos && Array.isArray(client.titulos)) {
              rawTitulos = rawTitulos.concat(client.titulos);
            }

            const contractsList = client.contratos || [];
            contractsList.forEach((contrato: any) => {
              // Extract plan name and service details
              let planName = 'Plano de Internet';
              let pppoeLogin = '';
              let pppoeSenha = '';
              let ip = '';
              let mac = '';
              let grupo = '';
              let wifiSsid = '';
              let wifiPassword = '';
              let wifiSsid5 = '';
              let wifiPassword5 = '';

              if (contrato.servicos && Array.isArray(contrato.servicos) && contrato.servicos.length > 0) {
                const serv = contrato.servicos[0];
                if (serv.plano) {
                  if (typeof serv.plano === 'object') {
                    planName = serv.plano.descricao || serv.plano.nome || serv.plano.description || 'Plano de Internet';
                  } else if (typeof serv.plano === 'string') {
                    planName = serv.plano;
                  }
                }
                pppoeLogin = serv.login || '';
                pppoeSenha = serv.senha || '';
                ip = serv.ip || '';
                mac = serv.mac || '';
                grupo = serv.grupo || '';
                wifiSsid = serv.wifi_ssid || '';
                wifiPassword = serv.wifi_password || '';
                wifiSsid5 = serv.wifi_ssid_5 || '';
                wifiPassword5 = serv.wifi_password_5 || '';
              }
              
              // Extract and format address
              let addressStr = '';
              let street = '';
              let num = '';
              let neighborhood = '';
              let city = '';
              let state = '';
              let cep = '';

              const addr = contrato.endereco || client.endereco;
              if (addr) {
                if (typeof addr === 'object') {
                  street = addr.logradouro || '';
                  num = addr.numero || '';
                  neighborhood = addr.bairro || '';
                  city = addr.cidade || '';
                  state = addr.uf || '';
                  cep = addr.cep || '';

                  const parts = [];
                  if (addr.logradouro) parts.push(addr.logradouro);
                  if (addr.numero) parts.push(addr.numero);
                  if (addr.bairro) parts.push(addr.bairro);
                  if (addr.cidade) parts.push(addr.cidade);
                  if (addr.uf) parts.push(addr.uf);
                  addressStr = parts.join(', ');
                } else if (typeof addr === 'string') {
                  addressStr = addr;
                }
              }
              
              parsedContracts.push({
                id: contrato.id,
                planName,
                address: addressStr || 'Endereço não cadastrado',
                status: contrato.status || 'Ativo',
                clientName: client.nome || 'Cliente',
                phone: extractClientPhone(client, contrato),
                popId: contrato.pop_id || '',
                dataCadastro: contrato.dataCadastro || '',
                vencimento: contrato.vencimento || '',
                formaCobranca: contrato.formaCobranca || '',
                centralLogin: contrato.contratoCentralLogin || '',
                centralSenha: contrato.contratoCentralSenha || '',
                pppoeLogin,
                pppoeSenha,
                ip,
                mac,
                grupo,
                wifiSsid,
                wifiPassword,
                wifiSsid5,
                wifiPassword5,
                street,
                number: num,
                neighborhood,
                city,
                state,
                cep,
              });
            });
          });

          setAllTitulos(rawTitulos);

          const validContracts = parsedContracts.filter(c => {
            const statusLower = (c.status || '').toLowerCase().trim();
            return statusLower === 'ativo' || statusLower === 'suspenso';
          });
          const invalidContracts = parsedContracts.filter(c => {
            const statusLower = (c.status || '').toLowerCase().trim();
            return statusLower !== 'ativo' && statusLower !== 'suspenso';
          });

          if (parsedContracts.length === 0) {
            setErrorMsg('Nenhum contrato localizado no seu documento.');
          } else {
            if (rememberMe) {
              AsyncStorage.setItem('@isp_app_saved_doc', documentInput).catch(() => {});
            } else {
              AsyncStorage.removeItem('@isp_app_saved_doc').catch(() => {});
              AsyncStorage.removeItem('@isp_app_saved_contract_id').catch(() => {});
            }

            if (validContracts.length === 1) {
              if (rememberMe) {
                AsyncStorage.setItem('@isp_app_saved_contract_id', validContracts[0].id.toString()).catch(() => {});
              }
              setSelectedContract(validContracts[0]);
              setActiveTab('HOME');
              setScreenState('DASHBOARD');
            } else if (validContracts.length > 1) {
              setContracts(validContracts);
              setScreenState('SELECT_CONTRACT');
            } else {
              setErrorMsg('Não foi localizado nenhum contrato Ativo ou Suspenso vinculado a este documento.');
            }
          }
        } else {
          const message = data?.message || data?.error || 'Documento não localizado na base.';
          setErrorMsg(message);
        }
      })
      .catch((err) => {
        setLoading(false);
        console.error('API Connect Error:', err);
        setErrorMsg('Erro de conexão. Verifique sua rede e tente novamente.');
      });
  };

  const handleContractSelect = (contract: ContractDisplay) => {
    if (rememberMe) {
      AsyncStorage.setItem('@isp_app_saved_contract_id', contract.id.toString()).catch(() => {});
    }
    setSelectedContract(contract);
    setActiveTab('HOME');
    setScreenState('DASHBOARD');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@isp_app_saved_doc');
      await AsyncStorage.removeItem('@isp_app_saved_contract_id');
    } catch (e) {
      console.error('Logout remove storage error:', e);
    }
    setScreenState('LOGIN');
    setDocumentInput('');
    setIsValid(false);
    setSelectedContract(null);
    setContracts([]);
    setAllTitulos([]);
    setConexaoOnline(null);
    setConexaoSessions([]);
    setSelectedPixCode(null);
    setSelectedPixAmount(null);
    setShowPppoePassword(false);
    setShowWifiPassword(false);
  };

  const [loadingTrustUnlock, setLoadingTrustUnlock] = useState(false);

  const handleOpenWhatsApp = () => {
    const num = providerConfig.whatsapp_number;
    if (!num) {
      alert('Número de WhatsApp não configurado.');
      return;
    }
    const cleanNumber = num.replace(/\D/g, '');
    const finalNum = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
    const url = `https://wa.me/${finalNum}`;
    Linking.openURL(url).catch(() => {
      alert('Não foi possível abrir o WhatsApp.');
    });
  };

  const handleTrustUnlock = () => {
    if (!selectedContract) return;

    // Calculate promise date: Today + 3 days -> YYYY-MM-DD
    const promiseDate = new Date();
    promiseDate.setDate(promiseDate.getDate() + 3);
    const yyyy = promiseDate.getFullYear();
    const mm = String(promiseDate.getMonth() + 1).padStart(2, '0');
    const dd = String(promiseDate.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    setLoadingTrustUnlock(true);

    fetch(`${providerConfig.api_url}/api/ura/liberacaopromessa/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app: providerConfig.api_app,
        token: providerConfig.api_token,
        contrato: selectedContract.id,
        data_promessa: formattedDate,
      }),
    })
      .then(async (res) => {
        setLoadingTrustUnlock(false);
        const data = await res.json();
        console.log('Trust Unlock Response:', data);

        if (res.ok && (data.liberado === true || data.status === 1 || data.sucesso)) {
          const msg = 'Efetue o pagamento o quanto antes para não ter o serviço suspenso novamente.';
          Alert.alert('Serviço liberado!', msg);
          // Update selected contract status locally to 'Ativo'
          setSelectedContract(prev => prev ? { ...prev, status: 'Ativo' } : null);
        } else {
          const errorText = (typeof data.msg === 'string' && data.msg.trim()) 
            ? data.msg.trim() 
            : (data.message || data.error || data.erro || 'Não foi possível realizar o desbloqueio em confiança.');
          Alert.alert('Desbloqueio Indisponível', errorText);
        }
      })
      .catch((err) => {
        setLoadingTrustUnlock(false);
        console.error('Trust Unlock Error:', err);
        Alert.alert('Erro de Conexão', 'Falha ao comunicar com o servidor. Tente novamente.');
      });
  };

  const [refreshingHomeStatus, setRefreshingHomeStatus] = useState(false);

  const refreshContractStatus = (docOverride?: string, contractIdOverride?: number) => {
    const docToUse = (docOverride || documentInput || '').replace(/\D/g, '');
    const activeContractId = contractIdOverride || selectedContract?.id;

    if (!docToUse) return;

    setRefreshingHomeStatus(true);

    fetch(`${providerConfig.api_url}/api/ura/clientes/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app: providerConfig.api_app,
        token: providerConfig.api_token,
        cpfcnpj: docToUse,
      }),
    })
      .then(async (response) => {
        setRefreshingHomeStatus(false);
        const data = await response.json();
        if (response.ok && data) {
          let updatedContract: ContractDisplay | null = null;
          let rawTitulos: any[] = [];

          const clientsList = data.clientes || [];
          clientsList.forEach((client: any) => {
            if (client.titulos && Array.isArray(client.titulos)) {
              rawTitulos = rawTitulos.concat(client.titulos);
            }
            const contractsList = client.contratos || [];
            contractsList.forEach((contrato: any) => {
              if (activeContractId && contrato.id === activeContractId) {
                let planName = 'Plano de Internet';
                let pppoeLogin = '';
                let pppoeSenha = '';
                let ip = '';
                let mac = '';
                let grupo = '';
                let wifiSsid = '';
                let wifiPassword = '';
                let wifiSsid5 = '';
                let wifiPassword5 = '';

                if (contrato.servicos && Array.isArray(contrato.servicos) && contrato.servicos.length > 0) {
                  const serv = contrato.servicos[0];
                  if (serv.plano) {
                    if (typeof serv.plano === 'object') {
                      planName = serv.plano.descricao || serv.plano.nome || serv.plano.description || 'Plano de Internet';
                    } else if (typeof serv.plano === 'string') {
                      planName = serv.plano;
                    }
                  }
                  pppoeLogin = serv.login || '';
                  pppoeSenha = serv.senha || '';
                  ip = serv.ip || '';
                  mac = serv.mac || '';
                  grupo = serv.grupo || '';
                  wifiSsid = serv.wifi_ssid || '';
                  wifiPassword = serv.wifi_password || '';
                  wifiSsid5 = serv.wifi_ssid_5 || '';
                  wifiPassword5 = serv.wifi_password_5 || '';
                }

                let addressStr = '';
                let street = '';
                let num = '';
                let neighborhood = '';
                let city = '';
                let state = '';
                let cep = '';

                const addr = contrato.endereco || client.endereco;
                if (addr) {
                  if (typeof addr === 'object') {
                    street = addr.logradouro || '';
                    num = addr.numero || '';
                    neighborhood = addr.bairro || '';
                    city = addr.cidade || '';
                    state = addr.uf || '';
                    cep = addr.cep || '';

                    const parts = [];
                    if (addr.logradouro) parts.push(addr.logradouro);
                    if (addr.numero) parts.push(addr.numero);
                    if (addr.bairro) parts.push(addr.bairro);
                    if (addr.cidade) parts.push(addr.cidade);
                    if (addr.uf) parts.push(addr.uf);
                    addressStr = parts.join(', ');
                  } else if (typeof addr === 'string') {
                    addressStr = addr;
                  }
                }

                updatedContract = {
                  id: contrato.id,
                  planName,
                  address: addressStr || 'Endereço não cadastrado',
                  status: contrato.status || 'Ativo',
                  clientName: client.nome || 'Cliente',
                  popId: contrato.pop_id || '',
                  dataCadastro: contrato.dataCadastro || '',
                  vencimento: contrato.vencimento || '',
                  formaCobranca: contrato.formaCobranca || '',
                  centralLogin: contrato.contratoCentralLogin || '',
                  centralSenha: contrato.contratoCentralSenha || '',
                  pppoeLogin,
                  pppoeSenha,
                  ip,
                  mac,
                  grupo,
                  wifiSsid,
                  wifiPassword,
                  wifiSsid5,
                  wifiPassword5,
                  street,
                  number: num,
                  neighborhood,
                  city,
                  state,
                  cep,
                };
              }
            });
          });

          if (updatedContract) {
            setSelectedContract(updatedContract);
          }
          if (rawTitulos.length > 0) {
            setAllTitulos(rawTitulos);
          }
        }
      })
      .catch((err) => {
        setRefreshingHomeStatus(false);
        console.error('Refresh status error:', err);
      });
  };

  const handleGoHome = () => {
    setActiveTab('HOME');
    refreshContractStatus();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        {screenState === 'DASHBOARD' && selectedContract ? (
          /* Dashboard rendering outside ScrollView to keep bottom menu fixed and safe */
          (() => {
            const statusLower = (selectedContract.status || '').toLowerCase().trim();
            const isActiveOrSuspended = statusLower === 'ativo' || statusLower === 'suspenso';
            const firstName = (selectedContract.clientName || '').split(' ')[0];

            if (isActiveOrSuspended) {
              return (
                <View style={styles.dashboardWrapper}>
                  
                  {/* TOP HEADER BAR (Sleek layout with initials avatar and metadata badges) */}
                  <View style={styles.dashboardHeader}>
                    <View style={styles.headerInfoLeft}>
                      <View style={styles.avatarRow}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>
                            {firstName.substring(0, 1).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.headerGreetingCol}>
                          <Text style={styles.headerGreeting}>Olá, {firstName}!</Text>
                          <Text style={styles.headerMetaText}>Contrato: #{selectedContract.id}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleOpenNotificationCenter}
                        activeOpacity={0.7}
                      >
                        <Bell size={16} color={unreadCount > 0 ? "#EF4444" : "#2563EB"} />
                        {unreadCount > 0 && (
                          <View style={styles.unreadBadgeDot}>
                            <Text style={styles.unreadBadgeText}>
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                      >
                        <LogOut size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* SUB-HEADER: BADGES ROW (Clean wifi and status tags) */}
                  <View style={styles.badgesRow}>
                    <View style={styles.badgeItem}>
                      <Wifi size={12} color="#2563EB" style={{ marginRight: 5 }} />
                      <Text style={styles.badgeText} numberOfLines={1}>
                        {selectedContract.planName.toUpperCase()}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadgeItem,
                      { backgroundColor: statusLower === 'ativo' ? '#10B98115' : '#F59E0B15' }
                    ]}>
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: statusLower === 'ativo' ? '#10B981' : '#F59E0B' }
                      ]} />
                      <Text style={[
                        styles.statusBadgeText,
                        { color: statusLower === 'ativo' ? '#10B981' : '#F59E0B' }
                      ]}>
                        {selectedContract.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* CENTER CONTENT AREA (Scrolls independently inside dashboard) */}
                  <ScrollView 
                    style={styles.dashboardScroll}
                    contentContainerStyle={styles.dashboardContent}
                    keyboardShouldPersistTaps="handled"
                  >
                    {activeTab === 'HOME' && (
                      <View style={styles.planoTabWrapper}>
                        {/* SUSPENDED SERVICE WARNING CARD WITH TRUST UNLOCK */}
                        {statusLower === 'suspenso' || statusLower === 'bloqueado' ? (
                          <View style={styles.suspendedWarningCard}>
                            <View style={styles.suspendedCardHeader}>
                              <View style={styles.suspendedIconBadge}>
                                <AlertTriangle size={24} color="#EF4444" />
                              </View>
                              <View style={styles.suspendedHeaderCol}>
                                <Text style={styles.suspendedTitle}>Serviço Bloqueado</Text>
                                <Text style={styles.suspendedSubtitle}>Seu contrato encontra-se suspenso</Text>
                              </View>
                            </View>

                            <Text style={styles.suspendedDesc}>
                              Identificamos pendências no pagamento da sua assinatura. Você pode realizar o <Text style={{ fontWeight: '700', color: '#FFFFFF' }}>Desbloqueio em Confiança</Text> para liberar seu sinal imediatamente por 3 dias.
                            </Text>

                            <TouchableOpacity
                              style={styles.trustUnlockBtn}
                              onPress={handleTrustUnlock}
                              disabled={loadingTrustUnlock}
                              activeOpacity={0.8}
                            >
                              {loadingTrustUnlock ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <View style={styles.trustUnlockBtnContent}>
                                  <Unlock size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                  <Text style={styles.trustUnlockBtnText}>Desbloqueio em Confiança (3 Dias)</Text>
                                </View>
                              )}
                            </TouchableOpacity>
                          </View>
                        ) : null}

                        {/* 1. NEXT BILL / OVERDUE CARD */}
                        {(() => {
                          const contractTitulos = allTitulos.filter(t => t.clientecontrato_id === selectedContract.id);
                          const today = new Date();
                          today.setHours(0,0,0,0);

                          const openBills = contractTitulos
                            .filter(t => t.status !== 'pago' && t.status !== 'cancelado')
                            .map(t => {
                              const dueDate = new Date(t.dataVencimento + 'T12:00:00');
                              const isOverdue = dueDate.getTime() < today.getTime();
                              return { ...t, isOverdue };
                            })
                            .sort((a, b) => {
                              if (a.isOverdue && !b.isOverdue) return -1;
                              if (!a.isOverdue && b.isOverdue) return 1;
                              return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
                            });

                          const nextBill = openBills[0] || null;

                          if (!nextBill) {
                            return (
                              <View style={[styles.infoCard, { borderLeftWidth: 4, borderLeftColor: '#10B981', paddingVertical: 20 }]}>
                                <View style={styles.infoCardHeader}>
                                  <CheckCircle size={20} color="#10B981" style={{ marginRight: 8 }} />
                                  <Text style={styles.infoCardHeaderTitle}>Faturamento em Dia</Text>
                                </View>
                                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 6 }}>
                                  Você não possui nenhuma parcela em aberto no momento. Parabéns! 🎉
                                </Text>
                              </View>
                            );
                          }

                          const isOverdue = nextBill.isOverdue;
                          const borderColor = isOverdue ? '#EF4444' : '#2563EB';
                          const statusBg = isOverdue ? '#EF444415' : '#2563EB15';
                          const statusText = isOverdue ? 'PARCELA VENCIDA' : 'A VENCER';
                          const statusColor = isOverdue ? '#EF4444' : '#2563EB';

                          return (
                            <View style={[styles.infoCard, { borderLeftWidth: 4, borderLeftColor: borderColor }]}>
                              <View style={styles.infoCardHeader}>
                                <CreditCard size={18} color={borderColor} style={{ marginRight: 8 }} />
                                <Text style={styles.infoCardHeaderTitle}>Próxima Parcela</Text>
                                <View style={[styles.billStatusBadge, { backgroundColor: statusBg, marginLeft: 'auto' }]}>
                                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                                  <Text style={[styles.billStatusText, { color: statusColor, fontWeight: '700' }]}>
                                    {statusText}
                                  </Text>
                                </View>
                              </View>

                              <View style={{ marginTop: 10 }}>
                                <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>
                                  Vencimento: {formatDateBR(nextBill.dataVencimento)}
                                </Text>
                                <Text style={{ color: isOverdue ? '#EF4444' : '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 4 }}>
                                  {formatCurrency(nextBill.valorCorrigido || nextBill.valor)}
                                </Text>
                              </View>

                              <TouchableOpacity
                                style={[
                                  styles.supportSubmitBtn,
                                  { backgroundColor: isOverdue ? '#DC2626' : '#2563EB', marginTop: 14 }
                                ]}
                                onPress={() => setActiveTab('FINANCEIRO')}
                                activeOpacity={0.8}
                              >
                                <CreditCard size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.supportSubmitBtnText}>Pagar</Text>
                              </TouchableOpacity>
                            </View>
                          );
                        })()}
                      </View>
                    )}

                    {activeTab === 'PLANO' && (
                      <View style={styles.planoTabWrapper}>
                        
                        {/* 1. PLAN DETAILED CARD */}
                        <View style={styles.infoCard}>
                          <View style={styles.infoCardHeader}>
                            <Globe size={18} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={styles.infoCardHeaderTitle}>Plano Contratado</Text>
                          </View>
                          <Text style={styles.planoMainTitle}>{selectedContract.planName}</Text>
                          
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Tecnologia</Text>
                            <Text style={styles.infoValue}>
                              {selectedContract.pppoeLogin ? 'Fibra Óptica' : 'Cabo/Rádio'}
                            </Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Status do Serviço</Text>
                            <Text style={[styles.infoValue, { color: '#10B981' }]}>{selectedContract.status}</Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Grupo</Text>
                            <Text style={styles.infoValue}>{selectedContract.grupo || 'Fibra'}</Text>
                          </View>
                        </View>

                        {/* 3. WI-FI CARD (Only render if Wi-Fi SSID exists) */}
                        {(selectedContract.wifiSsid || selectedContract.wifiSsid5) ? (
                          <View style={styles.infoCard}>
                            <View style={styles.infoCardHeader}>
                              <Wifi size={18} color="#2563EB" style={{ marginRight: 8 }} />
                              <Text style={styles.infoCardHeaderTitle}>Dados do Roteador Wi-Fi</Text>
                            </View>

                            {selectedContract.wifiSsid ? (
                              <>
                                <View style={styles.infoRow}>
                                  <Text style={styles.infoLabel}>Rede 2.4 GHz (SSID)</Text>
                                  <Text style={styles.infoValue}>{selectedContract.wifiSsid}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                  <Text style={styles.infoLabel}>Senha 2.4 GHz</Text>
                                  <View style={styles.copyRow}>
                                    <Text style={styles.infoValue}>
                                      {showWifiPassword ? selectedContract.wifiPassword : '••••••••'}
                                    </Text>
                                    <TouchableOpacity 
                                      onPress={() => setShowWifiPassword(!showWifiPassword)} 
                                      style={styles.copyIconBtn}
                                    >
                                      {showWifiPassword ? <EyeOff size={14} color="#64748B" /> : <Eye size={14} color="#64748B" />}
                                    </TouchableOpacity>
                                    {selectedContract.wifiPassword ? (
                                      <TouchableOpacity 
                                        onPress={() => {
                                          Clipboard.setString(selectedContract.wifiPassword || '');
                                          alert('Senha Wi-Fi copiada!');
                                        }} 
                                        style={styles.copyIconBtn}
                                      >
                                        <Copy size={14} color="#64748B" />
                                      </TouchableOpacity>
                                    ) : null}
                                  </View>
                                </View>
                              </>
                            ) : null}

                            {selectedContract.wifiSsid5 ? (
                              <>
                                <View style={[styles.infoRow, { marginTop: 10 }]}>
                                  <Text style={styles.infoLabel}>Rede 5.0 GHz (SSID)</Text>
                                  <Text style={styles.infoValue}>{selectedContract.wifiSsid5}</Text>
                                </View>
                                <View style={styles.infoRow}>
                                  <Text style={styles.infoLabel}>Senha 5.0 GHz</Text>
                                  <View style={styles.copyRow}>
                                    <Text style={styles.infoValue}>
                                      {showWifiPassword ? selectedContract.wifiPassword5 : '••••••••'}
                                    </Text>
                                    <TouchableOpacity 
                                      onPress={() => setShowWifiPassword(!showWifiPassword)} 
                                      style={styles.copyIconBtn}
                                    >
                                      {showWifiPassword ? <EyeOff size={14} color="#64748B" /> : <Eye size={14} color="#64748B" />}
                                    </TouchableOpacity>
                                    {selectedContract.wifiPassword5 ? (
                                      <TouchableOpacity 
                                        onPress={() => {
                                          Clipboard.setString(selectedContract.wifiPassword5 || '');
                                          alert('Senha Wi-Fi 5G copiada!');
                                        }} 
                                        style={styles.copyIconBtn}
                                      >
                                        <Copy size={14} color="#64748B" />
                                      </TouchableOpacity>
                                    ) : null}
                                  </View>
                                </View>
                              </>
                            ) : null}
                          </View>
                        ) : null}

                        {/* 4. BILLING/CONTRACT INFO CARD */}
                        <View style={styles.infoCard}>
                          <View style={styles.infoCardHeader}>
                            <CreditCard size={18} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={styles.infoCardHeaderTitle}>Contrato e Faturamento</Text>
                          </View>

                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>ID do Contrato</Text>
                            <Text style={styles.infoValue}>#{selectedContract.id}</Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Dia de Vencimento</Text>
                            <Text style={styles.infoValue}>Dia {selectedContract.vencimento || 'Não informado'}</Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Forma de Pagamento</Text>
                            <Text style={styles.infoValue}>{selectedContract.formaCobranca || 'Boleto Bancário'}</Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Login da Central</Text>
                            <Text style={styles.infoValue}>{selectedContract.centralLogin || 'Não cadastrado'}</Text>
                          </View>
                        </View>

                        {/* 5. ADDRESS CARD */}
                        <View style={styles.infoCard}>
                          <View style={styles.infoCardHeader}>
                            <MapPin size={18} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={styles.infoCardHeaderTitle}>Endereço de Instalação</Text>
                          </View>

                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Logradouro</Text>
                            <Text style={styles.infoValue} numberOfLines={1}>
                              {selectedContract.street || 'Não informado'}
                            </Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Número</Text>
                            <Text style={styles.infoValue}>{selectedContract.number || 'S/N'}</Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Bairro</Text>
                            <Text style={styles.infoValue}>{selectedContract.neighborhood || 'Não informado'}</Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Cidade / UF</Text>
                            <Text style={styles.infoValue}>
                              {selectedContract.city ? `${selectedContract.city} - ${selectedContract.state || ''}` : 'Não informada'}
                            </Text>
                          </View>
                          <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>CEP</Text>
                            <Text style={styles.infoValue}>{selectedContract.cep || 'Não informado'}</Text>
                          </View>
                        </View>

                      </View>
                    )}

                    {activeTab === 'FINANCEIRO' && (
                      <View style={styles.financeiroTabWrapper}>
                        {loadingFinanceiro ? (
                          <View style={[styles.infoCard, { alignItems: 'center', paddingVertical: 40 }]}>
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text style={[styles.noBillsTitle, { marginTop: 16 }]}>Atualizando faturas...</Text>
                            <Text style={styles.noBillsDesc}>Buscando dados financeiros mais recentes no SGP.</Text>
                          </View>
                        ) : (
                          <>
                            {/* SECTION 1: OPEN / OVERDUE INVOICES */}
                            <View style={styles.sectionHeaderRow}>
                              <AlertTriangle size={16} color="#EF4444" style={{ marginRight: 6 }} />
                              <Text style={styles.sectionTitle}>Boletos em Aberto / A Vencer</Text>
                            </View>

                            {(() => {
                              // Filter titles for current contract
                              const contractTitulos = allTitulos.filter(t => t.clientecontrato_id === selectedContract.id);
                              
                              const today = new Date();
                              today.setHours(0,0,0,0);

                              // Select and mark overdue vs pending open bills
                              const openBills = contractTitulos
                                .filter(t => t.status !== 'pago' && t.status !== 'cancelado')
                                .map(t => {
                                  const dueDate = new Date(t.dataVencimento + 'T12:00:00');
                                  const isOverdue = dueDate.getTime() < today.getTime();
                                  return { ...t, isOverdue };
                                })
                                .sort((a, b) => {
                                  // Overdue (Vencidos) always first
                                  if (a.isOverdue && !b.isOverdue) return -1;
                                  if (!a.isOverdue && b.isOverdue) return 1;
                                  // Closest due date next
                                  return new Date(a.dataVencimento).getTime() - new Date(b.dataVencimento).getTime();
                                });

                              // Pick top 3 open invoices
                              const displayOpenBills = openBills.slice(0, 3);

                              if (displayOpenBills.length === 0) {
                                return (
                                  <View style={[styles.infoCard, { alignItems: 'center', paddingVertical: 24 }]}>
                                    <CheckCircle size={36} color="#10B981" style={{ marginBottom: 10 }} />
                                    <Text style={styles.noBillsTitle}>Nenhum boleto em aberto!</Text>
                                    <Text style={styles.noBillsDesc}>Seu faturamento está em dia. Parabéns! 🎉</Text>
                                  </View>
                                );
                              }

                              return displayOpenBills.map((bill) => (
                                <View 
                                  key={bill.id} 
                                  style={[
                                    styles.billCard, 
                                    { borderLeftColor: bill.isOverdue ? '#EF4444' : '#2563EB' }
                                  ]}
                                >
                                  <View style={styles.billHeader}>
                                    <View style={styles.billMeta}>
                                      <Text style={styles.billDueLabel}>VENCIMENTO</Text>
                                      <Text style={styles.billDueDate}>{formatDateBR(bill.dataVencimento)}</Text>
                                    </View>
                                    <View style={[
                                      styles.billStatusBadge,
                                      { backgroundColor: bill.isOverdue ? '#EF444415' : '#2563EB15' }
                                    ]}>
                                      <View style={[
                                        styles.statusDot,
                                        { backgroundColor: bill.isOverdue ? '#EF4444' : '#2563EB' }
                                      ]} />
                                      <Text style={[
                                        styles.billStatusText,
                                        { color: bill.isOverdue ? '#EF4444' : '#2563EB' }
                                      ]}>
                                        {bill.isOverdue ? 'VENCIDO' : 'A VENCER'}
                                      </Text>
                                    </View>
                                  </View>

                                  <View style={styles.billPriceRow}>
                                    <Text style={styles.billPriceLabel}>VALOR COBRADO</Text>
                                    <Text style={styles.billPriceValue}>
                                      {formatCurrency(bill.valorCorrigido || bill.valor)}
                                    </Text>
                                  </View>

                                  {/* ACTIONS BUTTONS ROW */}
                                  <View style={styles.billActionsContainer}>
                                    {bill.codigoPix ? (
                                      <>
                                        <TouchableOpacity
                                          style={styles.actionPillBtn}
                                          onPress={() => {
                                            Clipboard.setString(bill.codigoPix);
                                            alert('Código de pagamento Pix Copia e Cola copiado com sucesso!');
                                          }}
                                          activeOpacity={0.8}
                                        >
                                          <Copy size={12} color="#FFFFFF" />
                                          <Text style={styles.actionPillText}>Copiar Pix</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                          style={styles.actionPillSecondaryBtn}
                                          onPress={() => {
                                            setSelectedPixCode(bill.codigoPix);
                                            setSelectedPixAmount(bill.valorCorrigido || bill.valor);
                                          }}
                                          activeOpacity={0.7}
                                        >
                                          <QrCode size={12} color="#94A3B8" />
                                          <Text style={styles.actionPillSecondaryText}>QR Code</Text>
                                        </TouchableOpacity>
                                      </>
                                    ) : null}

                                    {bill.linhaDigitavel ? (
                                      <TouchableOpacity
                                        style={styles.actionPillSecondaryBtn}
                                        onPress={() => {
                                          Clipboard.setString(bill.linhaDigitavel);
                                          alert('Código de barras copiado com sucesso!');
                                        }}
                                        activeOpacity={0.7}
                                      >
                                        <Copy size={12} color="#94A3B8" />
                                        <Text style={styles.actionPillSecondaryText}>Barras</Text>
                                      </TouchableOpacity>
                                    ) : null}

                                    {bill.link ? (
                                      <TouchableOpacity
                                        style={styles.actionPillSecondaryBtn}
                                        onPress={() => Linking.openURL(bill.link)}
                                        activeOpacity={0.7}
                                      >
                                        <ExternalLink size={12} color="#94A3B8" />
                                        <Text style={styles.actionPillSecondaryText}>PDF</Text>
                                      </TouchableOpacity>
                                    ) : null}
                                  </View>
                                </View>
                              ));
                            })()}

                            {/* SECTION 2: LAST PAID INVOICES */}
                            <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
                              <CheckCircle size={16} color="#10B981" style={{ marginRight: 6 }} />
                              <Text style={styles.sectionTitle}>Últimos Boletos Pagos</Text>
                            </View>

                            {(() => {
                              const contractTitulos = allTitulos.filter(t => t.clientecontrato_id === selectedContract.id);
                              
                              // Get paid invoices sorted by due date descending (latest first)
                              const paidBills = contractTitulos
                                .filter(t => t.status === 'pago')
                                .sort((a, b) => new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime());

                              const displayPaidBills = paidBills.slice(0, 3);

                              if (displayPaidBills.length === 0) {
                                return (
                                  <View style={[styles.infoCard, { alignItems: 'center', paddingVertical: 20 }]}>
                                    <Text style={styles.noBillsTitle}>Nenhum boleto pago localizado.</Text>
                                  </View>
                                );
                              }

                              return displayPaidBills.map((bill) => (
                                <View key={bill.id} style={styles.paidBillCard}>
                                  <View style={styles.paidBillMain}>
                                    <View style={styles.paidBillInfo}>
                                      <Text style={styles.paidBillTitle}>
                                        {formatCurrency(bill.valorPago || bill.valor)}
                                      </Text>
                                      <Text style={styles.paidBillSub}>
                                        Vencimento: {formatDateBR(bill.dataVencimento)}
                                      </Text>
                                      {bill.dataPagamento ? (
                                        <Text style={styles.paidBillDate}>
                                          Pago em: {formatDateBR(bill.dataPagamento)}
                                        </Text>
                                      ) : null}
                                    </View>

                                    <View style={styles.paidRightActions}>
                                      <View style={styles.paidBadge}>
                                        <Text style={styles.paidBadgeText}>PAGO</Text>
                                      </View>
                                      {bill.link ? (
                                        <TouchableOpacity
                                          style={styles.paidPdfCircleBtn}
                                          onPress={() => Linking.openURL(bill.link)}
                                          activeOpacity={0.7}
                                        >
                                          <ExternalLink size={13} color="#94A3B8" />
                                        </TouchableOpacity>
                                      ) : null}
                                    </View>
                                  </View>
                                </View>
                              ));
                            })()}
                          </>
                        )}
                      </View>
                    )}

                    {activeTab === 'SUPORTE' && (
                      <View style={styles.planoTabWrapper}>

                        {/* A. NEW TICKET FORM (always visible) */}
                        <View style={styles.infoCard}>
                          <View style={styles.infoCardHeader}>
                            <MessageSquare size={18} color="#2563EB" style={{ marginRight: 8 }} />
                            <Text style={styles.infoCardHeaderTitle}>Abrir Ordem de Serviço</Text>
                          </View>

                          {/* Phone Number Field */}
                          <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>📱 Número do WhatsApp</Text>
                            <TextInput
                              style={styles.formInput}
                              placeholder="(81) 99999-9999"
                              placeholderTextColor="#64748B"
                              keyboardType="phone-pad"
                              value={verificationPhone}
                              onChangeText={(text) => setVerificationPhone(formatPhoneInput(text))}
                              editable={!codeSent}
                              maxLength={15}
                            />
                          </View>

                          <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Motivo da Ocorrência / Chamado</Text>
                            <TouchableOpacity
                              style={styles.dropdownSelector}
                              onPress={() => setIsMotiveDropdownOpen(!isMotiveDropdownOpen)}
                              activeOpacity={0.8}
                            >
                              <Text style={styles.dropdownSelectorText}>
                                {[
                                  { label: 'Acesso Lento', value: '1' },
                                  { label: 'Sem Conexão', value: '2' },
                                  { label: 'Mudança de Endereço', value: '4' },
                                  { label: 'Outros Assuntos', value: '5' }
                                ].find(item => item.value === supportMotive)?.label || 'Selecione o motivo'}
                              </Text>
                              {isMotiveDropdownOpen ? (
                                <ChevronUp size={20} color="#64748B" />
                              ) : (
                                <ChevronDown size={20} color="#64748B" />
                              )}
                            </TouchableOpacity>

                            {isMotiveDropdownOpen && (
                              <View style={styles.dropdownMenu}>
                                {[
                                  { label: 'Acesso Lento', value: '1' },
                                  { label: 'Sem Conexão', value: '2' },
                                  { label: 'Mudança de Endereço', value: '4' },
                                  { label: 'Outros Assuntos', value: '5' }
                                ].map((item) => {
                                  const isSelected = supportMotive === item.value;
                                  return (
                                    <TouchableOpacity
                                      key={item.value}
                                      style={[
                                        styles.dropdownItem,
                                        isSelected && styles.dropdownItemActive
                                      ]}
                                      onPress={() => {
                                        setSupportMotive(item.value);
                                        setIsMotiveDropdownOpen(false);
                                      }}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={[
                                        styles.dropdownItemText,
                                        isSelected && styles.dropdownItemTextActive
                                      ]}>
                                        {item.label}
                                      </Text>
                                      {isSelected && <Check size={16} color="#2563EB" />}
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            )}
                          </View>

                          <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>Descrição do Problema</Text>
                            <TextInput
                              style={[styles.formInput, styles.formInputTextArea]}
                              placeholder="Descreva aqui detalhadamente o seu problema..."
                              placeholderTextColor="#64748B"
                              multiline={true}
                              numberOfLines={4}
                              value={supportContent}
                              onChangeText={setSupportContent}
                            />
                          </View>

                          {/* Submit Button (sends verification code) - visible when code NOT yet sent */}
                          {!codeSent && (
                            <TouchableOpacity
                              style={[
                                styles.supportSubmitBtn,
                                { backgroundColor: sendingCode ? '#1E293B' : '#2563EB' }
                              ]}
                              onPress={handleSendVerificationCode}
                              disabled={sendingCode}
                              activeOpacity={0.8}
                            >
                              {sendingCode ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                              ) : (
                                <Text style={styles.supportSubmitBtnText}>Abrir Chamado</Text>
                              )}
                            </TouchableOpacity>
                          )}

                          {/* Verification Code Section (appears after clicking Abrir Chamado) */}
                          {codeSent && (
                            <>
                              <View style={{
                                backgroundColor: '#F59E0B15',
                                borderRadius: 12,
                                padding: 14,
                                marginTop: 8,
                                borderWidth: 1,
                                borderColor: '#F59E0B30',
                              }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                  <ShieldCheck size={16} color="#F59E0B" style={{ marginRight: 8 }} />
                                  <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '700' }}>
                                    Código de verificação enviado!
                                  </Text>
                                </View>
                                <Text style={{ color: '#94A3B8', fontSize: 12, lineHeight: 18 }}>
                                  Enviamos um código de 6 dígitos para o WhatsApp {verificationPhone}. Digite abaixo para confirmar e abrir o chamado.
                                </Text>
                              </View>

                              <View style={[styles.formGroup, { marginTop: 12 }]}>
                                <Text style={styles.formLabel}>🔑 Código de Verificação</Text>
                                <TextInput
                                  style={[styles.formInput, { fontSize: 24, letterSpacing: 8, textAlign: 'center', fontWeight: '800' }]}
                                  placeholder="000000"
                                  placeholderTextColor="#64748B"
                                  keyboardType="number-pad"
                                  value={verificationCode}
                                  onChangeText={(text) => setVerificationCode(text.replace(/\D/g, '').slice(0, 6))}
                                  maxLength={6}
                                />
                              </View>

                              <TouchableOpacity
                                style={[
                                  styles.supportSubmitBtn,
                                  { backgroundColor: verifyingCode ? '#1E293B' : '#10B981', marginTop: 4 }
                                ]}
                                onPress={handleVerifyCode}
                                disabled={verifyingCode}
                                activeOpacity={0.8}
                              >
                                {verifyingCode ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <Text style={styles.supportSubmitBtnText}>Confirmar e Abrir Chamado</Text>
                                )}
                              </TouchableOpacity>

                              {/* Resend / Change Number */}
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                                <TouchableOpacity
                                  onPress={() => {
                                    setCodeSent(false);
                                    setVerificationCode('');
                                    setVerificationPhone('');
                                    if (countdownRef.current) clearInterval(countdownRef.current);
                                    setCodeCountdown(0);
                                  }}
                                  activeOpacity={0.7}
                                >
                                  <Text style={{ color: '#64748B', fontSize: 13 }}>Alterar número</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  onPress={codeCountdown > 0 ? undefined : handleSendVerificationCode}
                                  activeOpacity={codeCountdown > 0 ? 1 : 0.7}
                                >
                                  <Text style={{ color: codeCountdown > 0 ? '#475569' : '#F59E0B', fontSize: 13, fontWeight: '600' }}>
                                    {codeCountdown > 0 ? `Reenviar em ${codeCountdown}s` : 'Reenviar código'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </>
                          )}
                        </View>

                        {/* B. TICKETS HISTORY */}
                        <View style={[styles.sectionHeaderRow, { marginTop: 12 }]}>
                          <Clock size={16} color="#2563EB" style={{ marginRight: 6 }} />
                          <Text style={styles.sectionTitle}>Histórico de Ocorrências</Text>
                        </View>

                        {loadingSuporte ? (
                          <View style={[styles.infoCard, { alignItems: 'center', paddingVertical: 30 }]}>
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text style={[styles.noBillsTitle, { marginTop: 12 }]}>Carregando histórico...</Text>
                          </View>
                        ) : suporteTickets.length === 0 ? (
                          <View style={[styles.infoCard, { alignItems: 'center', paddingVertical: 30 }]}>
                            <Text style={styles.noBillsTitle}>Nenhum chamado anterior localizado.</Text>
                            <Text style={styles.noBillsDesc}>Qualquer chamado aberto aparecerá listado aqui.</Text>
                          </View>
                        ) : (
                          [...suporteTickets]
                            .sort((a, b) => {
                              const dateA = parseOcorrenciaDate(a.data_cadastro || a.oc_data_cadastro || '');
                              const dateB = parseOcorrenciaDate(b.data_cadastro || b.oc_data_cadastro || '');
                              return dateB - dateA;
                            })
                            .slice(0, 10)
                            .map((ticket, index) => {
                              const statusStr = (ticket.status || ticket.oc_status_descricao || 'Aberta').toString();
                              const isClosed = statusStr.toLowerCase().includes('encerra');
                              const protocol = ticket.numero || ticket.oc_protocolo || ticket.id;
                              const dataCad = ticket.data_cadastro
                                ? (ticket.data_cadastro.includes('-') ? formatDateBR(ticket.data_cadastro) : ticket.data_cadastro)
                                : ticket.oc_data_cadastro;
                              const tipo = ticket.tipo || ticket.oc_tipo_descricao || 'Suporte';
                              const conteudo = (ticket.conteudo || ticket.oc_conteudo || '').toString().trim();
                              const ordensServico = ticket.ordens_servicos || [];

                              return (
                                <View key={ticket.id || index} style={styles.ticketCard}>
                                  <View style={styles.ticketHeader}>
                                    <View style={styles.ticketTypeRow}>
                                      <View style={[
                                        styles.ticketStatusDot,
                                        { backgroundColor: isClosed ? '#10B981' : '#F59E0B' }
                                      ]} />
                                      <Text style={styles.ticketTypeTitle}>{tipo}</Text>
                                    </View>
                                    <View style={[
                                      styles.billStatusBadge,
                                      { backgroundColor: isClosed ? '#10B98115' : '#F59E0B15' }
                                    ]}>
                                      <Text style={[
                                        styles.billStatusText,
                                        { color: isClosed ? '#10B981' : '#F59E0B', fontSize: 9 }
                                      ]}>
                                        {statusStr.toUpperCase()}
                                      </Text>
                                    </View>
                                  </View>

                                  <View style={styles.ticketBody}>
                                    {protocol ? <Text style={styles.ticketProtocolText}>Protocolo / Nº: {protocol}</Text> : null}
                                    {dataCad ? <Text style={styles.ticketDateText}>Aberto em: {dataCad}</Text> : null}
                                    
                                    {conteudo ? (
                                      <View style={styles.ticketContentBox}>
                                        <Text style={styles.ticketContentText}>{conteudo}</Text>
                                      </View>
                                    ) : null}

                                    {ordensServico.length > 0 ? (
                                      ordensServico.map((osItem: any, osIdx: number) => (
                                        <View key={osItem.id || osIdx} style={styles.osDetailsContainer}>
                                          <Text style={styles.osDetailsTitle}>Ordem de Serviço Vinculada</Text>
                                          <View style={styles.osDetailsRow}>
                                            <Text style={styles.osDetailsLabel}>OS nº {osItem.id} ({osItem.motivo || osItem.tipo || 'OS'})</Text>
                                            <Text style={[
                                              styles.osDetailsStatus,
                                              { color: (osItem.status || '').toLowerCase().includes('encerra') ? '#10B981' : '#3B82F6' }
                                            ]}>
                                              {osItem.status || 'Pendente'}
                                            </Text>
                                          </View>
                                        </View>
                                      ))
                                    ) : ticket.os_id ? (
                                      <View style={styles.osDetailsContainer}>
                                        <Text style={styles.osDetailsTitle}>Ordem de Serviço Vinculada</Text>
                                        <View style={styles.osDetailsRow}>
                                          <Text style={styles.osDetailsLabel}>OS nº {ticket.os_id}</Text>
                                          <Text style={[
                                            styles.osDetailsStatus,
                                            { color: (ticket.os_status_descricao || '').toLowerCase().includes('encerra') ? '#10B981' : '#3B82F6' }
                                          ]}>
                                            {ticket.os_status_descricao || 'Pendente'}
                                          </Text>
                                        </View>
                                      </View>
                                    ) : null}
                                  </View>
                                </View>
                              );
                            })
                        )}
                      </View>
                    )}

                    {activeTab === 'TESTE' && (
                      <View style={styles.planoTabWrapper}>
                        {loadingConexao ? (
                          <View style={[styles.infoCard, { alignItems: 'center', paddingVertical: 40 }]}>
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text style={[styles.noBillsTitle, { marginTop: 16 }]}>Consultando status da conexão...</Text>
                            <Text style={styles.noBillsDesc}>Aguarde enquanto carregamos seus dados de tráfego.</Text>
                          </View>
                        ) : (
                          (() => {
                            // 1. Connection Status Details
                            const currentSession = conexaoSessions[0] || null;
                            const ipAddress = currentSession?.framedipaddress || selectedContract.ip || 'Dinâmico';
                            
                            // 2. Calculations for last 30 days consumption
                            const limit30 = new Date();
                            limit30.setDate(limit30.getDate() - 30);
                            limit30.setHours(0,0,0,0);

                            let totalDownloadBytes = 0;
                            let totalUploadBytes = 0;

                            conexaoSessions.forEach(s => {
                              if (s.acctstarttime) {
                                const sDate = new Date(s.acctstarttime);
                                if (sDate.getTime() >= limit30.getTime()) {
                                  totalDownloadBytes += s.acctoutputoctets || 0;
                                  totalUploadBytes += s.acctinputoctets || 0;
                                }
                              }
                            });

                            return (
                              <>
                                {/* A. STATUS CARD */}
                                <View style={[styles.infoCard, { borderLeftWidth: 4, borderLeftColor: conexaoOnline ? '#10B981' : '#EF4444' }]}>
                                  <View style={styles.infoCardHeader}>
                                    <Activity size={18} color="#2563EB" style={{ marginRight: 8 }} />
                                    <Text style={styles.infoCardHeaderTitle}>Status da Conexão</Text>
                                  </View>

                                  <View style={styles.connectionStatusContainer}>
                                    <View style={[
                                      styles.billStatusBadge,
                                      { 
                                        backgroundColor: conexaoOnline ? '#10B98115' : '#EF444415',
                                        alignSelf: 'flex-start',
                                        marginBottom: 16 
                                      }
                                    ]}>
                                      <View style={[
                                        styles.statusDot,
                                        { backgroundColor: conexaoOnline ? '#10B981' : '#EF4444' }
                                      ]} />
                                      <Text style={[
                                        styles.billStatusText,
                                        { color: conexaoOnline ? '#10B981' : '#EF4444' }
                                      ]}>
                                        {conexaoOnline ? 'ONLINE' : 'OFFLINE'}
                                      </Text>
                                    </View>
                                    
                                    {conexaoOnline ? (
                                      <>
                                        <View style={styles.infoRow}>
                                          <Text style={styles.infoLabel}>Endereço IP</Text>
                                          <Text style={styles.infoValue}>{ipAddress}</Text>
                                        </View>
                                        {currentSession?.acctstarttime ? (
                                          <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Conectado desde</Text>
                                            <Text style={styles.infoValue}>
                                              {formatDateBR(currentSession.acctstarttime.split('T')[0])} às {currentSession.acctstarttime.split('T')[1].substring(0, 5)}
                                            </Text>
                                          </View>
                                        ) : null}
                                        {currentSession?.acctstarttime ? (
                                          <View style={styles.infoRow}>
                                            <Text style={styles.infoLabel}>Tempo Ativo</Text>
                                            <Text style={styles.infoValue}>
                                              {formatSessionDuration(currentSession.acctstarttime, null)}
                                            </Text>
                                          </View>
                                        ) : null}
                                      </>
                                    ) : (
                                      <Text style={styles.noBillsDesc}>
                                        Seu roteador encontra-se desconectado no momento. Caso precise de ajuda, entre em contato com nosso suporte técnico.
                                      </Text>
                                    )}
                                  </View>
                                </View>

                                {/* B. TOTAL CONSUMPTION CARD (LAST 30 DAYS) */}
                                <View style={styles.infoCard}>
                                  <View style={styles.infoCardHeader}>
                                    <Globe size={18} color="#2563EB" style={{ marginRight: 8 }} />
                                    <Text style={styles.infoCardHeaderTitle}>Consumo dos Últimos 30 Dias</Text>
                                  </View>

                                  <View style={styles.totalConsumptionRow}>
                                    <View style={styles.consumptionBox}>
                                      <Text style={styles.consumptionBoxLabel}>DOWNLOAD</Text>
                                      <Text style={[styles.consumptionBoxValue, { color: '#2563EB' }]}>
                                        {formatBytes(totalDownloadBytes)}
                                      </Text>
                                    </View>
                                    <View style={styles.consumptionBox}>
                                      <Text style={styles.consumptionBoxLabel}>UPLOAD</Text>
                                      <Text style={styles.consumptionBoxValue}>
                                        {formatBytes(totalUploadBytes)}
                                      </Text>
                                    </View>
                                  </View>
                                </View>

                                {/* C. SPEED TEST WEBVIEW CARD */}
                                <View style={styles.speedtestWebviewCard}>
                                  <View style={styles.infoCardHeader}>
                                    <Activity size={18} color="#2563EB" style={{ marginRight: 8 }} />
                                    <Text style={styles.infoCardHeaderTitle}>Teste de Velocidade (OpenSpeedTest)</Text>
                                  </View>

                                  <View style={styles.webviewWrapper}>
                                    <WebView
                                      source={{
                                        html: `
                                          <!DOCTYPE html>
                                          <html>
                                          <head>
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                                            <style>
                                              body {
                                                margin: 0;
                                                padding: 0;
                                                background-color: #FFFFFF;
                                                overflow: hidden;
                                                display: flex;
                                                justify-content: center;
                                                align-items: center;
                                                height: 100vh;
                                              }
                                              iframe {
                                                width: 100%;
                                                height: 100%;
                                                min-height: 360px;
                                                border: none;
                                              }
                                            </style>
                                          </head>
                                          <body>
                                            <iframe src="https://openspeedtest.com/speedtest" allow="geolocation"></iframe>
                                          </body>
                                          </html>
                                        `
                                      }}
                                      style={styles.webview}
                                      javaScriptEnabled={true}
                                      domStorageEnabled={true}
                                      startInLoadingState={true}
                                      renderLoading={() => (
                                        <View style={styles.webviewLoading}>
                                          <ActivityIndicator size="large" color="#2563EB" />
                                        </View>
                                      )}
                                      originWhitelist={['*']}
                                      mixedContentMode="always"
                                    />
                                  </View>
                                </View>
                              </>
                            );
                          })()
                        )}
                      </View>
                    )}
                  </ScrollView>

                  {/* FLOATING WHATSAPP BANNER (Fixed right above bottom tab bar on HOME) */}
                  {activeTab === 'HOME' && (
                    <View style={styles.whatsappFloatingContainer}>
                      <TouchableOpacity
                        style={styles.whatsappBanner}
                        onPress={handleOpenWhatsApp}
                        activeOpacity={0.85}
                      >
                        <View style={styles.whatsappIconCircle}>
                          <MessageCircle size={20} color="#FFFFFF" />
                        </View>
                        <View style={styles.whatsappInfoCol}>
                          <Text style={styles.whatsappBannerTitle}>Falar com Atendimento</Text>
                          <Text style={styles.whatsappBannerSubtitle}>Suporte direto via WhatsApp</Text>
                        </View>
                        <View style={styles.whatsappPillBtn}>
                          <Text style={styles.whatsappPillText}>Conversar</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* BOTTOM NAVIGATION TAB BAR WITH DYNAMIC ACTIVE ELEVATION */}
                  <View style={styles.bottomTabBarContainer}>
                    <View style={styles.bottomTabBar}>
                      {/* Tab 1: Contrato */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('PLANO')}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.tabIconWrapper, activeTab === 'PLANO' && [styles.activeTabElevatedIcon, { backgroundColor: primaryColor }]]}>
                          <FileText size={20} color={activeTab === 'PLANO' ? '#FFFFFF' : '#64748B'} />
                        </View>
                        <Text style={[styles.tabLabel, { color: activeTab === 'PLANO' ? primaryColor : '#64748B', fontWeight: activeTab === 'PLANO' ? '800' : '600' }]}>
                          Contrato
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 2: Financeiro */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('FINANCEIRO')}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.tabIconWrapper, activeTab === 'FINANCEIRO' && [styles.activeTabElevatedIcon, { backgroundColor: primaryColor }]]}>
                          <CreditCard size={20} color={activeTab === 'FINANCEIRO' ? '#FFFFFF' : '#64748B'} />
                        </View>
                        <Text style={[styles.tabLabel, { color: activeTab === 'FINANCEIRO' ? primaryColor : '#64748B', fontWeight: activeTab === 'FINANCEIRO' ? '800' : '600' }]}>
                          Financeiro
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 3: Início (Home in the Middle) */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={handleGoHome}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.tabIconWrapper, activeTab === 'HOME' && [styles.activeTabElevatedIcon, { backgroundColor: primaryColor }]]}>
                          <Home size={20} color={activeTab === 'HOME' ? '#FFFFFF' : '#64748B'} />
                        </View>
                        <Text style={[styles.tabLabel, { color: activeTab === 'HOME' ? primaryColor : '#64748B', fontWeight: activeTab === 'HOME' ? '800' : '600' }]}>
                          Início
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 4: Suporte */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('SUPORTE')}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.tabIconWrapper, activeTab === 'SUPORTE' && [styles.activeTabElevatedIcon, { backgroundColor: primaryColor }]]}>
                          <MessageSquare size={20} color={activeTab === 'SUPORTE' ? '#FFFFFF' : '#64748B'} />
                        </View>
                        <Text style={[styles.tabLabel, { color: activeTab === 'SUPORTE' ? primaryColor : '#64748B', fontWeight: activeTab === 'SUPORTE' ? '800' : '600' }]}>
                          Suporte
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 5: Conexão */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('TESTE')}
                        activeOpacity={0.8}
                      >
                        <View style={[styles.tabIconWrapper, activeTab === 'TESTE' && [styles.activeTabElevatedIcon, { backgroundColor: primaryColor }]]}>
                          <Activity size={20} color={activeTab === 'TESTE' ? '#FFFFFF' : '#64748B'} />
                        </View>
                        <Text style={[styles.tabLabel, { color: activeTab === 'TESTE' ? primaryColor : '#64748B', fontWeight: activeTab === 'TESTE' ? '800' : '600' }]}>
                          Conexão
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* PIX QR CODE POPUP MODAL */}
                  <Modal
                    visible={selectedPixCode !== null}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setSelectedPixCode(null)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={styles.modalContainer}>
                        <QrCode size={36} color="#2563EB" style={{ marginBottom: 12 }} />
                        <Text style={styles.modalTitle}>QR Code PIX</Text>
                        
                        <Text style={styles.modalInstructions}>
                          Aponte a câmera do aplicativo do seu banco para o código abaixo para pagar:
                        </Text>

                        {selectedPixCode ? (
                          <View style={styles.qrContainer}>
                            <Image
                              source={{
                                uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedPixCode)}`,
                              }}
                              style={styles.qrImage}
                              resizeMode="contain"
                            />
                          </View>
                        ) : null}

                        {selectedPixAmount ? (
                          <Text style={styles.modalPrice}>
                            Valor: {formatCurrency(selectedPixAmount)}
                          </Text>
                        ) : null}

                        <View style={styles.modalActionsRow}>
                          <TouchableOpacity
                            style={styles.modalCopyBtn}
                            onPress={() => {
                              if (selectedPixCode) {
                                Clipboard.setString(selectedPixCode);
                                alert('Código Pix Copia e Cola copiado!');
                              }
                            }}
                            activeOpacity={0.7}
                          >
                            <Copy size={14} color="#FFFFFF" />
                            <Text style={styles.modalCopyBtnText}>Copiar Código</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.modalCloseBtn}
                            onPress={() => setSelectedPixCode(null)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.modalCloseBtnText}>Fechar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Modal>

                  {/* CENTRAL DE NOTIFICAÇÕES POPUP MODAL */}
                  <Modal
                    visible={isNotificationModalOpen}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setIsNotificationModalOpen(false)}
                  >
                    <View style={styles.modalOverlay}>
                      <View style={[styles.modalContainer, { maxHeight: '80%', width: '90%', maxWidth: 420 }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Bell size={24} color="#2563EB" />
                            <Text style={styles.modalTitle}>Avisos & Notificações</Text>
                          </View>
                          <TouchableOpacity onPress={() => setIsNotificationModalOpen(false)} style={{ padding: 4 }}>
                            <X size={20} color="#94A3B8" />
                          </TouchableOpacity>
                        </View>

                        {loadingNotifications ? (
                          <View style={{ padding: 30, alignItems: 'center' }}>
                            <ActivityIndicator size="large" color="#2563EB" />
                            <Text style={{ color: '#94A3B8', marginTop: 12, fontSize: 13 }}>Buscando mensagens...</Text>
                          </View>
                        ) : notificationHistory.length === 0 ? (
                          <View style={{ padding: 30, alignItems: 'center' }}>
                            <Bell size={48} color="#28354E" style={{ marginBottom: 12 }} />
                            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Nenhum aviso no momento</Text>
                            <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 6 }}>
                              As notificações de faturas e comunicados enviados pelo seu provedor aparecerão aqui!
                            </Text>
                          </View>
                        ) : (
                          <ScrollView style={{ width: '100%', maxHeight: 350 }} showsVerticalScrollIndicator={false}>
                            {notificationHistory.map((item, idx) => (
                              <View key={item.id || idx} style={{ backgroundColor: '#182235', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1, borderColor: '#28354E' }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <Text style={{ color: '#60A5FA', fontWeight: '800', fontSize: 13 }}>{item.titulo || 'Aviso do Provedor 📡'}</Text>
                                  <Text style={{ color: '#64748B', fontSize: 10 }}>
                                    {item.created_at ? new Date(item.created_at).toLocaleDateString('pt-BR') : ''}
                                  </Text>
                                </View>
                                <Text style={{ color: '#E2E8F0', fontSize: 13, lineHeight: 18 }}>{item.mensagem}</Text>
                              </View>
                            ))}
                          </ScrollView>
                        )}

                        <TouchableOpacity
                          style={[styles.modalCloseBtn, { width: '100%', marginTop: 16 }]}
                          onPress={() => setIsNotificationModalOpen(false)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.modalCloseBtnText}>Fechar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Modal>

                </View>
              );
            } else {
              /* Cancelled View - Locks Account */
              return (
                <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                  <View style={styles.successCard}>
                    <ShieldCheck size={64} color="#EF4444" strokeWidth={2} style={{ alignSelf: 'center' }} />
                    
                    <Text style={styles.cancelledTitle}>
                      Contrato Cancelado
                    </Text>
                    
                    <Text style={styles.successGreeting}>
                      Olá, {firstName}!
                    </Text>

                    <View style={styles.cancelledMessageBox}>
                      <Text style={styles.cancelledMessageText}>
                        No momento você está com o contrato cancelado. Entre em contato com o provedor pelo WhatsApp (81) 98256-8282.
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.whatsappButton}
                      onPress={() => {
                        Linking.openURL('https://wa.me/5581982568282?text=Olá!%20Meu%20contrato%20consta%20como%20cancelado%20no%20app%20da%20WebConnect.');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.whatsappButtonText}>Falar no WhatsApp</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.backBtn, { marginTop: 10 }]}
                      onPress={handleLogout}
                    >
                      <Text style={styles.backBtnText}>
                        Voltar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              );
            }
          })()
        ) : (
          /* LOGIN and SELECT_CONTRACT States inside ScrollView container */
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            {screenState === 'LOGIN' && (
              <View style={styles.mainWrapper}>
                {/* TOP CONTAINER - Logo */}
                <View style={styles.topContainer}>
                  <BrandLogo logoUrl={providerConfig.logo_url} />
                </View>

                {/* CENTER CONTAINER - Form */}
                <View style={styles.centerContainer}>
                  <View style={styles.cardContainer}>
                    <View style={styles.welcomeContainer}>
                      <Text style={styles.welcomeTitle}>Área do Cliente</Text>
                    </View>

                    {/* Form Input Group */}
                    <View style={styles.formGroup}>
                      <Text style={styles.inputLabel}>
                        CPF ou CNPJ
                      </Text>
                      
                      <View
                        style={[
                          styles.inputContainer,
                          {
                            borderColor: errorMsg
                              ? '#EF4444'
                              : isFocused
                              ? primaryColor
                              : '#28354E',
                          },
                        ]}
                      >
                        <TextInput
                          style={styles.textInput}
                          placeholder="CPF ou CNPJ"
                          placeholderTextColor="#64748B"
                          keyboardType="numeric"
                          value={documentInput}
                          onChangeText={handleInputChange}
                          onFocus={() => setIsFocused(true)}
                          onBlur={() => setIsFocused(false)}
                          editable={!loading}
                          maxLength={18}
                        />
                      </View>

                      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
                      
                      {!errorMsg && documentInput.length > 0 && !isValid && (
                        <Text style={styles.warningText}>
                          Detectado: {detectedType} (aguardando documento válido...)
                        </Text>
                      )}

                      {!errorMsg && isValid && (
                        <Text style={styles.successValidationText}>
                          ✓ {detectedType} válido e pronto para acessar!
                        </Text>
                      )}
                    </View>

                    {/* Manter-me conectado Checkbox */}
                    <TouchableOpacity
                      style={styles.rememberMeContainer}
                      onPress={() => setRememberMe(!rememberMe)}
                      activeOpacity={0.7}
                    >
                      {rememberMe ? (
                        <CheckSquare size={18} color={primaryColor} />
                      ) : (
                        <Square size={18} color="#64748B" />
                      )}
                      <Text style={styles.rememberMeText}>Manter-me conectado</Text>
                    </TouchableOpacity>

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        {
                          backgroundColor: primaryColor,
                          opacity: isValid && !loading ? 1 : 0.5,
                        },
                      ]}
                      onPress={handleLogin}
                      disabled={!isValid || loading}
                      activeOpacity={0.8}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <View style={styles.submitBtnContent}>
                          <Text style={styles.submitBtnText}>Entrar</Text>
                          <ArrowRight size={18} color="#FFFFFF" style={styles.btnIcon} />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* BOTTOM CONTAINER - Footer */}
                <View style={styles.bottomContainer}>
                  <View style={styles.footer}>
                    <ShieldCheck size={14} color="#64748B" />
                    <Text style={styles.footerText}>
                      WebConnect App v1.0.0 • Conexão Segura
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {screenState === 'SELECT_CONTRACT' && (
              <View style={styles.mainWrapper}>
                
                {/* TOP CONTAINER - Logo */}
                <View style={styles.topContainer}>
                  <BrandLogo logoUrl={providerConfig.logo_url} />
                </View>

                {/* CENTER CONTAINER - Selection Card list */}
                <View style={styles.centerContainer}>
                  <View style={styles.cardContainer}>
                    <View style={styles.welcomeContainer}>
                      <Text style={styles.welcomeTitle}>Selecione o Contrato</Text>
                      <Text style={styles.welcomeSubtitle}>
                        Identificamos mais de um plano ativo no seu documento. Escolha qual deseja acessar:
                      </Text>
                    </View>

                    {/* Contracts List */}
                    {contracts.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.contractItemCard}
                        onPress={() => handleContractSelect(item)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.contractCardHeader}>
                          <View style={styles.contractIconBackground}>
                            <Wifi size={20} color="#2563EB" />
                          </View>
                          <View style={styles.contractMainInfo}>
                            <Text style={styles.contractPlanTitle}>{String(item.planName || '').toUpperCase()}</Text>
                            <Text style={styles.contractIdText}>Contrato #{item.id}</Text>
                          </View>
                          <View style={[
                            styles.statusBadge, 
                            { backgroundColor: item.status.toLowerCase() === 'ativo' ? '#10B98120' : '#EF444420' }
                          ]}>
                            <Text style={[
                              styles.statusBadgeText,
                              { color: item.status.toLowerCase() === 'ativo' ? '#10B981' : '#EF4444' }
                            ]}>
                              {item.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.contractAddressRow}>
                          <MapPin size={14} color="#64748B" style={styles.addressIcon} />
                          <Text style={styles.contractAddressText} numberOfLines={2}>
                            {item.address}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}

                    {/* Back button */}
                    <TouchableOpacity
                      style={styles.backToLoginButton}
                      onPress={() => setScreenState('LOGIN')}
                      activeOpacity={0.7}
                    >
                      <ArrowLeft size={16} color="#FFFFFF" />
                      <Text style={styles.backToLoginText}>Voltar para o Login</Text>
                    </TouchableOpacity>

                  </View>
                </View>

                {/* BOTTOM CONTAINER - Footer */}
                <View style={styles.bottomContainer}>
                  <View style={styles.footer}>
                    <ShieldCheck size={14} color="#64748B" />
                    <Text style={styles.footerText}>
                      WebConnect App v1.0.0 • Conexão Segura
                    </Text>
                  </View>
                </View>

              </View>
            )}

          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#080B11', // Almost-black dark Obsidian tone
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#080B11',
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    minHeight: Platform.OS === 'ios' ? '92%' : '95%',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  topContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 10 : 5,
  },
  centerContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },
  bottomContainer: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 10 : 5,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    color: '#94A3B8',
    lineHeight: 18,
    paddingHorizontal: 15,
  },
  formGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#94A3B8',
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 46,
    justifyContent: 'center',
    backgroundColor: '#111625', // Slate Obsidian card background
    borderColor: '#28354E',
  },
  textInput: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#FFFFFF',
    padding: 0,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    color: '#94A3B8',
  },
  successValidationText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    color: '#10B981',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  rememberMeText: {
    color: '#94A3B8',
    fontSize: 13,
    marginLeft: 8,
    fontWeight: '500',
  },
  suspendedWarningCard: {
    width: '100%',
    backgroundColor: '#1E1015',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  suspendedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  suspendedIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EF444420',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EF444440',
  },
  suspendedHeaderCol: {
    flex: 1,
  },
  suspendedTitle: {
    color: '#EF4444',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  suspendedSubtitle: {
    color: '#F87171',
    fontSize: 12,
    marginTop: 2,
  },
  suspendedDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  trustUnlockBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  trustUnlockBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustUnlockBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  whatsappFloatingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 102 : 92,
    left: 16,
    right: 16,
    zIndex: 99,
  },

  bottomTabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#0F172A', // Dark navbar background
    borderTopWidth: 1.5,
    borderTopColor: '#1E293B',
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
  },
  bottomTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 58,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabElevatedIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    marginTop: -22, // Elevates the active button dynamically!
    borderWidth: 3,
    borderColor: '#0F172A',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.1,
  },
  whatsappBanner: {
    backgroundColor: '#111625',
    borderWidth: 1.5,
    borderColor: '#25D36640',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  whatsappIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  whatsappInfoCol: {
    flex: 1,
  },
  whatsappBannerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  whatsappBannerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  whatsappPillBtn: {
    backgroundColor: '#25D36615',
    borderWidth: 1,
    borderColor: '#25D366',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  whatsappPillText: {
    color: '#25D366',
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
  },
  submitBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btnIcon: {
    marginLeft: 8,
  },
  contractItemCard: {
    backgroundColor: '#111625', // Slate Obsidian
    borderWidth: 1.5,
    borderColor: '#28354E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  contractCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contractIconBackground: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#2563EB15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contractMainInfo: {
    flex: 1,
  },
  contractPlanTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  contractIdText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  contractAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#28354E',
  },
  addressIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  contractAddressText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  backToLoginButton: {
    height: 46,
    borderWidth: 1.5,
    borderColor: '#28354E',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
    backgroundColor: '#111625',
  },
  backToLoginText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successCard: {
    width: '90%',
    maxWidth: 450,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#28354E',
    borderRadius: 24,
    padding: 32,
    backgroundColor: '#111625',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
    marginTop: 40,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 4,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  successGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 20,
  },
  selectedContractBox: {
    width: '100%',
    backgroundColor: '#080B1130',
    borderWidth: 1,
    borderColor: '#28354E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  selectedContractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  selectedContractPlan: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  selectedContractId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  selectedContractAddress: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 10,
    color: '#94A3B8',
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: '#28354E',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#161F30',
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  innerCard: {
    width: '100%',
    alignItems: 'stretch',
  },
  cancelledTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 4,
    textAlign: 'center',
    color: '#EF4444',
  },
  cancelledMessageBox: {
    width: '100%',
    backgroundColor: '#EF444410',
    borderWidth: 1.5,
    borderColor: '#EF444430',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  cancelledMessageText: {
    fontSize: 14,
    color: '#F87171',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  whatsappButton: {
    height: 46,
    width: '100%',
    backgroundColor: '#25D366',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 8,
    marginBottom: 8,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* DASHBOARD STYLES */
  dashboardWrapper: {
    flex: 1,
    backgroundColor: '#080B11',
  },
  dashboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 16 : 20,
    paddingBottom: 10,
    backgroundColor: '#080B11', // Flat borderless header integrated with background
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  headerGreetingCol: {
    justifyContent: 'center',
  },
  headerGreeting: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerMetaText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#28354E',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111625',
  },
  unreadBadgeDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#111625',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#161F30',
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111625',
    borderWidth: 1.2,
    borderColor: '#28354E',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexShrink: 1,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  statusBadgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#10B98130',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dashboardScroll: {
    flex: 1,
  },
  dashboardContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 200, // Extra bottom padding for floating WhatsApp banner & elevated menu bar
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  tabContentCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111625', // Slate obsidian content cards
    borderWidth: 1.5,
    borderColor: '#28354E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  tabContentIcon: {
    marginBottom: 16,
  },
  tabContentTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tabContentDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },


  /* PLAN TAB STYLES */
  planoTabWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  infoCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111625',
    borderWidth: 1.5,
    borderColor: '#28354E',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
    paddingBottom: 8,
  },
  infoCardHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planoMainTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copyIconBtn: {
    padding: 4,
    marginLeft: 4,
  },

  /* FINANCEIRO TAB STYLES */
  financeiroTabWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111625',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderLeftWidth: 4, // Left accent line
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
    paddingBottom: 10,
    marginBottom: 12,
  },
  billMeta: {
    justifyContent: 'center',
  },
  billDueLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  billDueDate: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  billStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  billStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  billPriceRow: {
    marginBottom: 16,
  },
  billPriceLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  billPriceValue: {
    fontSize: 22,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  billActionsContainer: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  actionPillSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#28354E',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionPillSecondaryText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  noBillsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  noBillsDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 2,
  },
  paidBillCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111625',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981', // Green left accent
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  paidBillMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paidBillInfo: {
    justifyContent: 'center',
  },
  paidBillTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  paidBillSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  paidBillDate: {
    fontSize: 11,
    color: '#10B981',
    marginTop: 2,
    fontWeight: '700',
  },
  paidRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paidBadge: {
    backgroundColor: '#10B98115',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  paidBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  paidPdfCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#28354E',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* CONEXAO DETAILS STYLES */
  connectionStatusContainer: {
    width: '100%',
  },
  totalConsumptionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  consumptionBox: {
    flex: 1,
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#28354E',
    borderRadius: 12,
    padding: 12,
  },
  consumptionBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  consumptionBoxValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  /* SPEEDTEST WEBVIEW STYLES */
  speedtestWebviewCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111625',
    borderWidth: 1.5,
    borderColor: '#28354E',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  webviewWrapper: {
    height: 380,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#28354E',
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  webviewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },

  /* SUPPORT FORM & TICKETS STYLES */
  formGroup: {
    width: '100%',
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  formInput: {
    width: '100%',
    height: 40,
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#28354E',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  formInputTextArea: {
    height: 80,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  dropdownSelector: {
    width: '100%',
    height: 44,
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#28354E',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  dropdownSelectorText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dropdownMenu: {
    width: '100%',
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#28354E',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#202B3E',
  },
  dropdownItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  dropdownItemTextActive: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  motiveChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  motiveChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#161F30',
    borderWidth: 1,
    borderColor: '#28354E',
  },
  motiveChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  motiveChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  motiveChipTextActive: {
    color: '#FFFFFF',
  },
  ticketCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111625',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#161F30',
    paddingBottom: 8,
    marginBottom: 8,
  },
  ticketTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ticketStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  ticketTypeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ticketBody: {
    width: '100%',
  },
  ticketProtocolText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  ticketDateText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  ticketContentBox: {
    backgroundColor: '#161F30',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  ticketContentText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 16,
  },
  osDetailsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#161F30',
    paddingTop: 8,
    marginTop: 8,
  },
  osDetailsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  osDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  osDetailsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  osDetailsStatus: {
    fontSize: 11,
    fontWeight: '800',
  },

  supportSubmitBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 12,
  },
  supportSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8, 11, 17, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#111625',
    borderWidth: 1.5,
    borderColor: '#28354E',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalInstructions: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  modalPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  modalCopyBtn: {
    flex: 1,
    height: 40,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalCopyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalCloseBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1.5,
    borderColor: '#28354E',
    backgroundColor: '#161F30',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
