import React, { useState, useEffect } from 'react';
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
  useColorScheme,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, HelpCircle, CheckCircle, Smartphone } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
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

// Applies input masks dynamically
function formatDocument(value: string, type: 'CPF' | 'CNPJ'): string {
  const cleanValue = value.replace(/\D/g, '');
  if (type === 'CPF') {
    // Mask: 000.000.000-00
    return cleanValue
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  } else {
    // Mask: 00.000.000/0000-00
    return cleanValue
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .substring(0, 18);
  }
}

export default function LoginScreen() {
  const scheme = useColorScheme() ?? 'light';
  const currentScheme = scheme === 'unspecified' ? 'light' : scheme;
  const colors = Colors[currentScheme];

  const [loginType, setLoginType] = useState<'CPF' | 'CNPJ'>('CPF');
  const [documentInput, setDocumentInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Triggered when switching login types
  const handleTypeChange = (type: 'CPF' | 'CNPJ') => {
    setLoginType(type);
    setDocumentInput('');
    setErrorMsg('');
    setIsValid(false);
  };

  // Validate on input change
  const handleInputChange = (text: string) => {
    const formatted = formatDocument(text, loginType);
    setDocumentInput(formatted);
    setErrorMsg('');

    const raw = formatted.replace(/\D/g, '');
    if (loginType === 'CPF') {
      setIsValid(raw.length === 11 && validateCPF(raw));
    } else {
      setIsValid(raw.length === 14 && validateCNPJ(raw));
    }
  };

  const handleLogin = () => {
    const raw = documentInput.replace(/\D/g, '');
    if (loginType === 'CPF' && !validateCPF(raw)) {
      setErrorMsg('CPF inválido. Por favor, verifique os números.');
      return;
    }
    if (loginType === 'CNPJ' && !validateCNPJ(raw)) {
      setErrorMsg('CNPJ inválido. Por favor, verifique os números.');
      return;
    }

    setLoading(true);
    // Mock API authentication call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  const handleSupportPress = () => {
    Linking.openURL('https://wa.me/558000000000?text=Preciso%20de%20ajuda%20para%20acessar%20a%20minha%20conta');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {!success ? (
            <View style={styles.cardContainer}>
              <BrandLogo />

              <View style={styles.welcomeContainer}>
                <Text style={[styles.welcomeTitle, { color: colors.text }]}>Área do Cliente</Text>
                <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                  Digite seu documento para acessar faturas, suporte e plano.
                </Text>
              </View>

              {/* Toggle Tab Selector */}
              <View style={[styles.toggleContainer, { backgroundColor: colors.border }]}>
                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    loginType === 'CPF' && [styles.toggleActiveBtn, { backgroundColor: colors.backgroundElement }],
                  ]}
                  onPress={() => handleTypeChange('CPF')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: loginType === 'CPF' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Pessoa Física (CPF)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.toggleBtn,
                    loginType === 'CNPJ' && [styles.toggleActiveBtn, { backgroundColor: colors.backgroundElement }],
                  ]}
                  onPress={() => handleTypeChange('CNPJ')}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.toggleText,
                      { color: loginType === 'CNPJ' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    Empresa (CNPJ)
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Input Group */}
              <View style={styles.formGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {loginType === 'CPF' ? 'CPF do Titular' : 'CNPJ da Empresa'}
                </Text>
                
                <View
                  style={[
                    styles.inputContainer,
                    {
                      borderColor: errorMsg
                        ? '#EF4444'
                        : isFocused
                        ? colors.primary
                        : colors.border,
                      backgroundColor: colors.backgroundElement,
                    },
                  ]}
                >
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    placeholder={loginType === 'CPF' ? '000.000.000-00' : '00.000.000/0000-00'}
                    placeholderTextColor={colors.textSecondary + '80'}
                    keyboardType="numeric"
                    value={documentInput}
                    onChangeText={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    editable={!loading}
                    maxLength={loginType === 'CPF' ? 14 : 18}
                  />
                </View>

                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
                
                {!errorMsg && documentInput.length > 0 && !isValid && (
                  <Text style={[styles.warningText, { color: colors.textSecondary }]}>
                    Aguardando documento completo e válido...
                  </Text>
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isValid && !loading ? 1 : 0.6,
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
                    <Text style={styles.submitBtnText}>Acessar Minha Conta</Text>
                    <ArrowRight size={18} color="#FFFFFF" style={styles.btnIcon} />
                  </View>
                )}
              </TouchableOpacity>

              {/* Helpful tips section */}
              <TouchableOpacity
                onPress={handleSupportPress}
                style={styles.supportLink}
                activeOpacity={0.7}
              >
                <HelpCircle size={16} color={colors.primary} />
                <Text style={[styles.supportLinkText, { color: colors.primary }]}>
                  Dificuldades no acesso? Fale conosco
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Success View Mock */
            <View style={[styles.successCard, { backgroundColor: colors.backgroundElement, borderColor: colors.border }]}>
              <CheckCircle size={64} color={colors.accent} strokeWidth={2} />
              
              <Text style={[styles.successTitle, { color: colors.text }]}>
                Acesso Autorizado!
              </Text>
              
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                Olá! Identificamos o seu contrato. Estamos carregando as informações da sua banda larga e faturas...
              </Text>

              <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 15 }} />

              <TouchableOpacity
                style={[styles.backBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setSuccess(false);
                  setDocumentInput('');
                  setIsValid(false);
                }}
              >
                <Text style={[styles.backBtnText, { color: colors.text }]}>
                  Voltar para o Login
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* App Footer Info */}
          <View style={styles.footer}>
            <Smartphone size={14} color={colors.textSecondary} />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              UltraFibra App v1.0.0 • Conexão Segura SSL
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActiveBtn: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  formGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
    padding: 0, // clears default padding Android/iOS
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
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0052FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
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
  supportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  supportLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  successCard: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  backBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
