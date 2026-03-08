import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    // 使用 nestjs-pino 官方模块
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
