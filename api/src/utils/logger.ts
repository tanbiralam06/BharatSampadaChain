import winston from 'winston';
import { config } from '../config';

const fmt = winston.format;

export const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: fmt.combine(
    fmt.timestamp(),
    config.nodeEnv === 'production'
      ? fmt.json()
      : fmt.combine(fmt.colorize(), fmt.printf(({ level, message, timestamp, ...meta }) => {
          const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
          return `${timestamp} ${level}: ${message}${extras}`;
        }))
  ),
  transports: [new winston.transports.Console()],
});
