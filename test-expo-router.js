async function run() {
  const expoRouter = await import('expo-router');
  console.log('Expo Router exports:', Object.keys(expoRouter));
}
run();
