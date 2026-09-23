// providers.config.js
// Cadastro centralizado de configurações por provedor para a arquitetura White-Label

module.exports = {
  cbrfibra: {
    code: 'cbrfibra',
    name: 'CBR FIBRA',
    slug: 'isp-client-app', // Projeto original no EAS
    projectId: '51c594bd-bf04-4140-ad43-04f31a6662f9',
    bundleIdentifier: 'br.com.cbrfibra.cliente',
    package: 'br.com.cbrfibra.cliente',
    version: '1.0.1',
    buildNumber: '1',
    versionCode: 1,
    scheme: 'cbrfibra',
    icon: './assets/providers/cbrfibra/icon.png',
    splash: './assets/providers/cbrfibra/splash.png',
    splashBackground: '#080B11',
    primaryColor: '#a99b04',
  },
  webconnect: {
    code: 'webconnect',
    name: 'Web Connect',
    slug: 'webconnect-cliente',
    projectId: 'aafada6b-7654-4823-8342-8b3b691d1db6',
    bundleIdentifier: 'br.com.webconnect.cliente',
    package: 'br.com.webconnect.cliente',
    version: '1.0.1',
    buildNumber: '4',
    versionCode: 4,
    scheme: 'webconnect',
    icon: './assets/providers/webconnect/icon.png',
    splash: './assets/providers/webconnect/splash.png',
    splashBackground: '#080B11',
    primaryColor: '#0e5ddd',
  },
};
