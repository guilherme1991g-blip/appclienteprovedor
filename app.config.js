const providers = require('./providers.config');

module.exports = ({ config }) => {
  let providerKey = (process.env.APP_PROVIDER || '').toLowerCase();

  // If APP_PROVIDER is not set, check if EAS Cloud passed EAS_PROJECT_ID or if project ID matches
  if (!providerKey || !providers[providerKey]) {
    const currentProjectId = process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID || config.extra?.eas?.projectId;
    if (currentProjectId) {
      const found = Object.keys(providers).find(k => providers[k].projectId === currentProjectId);
      if (found) {
        providerKey = found;
      }
    }
  }

  if (!providerKey || !providers[providerKey]) {
    providerKey = 'cbrfibra';
  }

  const provider = providers[providerKey] || providers['cbrfibra'];
  const easProjectId = provider.projectId || '51c594bd-bf04-4140-ad43-04f31a6662f9';

  return {
    ...config,
    name: provider.name,
    slug: provider.slug,
    version: provider.version || '1.0.1',
    orientation: 'default',
    icon: provider.icon,
    scheme: provider.scheme || 'ispclientapp',
    userInterfaceStyle: 'automatic',
    ios: {
      ...config.ios,
      icon: provider.icon,
      supportsTablet: false,
      bundleIdentifier: provider.bundleIdentifier,
      buildNumber: String(provider.buildNumber || '1'),
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        CFBundleDevelopmentRegion: 'pt_BR',
        NSLocationWhenInUseUsageDescription: 'Necessário para identificar e diagnosticar a qualidade da conexão Wi-Fi.',
      },
    },
    android: {
      ...config.android,
      package: provider.package,
      versionCode: provider.versionCode || 1,
      adaptiveIcon: {
        backgroundColor: '#FFFFFF',
        foregroundImage: provider.icon,
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_WIFI_STATE',
        'NEARBY_WIFI_DEVICES',
      ],
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          backgroundColor: provider.splashBackground || '#080B11',
          image: provider.splash,
          imageWidth: 120,
        },
      ],
      'expo-font',
      'expo-web-browser',
      'expo-image',
      'expo-status-bar',
      'expo-sharing',
      'expo-build-properties',
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      ...config.extra,
      router: {},
      ...(provider.projectId ? { eas: { projectId: provider.projectId } } : {}),
      providerCode: provider.code,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    ...(provider.projectId
      ? {
          updates: {
            url: `https://u.expo.dev/${provider.projectId}`,
            checkAutomatically: 'ON_LOAD',
            fallbackToCacheTimeout: 5000,
          },
        }
      : {}),
  };
};
