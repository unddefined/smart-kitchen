import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { KitchenModule } from '../kitchen/kitchen.module';
import { OrderItemsModule } from '../order-items/order-items.module';
import { EventsGateway } from '../events.gateway';

@Module({
  imports: [PrismaModule, KitchenModule, OrderItemsModule],
  controllers: [OrdersController],
  providers: [OrdersService, EventsGateway],
  exports: [OrdersService],
})
export class OrdersModule {}