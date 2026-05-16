import fs from 'fs';
import path from 'path';
import util from 'util';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AppLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
}

const logsDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logsDir, 'app.log');

function ensureLogsDir(): void {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function normalizeArg(arg: unknown): unknown {
  if (arg instanceof Error) {
    return {
      name: arg.name,
      message: arg.message,
      stack: arg.stack
    };
  }

  return arg;
}

function write(level: LogLevel, message: string, args: unknown[]): void {
  ensureLogsDir();

  const timestamp = new Date().toISOString();
  const rendered = util.format(message, ...args.map(normalizeArg));
  const line = `${timestamp} [${level.toUpperCase()}] ${rendered}`;

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }

  fs.appendFileSync(logFile, `${line}\n`, 'utf8');
}

export function createLogger(): AppLogger {
  return {
    debug: (message, ...args) => write('debug', message, args),
    info: (message, ...args) => write('info', message, args),
    warn: (message, ...args) => write('warn', message, args),
    error: (message, ...args) => write('error', message, args)
  };
}
