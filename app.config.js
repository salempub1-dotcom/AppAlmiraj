const config = {
  name: 'Al Miraj Education',
  slug: 'al-miraj-app',
  owner: 'almiradjapp',
  version: '1.0.0',
  runtimeVersion: { policy: 'fingerprint' },
  updates: {
    url: 'https://u.expo.dev/284b813c-50f3-4104-a2bf-62dc065eebe6',
    checkAutomatically: 'ON_LOAD',
    fallbackToCacheTimeout: 0
  },
  extra: {
    eas: { projectId: '284b813c-50f3-4104-a2bf-62dc065eebe6' }
  },
  orientation: 'portrait',
  scheme: 'almiraj',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.almiraj.education'
  },
  android: {
    package: 'com.almiraj.education'
  }
};

module.exports = config;
