import { logger } from '../logger';
import * as Sentry from '@sentry/react-native';

// Mock Sentry
jest.mock('@sentry/react-native');

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('debug', () => {
    it('should log debug messages to console', () => {
      logger.debug('Debug message', { key: 'value' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('DEBUG');
      expect(consoleLogSpy.mock.calls[0][0]).toContain('Debug message');
    });

    it('should handle debug without metadata', () => {
      logger.debug('Simple debug');

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should log info messages to console', () => {
      logger.info('Info message', { detail: 'information' });

      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
    });

    it('should send breadcrumb to Sentry', () => {
      logger.info('User action', { action: 'button_click' });

      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
    });
  });

  describe('warn', () => {
    it('should log warning messages to console', () => {
      logger.warn('Warning message', { warning: 'details' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN');
    });

    it('should send breadcrumb to Sentry', () => {
      logger.warn('Deprecation warning');

      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
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

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should send breadcrumb to Sentry for database operations', () => {
      logger.database('Migration completed');

      expect(Sentry.addBreadcrumb).toHaveBeenCalled();
    });
  });
});
