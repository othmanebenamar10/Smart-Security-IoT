import { createLogger as createWinstonLogger, format, transports } from 'winston';
import path from 'path';

export function createLogger() {
  return createWinstonLogger({
    level: 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      format.errors({ stack: true }),
      format.splat(),
      format.printf(({ timestamp, level, message, stack }) => {
        return `${timestamp} [${level}] ${stack || message}`;
      })
    ),
    transports: [
      new transports.File({ filename: path.join('logs', 'app.log'), maxsize: 5_000_000, maxFiles: 5 }),
      new transports.Console({ format: format.colorize({ all: true }) })
    ]
  });
}
