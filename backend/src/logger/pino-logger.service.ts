import { Injectable, OnModuleInit } from '@nestjs/common';
import pino from 'pino';

@Injectable()
export class PinoLoggerService implements OnModuleInit {
  private logger: pino.Logger;
  private defaultContext: string = 'App'; // 默认 context，避免参数注入问题

  constructor() {
    // 延迟初始化 logger
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });

    // 初始化默认 context
    this.logger = this.logger.child({ context: this.defaultContext });
    console.log('[PinoLoggerService] Constructor initialized with context:', this.defaultContext);
  }

  async onModuleInit() {
    console.log('[PinoLoggerService] Module initialized');
  }

  log(message: string, context?: string) {
    this.getLogger(context).info(message);
  }

  error(message: string, trace?: unknown, context?: string) {
    let traceStr = '';
    if (trace instanceof Error) {
      traceStr = trace.stack ?? '';
    } else if (trace !== undefined) {
      traceStr = JSON.stringify(trace);
    }
    this.getLogger(context).error({ trace: traceStr }, message);
  }

  warn(message: string, context?: string) {
    this.getLogger(context).warn(message);
  }

  debug(message: string, context?: string) {
    this.getLogger(context).debug(message);
  }

  verbose(message: string, context?: string) {
    this.getLogger(context).debug(message);
  }

  private getLogger(context?: string): pino.Logger {
    if (!context) {
      return this.logger;
    }
    return this.logger.child({ context });
  }
}
