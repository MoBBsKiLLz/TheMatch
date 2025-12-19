/**
 * Centralized logging utility for TheMatch app
 *
 * Uses Sentry for production error tracking and performance monitoring
 * In development: logs to console
 * In production: sends errors to Sentry
 */

import { captureException, captureMessage, addBreadcrumb } from './sentry';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private isDevelopment = __DEV__;

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `${prefix} ${message}${dataStr}`;
  }

  /**
   * Log debug information (only in development)
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }

  /**
   * Log general information
   */
  info(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  /**
   * Log warnings (potential issues)
   */
  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(this.formatMessage('warn', message, data));
    }

    // Send to Sentry in production
    if (!this.isDevelopment) {
      captureMessage(message, 'warning');
      if (data) {
        addBreadcrumb(message, 'warning', data);
      }
    }
  }

  /**
   * Log errors (something went wrong)
   */
  error(message: string, error?: Error | any): void {
    const errorData = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : error;

    if (this.isDevelopment) {
      console.error(this.formatMessage('error', message, errorData));
    }

    // Send to Sentry in production
    if (!this.isDevelopment) {
      if (error instanceof Error) {
        captureException(error, { context: message });
      } else {
        captureMessage(`${message}: ${JSON.stringify(errorData)}`, 'error');
      }
    }
  }

  /**
   * Log database operations (useful for debugging)
   */
  database(operation: string, details?: any): void {
    if (this.isDevelopment) {
      this.debug(`Database: ${operation}`, details);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for testing
export type { LogLevel, LogEntry };
