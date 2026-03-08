import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { KitchenModule } from '../kitchen/kitchen.module';
import { OrderItemsModule } from '../order-items/order-items.module';

@Module({
  imports: [PrismaModule, KitchenModule, OrderItemsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
