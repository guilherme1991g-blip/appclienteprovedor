import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface BrandLogoProps {
  logoUrl?: string;
}

const CACHE_KEY = '@isp_app_cached_logo_url';

export default function BrandLogo({ logoUrl }: BrandLogoProps) {
  const [activeLogo, setActiveLogo] = useState<string | undefined>(logoUrl);

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
      <Image
        key={hasLogo ? effectiveLogo : 'default_logo'}
        style={styles.logoImage}
        source={getLogoSource()}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  logoImage: {
    width: 280,
    height: 100,
    backgroundColor: 'transparent',
  },
});
