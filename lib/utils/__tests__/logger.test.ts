import { logger } from '../logger';
import * as Sentry from '@sentry/react-native';

// Mock Sentry
jest.mock('@sentry/react-native');

describe('Logger', () => {
  let consoleDebugSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let originalDev: boolean;

  beforeEach(() => {
    jest.clearAllMocks();
    // Save original __DEV__ value
    originalDev = (global as any).__DEV__;
    // Set __DEV__ to true for development mode tests
    (global as any).__DEV__ = true;

    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore original __DEV__ value
    (global as any).__DEV__ = originalDev;

    consoleDebugSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('debug', () => {
    it('should log debug messages to console', () => {
      logger.debug('Debug message', { key: 'value' });

      expect(consoleDebugSpy).toHaveBeenCalled();
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('DEBUG');
      expect(consoleDebugSpy.mock.calls[0][0]).toContain('Debug message');
    });

    it('should handle debug without metadata', () => {
      logger.debug('Simple debug');

      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages to console', () => {
      logger.info('Info message', { detail: 'information' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
    });

    it('should format info messages with data', () => {
      logger.info('User action', { action: 'button_click' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('User action');
    });
  });

  describe('warn', () => {
    it('should log warning messages to console', () => {
      logger.warn('Warning message', { warning: 'details' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN');
    });

    it('should log warnings without metadata', () => {
      logger.warn('Deprecation warning');

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN');
    });
  });

  describe('error', () => {
    it('should log error messages to console', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
    });

    it('should handle error without metadata', () => {
      logger.error('Simple error');

      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('database', () => {
    it('should log database operations', () => {
      logger.database('Created table users', { rows: 0 });

      // database() calls debug() which uses console.debug
      expect(consoleDebugSpy).toHaveBeenCalled();
    });

    it('should log database operations in development', () => {
      logger.database('Migration completed');

      // database() calls debug() which uses console.debug in dev mode
      expect(consoleDebugSpy).toHaveBeenCalled();
    });
  });
});
