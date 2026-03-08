import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Logger } from 'nestjs-pino';

// 加载环境变量（从项目根目录）
const envPath = path.resolve(__dirname, '../../.env');
console.log('[Main] Loading environment from:', envPath);

const dotenvResult = dotenv.config({ path: envPath });
if (dotenvResult.parsed) {
  console.log(
    '[Main] Loaded variables:',
    Object.keys(dotenvResult.parsed).length,
  );

  // 展开变量引用
  Object.keys(dotenvResult.parsed).forEach((key) => {
    let value = dotenvResult.parsed[key] || '';
    let iterations = 0;

    while (value.includes('${') && iterations < 10) {
      const newValue = value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
        return process.env[varName] || dotenvResult.parsed?.[varName] || '';
      });

      if (newValue === value) break;
      value = newValue;
      iterations++;
    }

    process.env[key] = value;
  });

  console.log('[Main] DATABASE_URL configured:', !!process.env.DATABASE_URL);
}

async function bootstrap() {
  try {
    console.log('[Main] Creating NestJS application with bufferLogs...');

    // 关键修复：启用 bufferLogs 防止日志系统阻塞启动
    const app = await NestFactory.create(AppModule, {
      bufferLogs: true, // ⭐ 防止 Pino 初始化阻塞
    });

    console.log('[Main] Application created successfully');

    // 使用 nestjs-pino 的 Logger
    app.useLogger(app.get(Logger));

    // 设置全局 API 前缀
    app.setGlobalPrefix('api');

    // 启用 CORS
    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });

    const port = process.env.PORT ?? 3001;
    const host = process.env.HOST ?? '0.0.0.0';

    console.log('[Main] Starting to listen on port:', port);
    await app.listen(port, host);

    console.log('[Main] Server started successfully on', `${host}:${port}`);
    console.log('[Main] WebSocket available at ws://${host}:${port}/ws');
  } catch (error) {
    console.error('[Main] Fatal error during startup:', error);
    process.exit(1);
  }
}
bootstrap();
