import { createLogger, Logger, format, transports } from 'winston';

export type { Logger } from 'winston';

export const createSimpleLogger = (): Logger => {
  return createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
    ],
  });
};

export default createSimpleLogger;

