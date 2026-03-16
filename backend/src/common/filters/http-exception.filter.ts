import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * 全局 HTTP 异常过滤器
 * 统一处理所有未捕获的异常，返回友好的错误响应
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // 获取状态码和错误信息
    let status: number;
    let message: string;
    let errorType: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // 处理对象或字符串响应
      if (typeof exceptionResponse === 'object') {
        const respObj = exceptionResponse as Record<string, unknown>;
        message =
          (respObj.message as string) || (respObj.msg as string) || '请求失败';
        errorType = (respObj.error as string) || 'HTTP_ERROR';
      } else {
        message = exceptionResponse;
        errorType = 'HTTP_ERROR';
      }
    } else {
      // 非 HTTP 异常（服务器内部错误）
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = '服务器内部错误';
      errorType = 'INTERNAL_ERROR';

      // 记录详细错误日志（生产环境不暴露敏感信息）
      this.logger.error(
        `Unhandled exception: ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    // 构建统一的错误响应格式
    const errorResponse = {
      success: false,
      error: {
        type: errorType,
        message: message,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        method: request.method,
      },
    };

    // 发送响应
    response.status(status).json(errorResponse);
  }
}
