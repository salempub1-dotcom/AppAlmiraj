const config = {
  name: 'Al Miraj Education',
  slug: 'al-miraj-app',
  owner: 'almiradjapp',
  version: '1.0.0',

  icon: './assets/icon.png',

  runtimeVersion: { policy: 'fingerprint' },

  updates: {
    url: 'https://u.expo.dev/284b813c-50f3-4104-a2bf-62dc065eebe6',
    enabled: true,
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0
  },

  extra: {
    eas: { projectId: '284b813c-50f3-4104-a2bf-62dc065eebe6' }
  },

  orientation: 'portrait',
  scheme: 'almiraj',
  userInterfaceStyle: 'automatic',

  splash: {
    backgroundColor: '#08111F',
    resizeMode: 'contain'
  },

  plugins: ['expo-font'],

  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.almiraj.education',
    icon: './assets/icon.png'
  },

  android: {
    package: 'com.almiraj.education',
    icon: './assets/icon.png',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0B1833'
    }
  }
};

module.exports = config;
