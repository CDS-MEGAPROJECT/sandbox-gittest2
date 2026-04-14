type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

function formatEntry(level: LogLevel, message: string, metadata?: Record<string, unknown>): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(metadata && { metadata }),
  };
  return JSON.stringify(entry);
}

export const logger = {
  debug(message: string, metadata?: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatEntry('debug', message, metadata));
    }
  },

  info(message: string, metadata?: Record<string, unknown>): void {
    console.info(formatEntry('info', message, metadata));
  },

  warn(message: string, metadata?: Record<string, unknown>): void {
    console.warn(formatEntry('warn', message, metadata));
  },

  error(message: string, metadata?: Record<string, unknown>): void {
    console.error(formatEntry('error', message, metadata));
  },
};
