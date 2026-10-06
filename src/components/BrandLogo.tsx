import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import { APP_CONFIG } from '@/config/providerConfig';

interface BrandLogoProps {
  logoUrl?: string;
}

const PROVIDER_LOGOS: Record<string, any> = {
  cbrfibra: require('@/assets/providers/cbrfibra/logo.png'),
  webconnect: require('@/assets/providers/webconnect/logo.png'),
  default: require('@/assets/providers/default/logo.png'),
};

export default function BrandLogo({ logoUrl }: BrandLogoProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation: smooth interactive breathing effect
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  const providerCode = (APP_CONFIG.PROVIDER_CODE || 'cbrfibra').toLowerCase();

  const getLogoSource = () => {
    if (PROVIDER_LOGOS[providerCode]) {
      return PROVIDER_LOGOS[providerCode];
    }
    if (logoUrl && logoUrl.trim().length > 0) {
      const clean = logoUrl.trim();
      if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image')) {
        return { uri: clean };
      }
      return { uri: `data:image/png;base64,${clean}` };
    }
    return PROVIDER_LOGOS.default;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Image
          key={providerCode}
          style={styles.logoImage}
          source={getLogoSource()}
          contentFit="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  logoImage: {
    width: 320,
    height: 150,
    backgroundColor: 'transparent',
  },
});
