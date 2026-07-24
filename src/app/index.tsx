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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react-native';
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

export default function LoginScreen() {
  const [documentInput, setDocumentInput] = useState('');
  const [detectedType, setDetectedType] = useState<'CPF' | 'CNPJ'>('CPF');
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    // Simulates an API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {!success ? (
            <View style={styles.cardContainer}>
              <BrandLogo />

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
                        : '#334155',
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
          ) : (
            /* Success View Mock */
            <View style={styles.successCard}>
              <CheckCircle size={64} color="#10B981" strokeWidth={2} />
              
              <Text style={styles.successTitle}>
                Acesso Autorizado!
              </Text>
              
              <Text style={styles.successSubtitle}>
                Buscando os dados do seu plano WebConnect...
              </Text>

              <ActivityIndicator size="small" color="#0052FF" style={{ marginVertical: 15 }} />

              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  setSuccess(false);
                  setDocumentInput('');
                  setIsValid(false);
                }}
              >
                <Text style={styles.backBtnText}>
                  Sair
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* App Footer Info */}
          <View style={styles.footer}>
            <ShieldCheck size={14} color="#64748B" />
            <Text style={styles.footerText}>
              WebConnect App v1.0.0 • Conexão Segura
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
    backgroundColor: '#000000',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#000000',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
    marginTop: 20,
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
    height: 46, // reduced from 54
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  textInput: {
    fontSize: 15, // reduced from 16
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
    height: 46, // reduced from 52
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
  successCard: {
    width: '100%',
    maxWidth: 450,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#0F172A',
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
    marginBottom: 10,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    color: '#94A3B8',
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: '#334155',
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
    color: '#FFFFFF',
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
    color: '#64748B',
  },
});
