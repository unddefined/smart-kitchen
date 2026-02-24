import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS - 支持多个来源
  app.enableCors({
    origin: [
      'http://localhost:5173',           // 本地开发
      'http://8.145.34.30:5173',         // 生产环境前端
      'http://8.145.34.30',              // 生产环境根域名
      'https://8.145.34.30'              // HTTPS生产环境
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization']
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();