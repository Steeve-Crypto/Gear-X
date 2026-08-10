module.exports = ({ config }) => ({
  ...config,
  plugins: [...(config.plugins || []), 'expo-sharing', 'expo-sqlite'],
  extra: {
    ...config.extra,
    gearXBackendUrl: process.env.EXPO_PUBLIC_GEAR_X_BACKEND_URL || '',
  },
});
