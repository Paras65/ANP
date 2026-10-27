/**
 * Ambition News Portal - Centralized Secure Logger
 * Enforces zero-credential leakage across all log outputs.
 */
import { redactSecretKeys } from './sanitize.js';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function formatLog(level: LogLevel, message: any, ...args: any[]): string {
  const timestamp = new Date().toISOString();
  let fullMessage = typeof message === 'string' ? message : (message?.stack || message?.message || JSON.stringify(message));

  if (args && args.length > 0) {
    const extra = args.map(a => typeof a === 'string' ? a : (a?.stack || a?.message || JSON.stringify(a))).join(' ');
    fullMessage += ' ' + extra;
  }

  // Automatic redaction of all secret patterns
  const sanitized = redactSecretKeys(fullMessage);
  return `[${timestamp}] [${level}] ${sanitized}`;
}

export const logger = {
  info: (message: any, ...args: any[]) => {
    console.log(formatLog('INFO', message, ...args));
  },

  warn: (message: any, ...args: any[]) => {
    console.warn(formatLog('WARN', message, ...args));
  },

  error: (message: any, ...args: any[]) => {
    console.error(formatLog('ERROR', message, ...args));
  },

  debug: (message: any, ...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog('DEBUG', message, ...args));
    }
  }
};
