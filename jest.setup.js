// jest.setup.js - Global test setup and mocks

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  SQLiteDatabase: jest.fn(),
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    prepareAsync: jest.fn(() => Promise.resolve({
      executeAsync: jest.fn(),
      finalizeAsync: jest.fn(),
    })),
  })),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  }),
  useLocalSearchParams: () => ({}),
  usePathname: () => '/',
  useSegments: () => [],
  Link: 'Link',
  Redirect: 'Redirect',
  Stack: 'Stack',
  Tabs: 'Tabs',
}));

// Mock Sentry
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  wrap: (component) => component,
}));

// Mock expo-splash-screen
jest.mock('expo-splash-screen', () => ({
  hideAsync: jest.fn(),
  preventAutoHideAsync: jest.fn(),
}));

// Mock expo-font
jest.mock('expo-font', () => ({
  loadAsync: jest.fn(() => Promise.resolve()),
  isLoaded: jest.fn(() => true),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock @gluestack-ui/themed components
jest.mock('@gluestack-ui/themed', () => {
  const React = require('react');
  const { View, Text, TextInput, TouchableOpacity, ScrollView } = require('react-native');

  return {
    GluestackUIProvider: ({ children }) => children,
    Box: View,
    Text: Text,
    VStack: View,
    HStack: View,
    Button: TouchableOpacity,
    ButtonText: Text,
    Input: TextInput,
    InputField: TextInput,
    Card: View,
    Heading: Text,
    Select: View,
    SelectTrigger: TouchableOpacity,
    SelectInput: TextInput,
    SelectPortal: View,
    SelectBackdrop: View,
    SelectContent: ScrollView,
    SelectDragIndicatorWrapper: View,
    SelectDragIndicator: View,
    SelectItem: TouchableOpacity,
    Alert: View,
    AlertText: Text,
    Spinner: View,
  };
});

// Silence the warning: Animated: `useNativeDriver` is not supported
// Mock is handled by react-native-reanimated/mock

// Global test timeout
jest.setTimeout(10000);

// Console error/warning suppression for tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
       args[0].includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Animated: `useNativeDriver`')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
