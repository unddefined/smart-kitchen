import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsGateway } from './events.gateway';
import { UsersModule } from './users/users.module';
import { DishesModule } from './dishes/dishes.module';
import { OrdersModule } from './orders/orders.module';
import { ServingModule } from './serving/serving.module';
import { PrismaModule } from './prisma/prisma.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { OrderItemsModule } from './order-items/order-items.module';
import { LoggerModule } from 'nestjs-pino';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // 配置模块 - 全局可用，自动加载 .env 文件
    ConfigModule.forRoot({
      isGlobal: true, // 全局可用，无需在其他模块导入
      envFilePath: ['.env.production', '.env'], // 优先加载生产环境配置
      ignoreEnvFile: false, // 不忽略 .env 文件
      expandVariables: true, // 支持 ${VAR} 变量引用
    }),
    // 日志模块
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      },
    }),
    CommonModule,
    PrismaModule,
    UsersModule,
    DishesModule,
    OrdersModule,
    ServingModule,
    KitchenModule,
    OrderItemsModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
