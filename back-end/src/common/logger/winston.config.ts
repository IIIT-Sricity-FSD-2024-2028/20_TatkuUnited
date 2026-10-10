import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';

const logDir = path.resolve(process.cwd(), 'logs');

// Custom log format for file outputs (structured JSON-friendly format)
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Custom format for console outputs
const consoleLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const infoObj = info as Record<string, unknown>;
    const timestamp =
      typeof infoObj.timestamp === 'string' ? infoObj.timestamp : '';
    const level = typeof infoObj.level === 'string' ? infoObj.level : '';
    const message =
      typeof infoObj.message === 'string'
        ? infoObj.message
        : JSON.stringify(infoObj.message ?? '');
    const ctx =
      typeof infoObj.context === 'string' ? `[${infoObj.context}] ` : '';
    const req =
      typeof infoObj.requestId === 'string' ? `(${infoObj.requestId}) ` : '';
    const errStack =
      typeof infoObj.stack === 'string' ? `\n${infoObj.stack}` : '';
    return `${timestamp} ${level} ${ctx}${req}${message}${errStack}`;
  }),
);

// Daily rotate file transport for general app logs
const dailyAppRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
  format: fileLogFormat,
});

// Daily rotate file transport for errors only
const dailyErrorRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: fileLogFormat,
});

// Daily rotate file transport for HTTP access logs
const dailyHttpRotateTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'http-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'http',
  format: fileLogFormat,
});

// Custom levels including 'http'
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'gray',
  },
};

winston.addColors(customLevels.colors);

export const winstonLoggerInstance = winston.createLogger({
  levels: customLevels.levels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [
    new winston.transports.Console({
      format: consoleLogFormat,
    }),
    dailyAppRotateTransport,
    dailyErrorRotateTransport,
    dailyHttpRotateTransport,
  ],
  exitOnError: false,
});
