module.exports = {
  preset: 'jest-expo',

  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Transform files with ts-jest for TypeScript support
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],

  // Coverage thresholds (optional - can be adjusted)
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 65,
      functions: 70,
      lines: 70,
    },
  },

  // Test environment
  testEnvironment: 'node',

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.expo/',
  ],

  // Transform ignore patterns for expo and react-native modules
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@gluestack-ui/.*|@gluestack-style/.*))',
  ],
};
