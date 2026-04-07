/**
 * Smart Logging Utility
 *
 * Automatically disables logs in production while keeping them in development.
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *
 *   logger.log('Normal log');
 *   logger.info('Info message');
 *   logger.warn('Warning message');
 *   logger.error('Error message'); // Always logs, even in production
 *   logger.debug('Debug details');
 *
 * Environment Detection:
 *   - Development: import.meta.env.DEV === true
 *   - Production: import.meta.env.PROD === true
 *   - Custom: Set VITE_ENABLE_LOGS=true to force enable logs
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LoggerConfig {
  enableInProduction: boolean;
  enableDebug: boolean;
  prefix: string;
}

class Logger {
  private isDevelopment: boolean;
  private config: LoggerConfig;

  constructor() {
    // Detect environment
    this.isDevelopment = import.meta.env.DEV;

    // Load configuration
    this.config = {
      // Allow enabling logs in production via environment variable
      enableInProduction: import.meta.env.VITE_ENABLE_LOGS === 'true',
      // Debug logs only in development
      enableDebug: this.isDevelopment,
      // Optional prefix for all logs
      prefix: '[App]'
    };
  }

  /**
   * Check if logging should be enabled
   */
  private shouldLog(level: LogLevel): boolean {
    // Always log errors (even in production)
    if (level === 'error') {
      return true;
    }

    // Debug logs only if explicitly enabled
    if (level === 'debug' && !this.config.enableDebug) {
      return false;
    }

    // In production, only log if explicitly enabled
    if (!this.isDevelopment && !this.config.enableInProduction) {
      return false;
    }

    return true;
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(message: string, context?: string): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';

    if (this.isDevelopment) {
      // Full formatting in development
      return `${this.config.prefix} ${contextStr} ${message}`;
    } else {
      // Minimal formatting in production (if enabled)
      return context ? `[${context}] ${message}` : message;
    }
  }

  /**
   * Standard log (disabled in production)
   */
  log(message: string, ...args: any[]): void {
    if (this.shouldLog('log')) {
      console.log(message, ...args);
    }
  }

  /**
   * Info log (disabled in production)
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(message, ...args);
    }
  }

  /**
   * Warning log (disabled in production)
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(message, ...args);
    }
  }

  /**
   * Error log (ALWAYS enabled, even in production)
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(message, ...args);
    }
  }

  /**
   * Debug log (only in development when debug is enabled)
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.debug(message, ...args);
    }
  }

  /**
   * Group logs together (disabled in production)
   */
  group(label: string, callback: () => void): void {
    if (this.shouldLog('log')) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Collapsed group (disabled in production)
   */
  groupCollapsed(label: string, callback: () => void): void {
    if (this.shouldLog('log')) {
      console.groupCollapsed(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Table log (disabled in production)
   */
  table(data: any): void {
    if (this.shouldLog('log')) {
      console.table(data);
    }
  }

  /**
   * Performance timing (disabled in production)
   */
  time(label: string): void {
    if (this.shouldLog('log')) {
      console.time(label);
    }
  }

  /**
   * End performance timing (disabled in production)
   */
  timeEnd(label: string): void {
    if (this.shouldLog('log')) {
      console.timeEnd(label);
    }
  }

  /**
   * Assert condition (disabled in production)
   */
  assert(condition: boolean, message: string): void {
    if (this.shouldLog('log')) {
      console.assert(condition, message);
    }
  }

  /**
   * Clear console (disabled in production)
   */
  clear(): void {
    if (this.shouldLog('log')) {
      console.clear();
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default
export default logger;
