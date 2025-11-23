import { createLogger as createWinstonLogger, Logger } from 'winston';
import { transports, format } from 'winston';

export const createLogger = ({ module }: { module: NodeModule }): Logger => {
  return createWinstonLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), format.simple()),
      }),
    ],
    defaultMeta: {
      service: 'prompt-management-api',
      filename: module.filename,
    },
  });
};

