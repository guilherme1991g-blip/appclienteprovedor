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

interface ContractDisplay {
  id: number;
  planName: string;
  address: string;
  status: string;
  clientName: string;
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
          
          const clientsList = data.clientes || [];
          clientsList.forEach((client: any) => {
            const contractsList = client.contratos || [];
            contractsList.forEach((contrato: any) => {
              // Extract plan name from services list
              let planName = 'Plano de Internet';
              if (contrato.servicos && Array.isArray(contrato.servicos) && contrato.servicos.length > 0) {
                const serv = contrato.servicos[0];
                if (serv.plano) {
                  if (typeof serv.plano === 'object') {
                    planName = serv.plano.descricao || serv.plano.nome || serv.plano.description || 'Plano de Internet';
                  } else if (typeof serv.plano === 'string') {
                    planName = serv.plano;
                  }
                }
              }
              
              // Extract and format address
              let addressStr = '';
              const addr = contrato.endereco || client.endereco;
              if (addr) {
                if (typeof addr === 'object') {
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
              });
            });
          });

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
                      <Wifi size={12} color="#0052FF" style={{ marginRight: 5 }} />
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
                        <Home size={32} color="#0052FF" style={styles.tabContentIcon} />
                        <Text style={styles.tabContentTitle}>Início</Text>
                        <Text style={styles.tabContentDesc}>
                          Bem-vindo à Central do Cliente WebConnect. Use o menu abaixo para navegar pelo seu aplicativo.
                        </Text>
                      </View>
                    )}

                    {activeTab === 'PLANO' && (
                      <View style={styles.tabContentCard}>
                        <FileText size={32} color="#0052FF" style={styles.tabContentIcon} />
                        <Text style={styles.tabContentTitle}>Meu Plano</Text>
                        <Text style={styles.tabContentDesc}>
                          Informações detalhadas sobre a velocidade contratada, taxas de upload/download e dados do serviço de internet.
                        </Text>
                      </View>
                    )}

                    {activeTab === 'FINANCEIRO' && (
                      <View style={styles.tabContentCard}>
                        <CreditCard size={32} color="#0052FF" style={styles.tabContentIcon} />
                        <Text style={styles.tabContentTitle}>Financeiro</Text>
                        <Text style={styles.tabContentDesc}>
                          Gerencie suas faturas, visualize códigos de barras para pagamento, boleto PDF e chaves Pix copia e cola.
                        </Text>
                      </View>
                    )}

                    {activeTab === 'SUPORTE' && (
                      <View style={styles.tabContentCard}>
                        <MessageSquare size={32} color="#0052FF" style={styles.tabContentIcon} />
                        <Text style={styles.tabContentTitle}>Suporte Técnico</Text>
                        <Text style={styles.tabContentDesc}>
                          Abra chamados para suporte de conexão lenta, queda de sinal ou solicitações de visitas técnicas.
                        </Text>
                      </View>
                    )}

                    {activeTab === 'TESTE' && (
                      <View style={styles.tabContentCard}>
                        <Activity size={32} color="#0052FF" style={styles.tabContentIcon} />
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
                        <FileText size={18} color={activeTab === 'PLANO' ? '#0052FF' : '#64748B'} />
                        <Text style={[styles.tabLabel, { color: activeTab === 'PLANO' ? '#0052FF' : '#64748B' }]}>
                          Plano
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 2: Financeiro */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('FINANCEIRO')}
                        activeOpacity={0.7}
                      >
                        <CreditCard size={18} color={activeTab === 'FINANCEIRO' ? '#0052FF' : '#64748B'} />
                        <Text style={[styles.tabLabel, { color: activeTab === 'FINANCEIRO' ? '#0052FF' : '#64748B' }]}>
                          Financeiro
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 3: Home (Floating central button, raised layout) */}
                      <View style={styles.floatingHomeButtonContainer}>
                        <TouchableOpacity
                          style={[
                            styles.floatingHomeButton,
                            { backgroundColor: activeTab === 'HOME' ? '#0052FF' : '#1E293B' }
                          ]}
                          onPress={() => setActiveTab('HOME')}
                          activeOpacity={0.8}
                        >
                          <Home size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        <Text style={[styles.tabLabel, { marginTop: 2, color: activeTab === 'HOME' ? '#0052FF' : '#64748B' }]}>
                          Home
                        </Text>
                      </View>

                      {/* Tab 4: Suporte */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('SUPORTE')}
                        activeOpacity={0.7}
                      >
                        <MessageSquare size={18} color={activeTab === 'SUPORTE' ? '#0052FF' : '#64748B'} />
                        <Text style={[styles.tabLabel, { color: activeTab === 'SUPORTE' ? '#0052FF' : '#64748B' }]}>
                          Suporte
                        </Text>
                      </TouchableOpacity>

                      {/* Tab 5: Teste de Conexão */}
                      <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => setActiveTab('TESTE')}
                        activeOpacity={0.7}
                      >
                        <Activity size={18} color={activeTab === 'TESTE' ? '#0052FF' : '#64748B'} />
                        <Text style={[styles.tabLabel, { color: activeTab === 'TESTE' ? '#0052FF' : '#64748B' }]}>
                          Conexão
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

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
                              ? '#0052FF'
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
                          backgroundColor: '#0052FF',
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
                            <Wifi size={20} color="#0052FF" />
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
    shadowColor: '#0052FF',
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
    backgroundColor: '#0052FF15',
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
    backgroundColor: '#0052FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#0052FF',
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
    paddingTop: 30,
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
    shadowColor: '#0052FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 3,
    borderColor: '#080B11', // Outer border to blend floating effect
  },
});
