import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BrandLogoProps {
  logoUrl?: string;
}

const CACHE_KEY = '@isp_app_cached_logo_url';

export default function BrandLogo({ logoUrl }: BrandLogoProps) {
  const [activeLogo, setActiveLogo] = useState<string | undefined>(logoUrl);
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

  useEffect(() => {
    if (logoUrl && logoUrl.trim().length > 0) {
      setActiveLogo(logoUrl);
    }
  }, [logoUrl]);

  useEffect(() => {
    const syncLogo = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (logoUrl && logoUrl.trim().length > 0) {
          const cleanUrl = logoUrl.trim();
          if (cached !== cleanUrl) {
            // A logo mudou no Supabase! Atualiza o cache local
            await AsyncStorage.setItem(CACHE_KEY, cleanUrl);
            setActiveLogo(cleanUrl);
          } else {
            setActiveLogo(cached);
          }
        } else if (cached && cached.trim().length > 0) {
          setActiveLogo(cached);
        }
      } catch (e) {
        console.log('Erro ao sincronizar logo:', e);
      }
    };
    syncLogo();
  }, [logoUrl]);

  const effectiveLogo = activeLogo || logoUrl;
  const hasLogo = Boolean(effectiveLogo && effectiveLogo.trim().length > 0);

  const getLogoSource = () => {
    if (!hasLogo || !effectiveLogo) {
      return require('@/assets/images/login_logo.png');
    }
    const clean = effectiveLogo.trim();
    if (clean.startsWith('http://') || clean.startsWith('https://') || clean.startsWith('data:image')) {
      return { uri: clean };
    }
    return { uri: `data:image/png;base64,${clean}` };
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <Image
          key={hasLogo ? effectiveLogo : 'default_logo'}
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
