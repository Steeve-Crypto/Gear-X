module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests-ui/**/*.test.ts?(x)'],
  clearMocks: true,
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|react-native-svg)',
  ],
};
