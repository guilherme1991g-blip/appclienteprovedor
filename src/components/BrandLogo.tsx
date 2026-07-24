import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Image } from 'expo-image';

export default function BrandLogo() {
  return (
    <View style={styles.container}>
      <Image
        style={styles.logoImage}
        source={require('@/assets/images/login_logo.png')}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
    width: '100%',
  },
  logoImage: {
    width: 280,
    height: 110,
  },
});
