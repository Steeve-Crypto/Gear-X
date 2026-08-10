module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    gearXBackendUrl: process.env.EXPO_PUBLIC_GEAR_X_BACKEND_URL || '',
  },
});
