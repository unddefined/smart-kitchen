import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { ServingModule } from './serving/serving.module';
import { DishesModule } from './dishes/dishes.module';
import { OrdersModule } from './orders/orders.module';
import { TestController } from './test.controller';
import { MockDataService } from './mock-data.service';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ServingModule,
    DishesModule,
    OrdersModule,
  ],
  controllers: [AppController, TestController],
  providers: [AppService, MockDataService],
})
export class AppModule {}
