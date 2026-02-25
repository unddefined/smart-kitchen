import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局API前缀
  app.setGlobalPrefix('api');

  // 启用 CORS - 完整的跨域配置
  app.enableCors({
    // 允许的来源 - 包括本地文件和各种开发环境
    origin: [
      'http://localhost:5173',     // Vite开发服务器
      'http://localhost:3000',     // 其他可能的开发端口
      'http://127.0.0.1:5173',     // 本地IP地址
      'http://127.0.0.1:3000',     // 本地IP地址其他端口
      'file://',                   // 本地文件访问
      'null'                       // 文件协议的origin值
    ],
    credentials: true,             // 允许携带凭证
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Accept',
      'X-Requested-With',
      'Cache-Control'
    ],
    exposedHeaders: ['Authorization'],
    maxAge: 3600                   // 预检请求缓存时间
  });

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();