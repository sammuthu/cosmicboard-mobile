// Mock for expo-constants to prevent getConstants error
const Constants = {
  manifest: {},
  manifest2: null,
  deviceId: 'mock-device-id',
  deviceName: 'Mock Device',
  linkingUrl: '',
  expoVersion: '53.0.0',
  installationId: 'mock-installation-id',
  isDevice: true,
  platform: {
    ios: null,
    android: {
      versionCode: 1,
    },
    web: null,
  },
  statusBarHeight: 24,
  systemFonts: [],
  getConstants: () => Constants,
};

module.exports = Constants;
module.exports.default = Constants;