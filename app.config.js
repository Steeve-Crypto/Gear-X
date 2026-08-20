module.exports = ({ config }) => ({
  ...config,
  plugins: [...(config.plugins || []), 'expo-sharing', 'expo-sqlite', 'expo-status-bar', 'expo-secure-store'],
  extra: {
    ...config.extra,
    gearXBackendUrl: process.env.EXPO_PUBLIC_GEAR_X_BACKEND_URL || '',
    gearXSupabaseUrl: process.env.EXPO_PUBLIC_GEAR_X_SUPABASE_URL || '',
    gearXSupabasePublishableKey: process.env.EXPO_PUBLIC_GEAR_X_SUPABASE_PUBLISHABLE_KEY || '',
    gearXRevenueCatAppleKey: process.env.EXPO_PUBLIC_GEAR_X_REVENUECAT_APPLE_KEY || '',
    gearXRevenueCatGoogleKey: process.env.EXPO_PUBLIC_GEAR_X_REVENUECAT_GOOGLE_KEY || '',
    gearXRevenueCatWebKey: process.env.EXPO_PUBLIC_GEAR_X_REVENUECAT_WEB_KEY || '',
  },
});
