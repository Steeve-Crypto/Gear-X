module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests-ui/**/*.test.ts?(x)'],
  clearMocks: true,
  moduleNameMapper: {
    '^expo-modules-core(.*)$': '<rootDir>/node_modules/expo/node_modules/expo-modules-core$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-svg)',
  ],
};
