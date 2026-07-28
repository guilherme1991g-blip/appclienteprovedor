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
  Activity,
  LogOut,
  Eye,
  EyeOff,
  Copy,
  AlertTriangle,
  ExternalLink,
  QrCode,
} from 'lucide-react-native';
import BrandLogo from '@/components/BrandLogo';

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

// Helper to format currency
function formatCurrency(val: number | string): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return 'R$ 0,00';
  return `R$ ${num.toFixed(2).replace('.', ',')}`;
}

interface ContractDisplay {
  id: number;
  planName: string;
  address: string;
  status: string;
  clientName: string;
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
type TabName = 'PLANO' | 'FINANCEIRO' | 'HOME' | 'SUPORTE' | 'TESTE';

export default function LoginScreen() {
  const [documentInput, setDocumentInput] = useState('');
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

  // Pix Modal States
  const [selectedPixCode, setSelectedPixCode] = useState<string | null>(null);
  const [selectedPixAmount, setSelectedPixAmount] = useState<string | number | null>(null);

  // Toggle Visibility for passwords
  const [showPppoePassword, setShowPppoePassword] = useState(false);
  const [showWifiPassword, setShowWifiPassword] = useState(false);

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
    fetch('https://webcnnect.sgp.tsmx.com.br/api/ura/clientes/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app: 'App',
        token: '9720002b-a4f6-4c48-9a20-65f86669f6d6',
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
          } else if (validContracts.length === 1) {
            // If customer has exactly 1 valid contract, log in immediately
            setSelectedContract(validContracts[0]);
            setActiveTab('HOME');
            setScreenState('DASHBOARD');
          } else if (validContracts.length > 1) {
            // If customer has multiple valid contracts, show only the valid ones
            setContracts(validContracts);
            setScreenState('SELECT_CONTRACT');
          } else {
            // If customer has only invalid contracts, select the first one to show the "Contrato Cancelado" screen
            setSelectedContract(invalidContracts[0]);
            setScreenState('DASHBOARD');
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
    setSelectedContract(contract);
    setActiveTab('HOME');
    setScreenState('DASHBOARD');
  };

  const handleLogout = () => {
    setScreenState('LOGIN');
    setDocumentInput('');
    setIsValid(false);
    setSelectedContract(null);
    setContracts([]);
    setAllTitulos([]);
    setSelectedPixCode(null);
    setSelectedPixAmount(null);
    setShowPppoePassword(false);
    setShowWifiPassword(false);
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
                    <TouchableOpacity
                      style={styles.logoutButton}
                      onPress={handleLogout}
                      activeOpacity={0.7}
                    >
                      <LogOut size={16} color="#EF4444" />
                    </TouchableOpacity>
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
                      <View style={styles.tabContentCard}>
                        <Home size={32} color="#2563EB" style={styles.tabContentIcon} />
                        <Text style={styles.tabContentTitle}>Início</Text>
                        <Text style={styles.tabContentDesc}>
                          Bem-vindo à Central do Cliente WebConnect. Use o menu abaixo para navegar pelo seu aplicativo.
                        </Text>
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
                                        alert('Chave Pix Copia e Cola copiada com sucesso!');
                                      }}
                                      activeOpacity={0.7}
                                    >
                                      <Copy size={12} color="#FFFFFF" />
                                      <Text style={styles.actionPillText}>Copiar PIX</Text>
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

                      </View>
                    )}

                    {activeTab === 'SUPORTE' && (
                      <View style={styles.tabContentCard}>
                        <MessageSquare size={32} color="#2563EB" style={styles.tabContentIcon} />
                        <Text style={styles.tabContentTitle}>Suporte Técnico</Text>
                        <Text style={styles.tabContentDesc}>
                          Abra chamados para suporte de conexão lenta, queda de sinal ou solicitações de visitas técnicas.
                        </Text>
                      </View>
                    )}

                    {activeTab === 'TESTE' && (
                      <View style={styles.tabContentCard}>
                        <Activity size={32} color="#2563EB" style={styles.tabContentIcon} />
                        <Text style={styles.tabContentTitle}>Teste de Velocidade</Text>
                        <Text style={styles.tabContentDesc}>
                          Inicie o diagnóstico em tempo real da latência (ping), velocidade de download e integridade de sua conexão.
                        </Text>
                      </View>
                    )}
                  </ScrollView>

                  {/* BOTTOM NAVIGATION TAB BAR (Floating capsule with shadows) */}
                  <View style={styles.bottomTabBarContainer}>
                    <View style={styles.bottomTabBar}>
                      {/* Tab 1: Plano */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('PLANO')}
                        activeOpacity={0.7}
                      >
                        <FileText size={18} color={activeTab === 'PLANO' ? '#2563EB' : '#64748B'} />
                        <Text style={[styles.tabLabel, { color: activeTab === 'PLANO' ? '#2563EB' : '#64748B' }]}>
                          Plano
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 2: Financeiro */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('FINANCEIRO')}
                        activeOpacity={0.7}
                      >
                        <CreditCard size={18} color={activeTab === 'FINANCEIRO' ? '#2563EB' : '#64748B'} />
                        <Text style={[styles.tabLabel, { color: activeTab === 'FINANCEIRO' ? '#2563EB' : '#64748B' }]}>
                          Financeiro
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 3: Home (Floating central button, raised layout) */}
                      <View style={styles.floatingHomeButtonContainer}>
                        <TouchableOpacity
                          style={[
                            styles.floatingHomeButton,
                            { backgroundColor: activeTab === 'HOME' ? '#2563EB' : '#1E293B' }
                          ]}
                          onPress={() => setActiveTab('HOME')}
                          activeOpacity={0.8}
                        >
                          <Home size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={[styles.tabLabel, { marginTop: 2, color: activeTab === 'HOME' ? '#2563EB' : '#64748B' }]}>
                          Home
                        </Text>
                      </View>

                      {/* Tab 4: Suporte */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('SUPORTE')}
                        activeOpacity={0.7}
                      >
                        <MessageSquare size={18} color={activeTab === 'SUPORTE' ? '#2563EB' : '#64748B'} />
                        <Text style={[styles.tabLabel, { color: activeTab === 'SUPORTE' ? '#2563EB' : '#64748B' }]}>
                          Suporte
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 5: Teste de Conexão */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('TESTE')}
                        activeOpacity={0.7}
                      >
                        <Activity size={18} color={activeTab === 'TESTE' ? '#2563EB' : '#64748B'} />
                        <Text style={[styles.tabLabel, { color: activeTab === 'TESTE' ? '#2563EB' : '#64748B' }]}>
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
                  <BrandLogo />
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
                              ? '#2563EB'
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

                    {/* Submit Button */}
                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        {
                          backgroundColor: '#2563EB',
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
                  <BrandLogo />
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
    paddingBottom: 120, // Give extra bottom space to prevent items hidden behind floating bar
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
  bottomTabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16, // floating offsets
    left: 16,
    right: 16,
    zIndex: 100,
  },
  bottomTabBar: {
    backgroundColor: '#111625', // Floating Slate obsidian capsule
    borderWidth: 1.5,
    borderColor: '#28354E',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 64,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  floatingHomeButtonContainer: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingHomeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32, // Floating height offset
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#080B11', // Outer border to blend floating effect
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
