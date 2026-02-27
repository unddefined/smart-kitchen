import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 设置全局API前缀
  app.setGlobalPrefix('api');

  // 启用 CORS - 完整的跨域配置
  app.enableCors();

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
