/**
 * Lightweight structured logger.
 * Replaces console.log with leveled logging that can easily be sent to
 * Datadog, Sentry, or another external service in the future.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class StructuredLogger {
  private log(level: LogLevel, message: string, meta?: Record<string, any>) {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...(meta || {}),
    };

    // In a real production app, you might send this to an external logging service here
    
    // For MVP, we format nicely for the console
    if (process.env.NODE_ENV !== 'production' || level === 'error' || level === 'warn') {
      const formattedMsg = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
      switch (level) {
        case 'debug':
          console.debug(formattedMsg, meta || '');
          break;
        case 'info':
          console.info(formattedMsg, meta || '');
          break;
        case 'warn':
          console.warn(formattedMsg, meta || '');
          break;
        case 'error':
          console.error(formattedMsg, meta || '');
          break;
      }
    }
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, any>) {
    this.log('error', message, meta);
  }
}

export const logger = new StructuredLogger();
