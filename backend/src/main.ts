import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

// 加载环境变量（从项目根目录）
const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading environment from:', envPath);
dotenv.config({ path: envPath });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局 API 前缀
  app.setGlobalPrefix('api');

  // 启用 CORS - 完整的跨域配置
  app.enableCors();

  const port = process.env.PORT ?? 3001;
  const host = process.env.HOST ?? '0.0.0.0'; // 监听所有网络接口
  console.log('Starting server on port:', port);
  console.log('Host:', host);
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

  await app.listen(port, host);
}
bootstrap();
