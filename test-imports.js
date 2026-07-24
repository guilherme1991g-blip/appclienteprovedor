async function run() {
  const reactNavigation = await import('@react-navigation/native');
  const expoRouter = await import('expo-router');

  console.log('React Navigation exports:', Object.keys(reactNavigation).filter(k => k.includes('Theme') || k.includes('Provider')));
  console.log('Expo Router exports:', Object.keys(expoRouter).filter(k => k.includes('Theme') || k.includes('Provider') || k.includes('Stack')));
}
run();
