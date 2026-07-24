import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Wifi } from 'lucide-react-native';
import { Colors } from '@/constants/theme';

export default function BrandLogo() {
  const scheme = useColorScheme() ?? 'light';
  const currentScheme = scheme === 'unspecified' ? 'light' : scheme;
  const colors = Colors[currentScheme];

  return (
    <View style={styles.container}>
      <View style={[styles.glowRing, { borderColor: colors.primary + '33' }]} />
      <View style={[styles.glowRingOuter, { borderColor: colors.primary + '11' }]} />
      
      <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
        <Wifi size={40} color="#FFFFFF" strokeWidth={2.5} />
      </View>
      
      <Text style={[styles.brandName, { color: colors.text }]}>
        Ultra<Text style={{ color: colors.primary }}>Fibra</Text>
      </Text>
      <Text style={[styles.tagline, { color: colors.textSecondary }]}>
        CONEXÃO DE ALTA VELOCIDADE
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0052FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    zIndex: 2,
  },
  glowRing: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 32,
    borderWidth: 1.5,
    zIndex: 1,
  },
  glowRingOuter: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 40,
    borderWidth: 1,
    zIndex: 0,
  },
  brandName: {
    fontSize: 32,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 2,
  },
});
