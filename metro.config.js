const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add a custom resolver to patch expo-constants
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Intercept expo-constants and provide a mock if it fails
  if (moduleName === 'expo-constants') {
    try {
      return context.resolveRequest(context, moduleName, platform);
    } catch (error) {
      // Return a mock module if expo-constants fails to resolve
      return {
        filePath: require.resolve('./src/utils/expo-constants-mock.js'),
        type: 'sourceFile',
      };
    }
  }
  
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;