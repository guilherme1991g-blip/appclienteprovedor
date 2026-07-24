import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const scheme = useColorScheme() ?? 'light';
  const currentScheme = scheme === 'unspecified' ? 'light' : scheme;

  return (
    <ThemeProvider value={currentScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={currentScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </ThemeProvider>
  );
}
