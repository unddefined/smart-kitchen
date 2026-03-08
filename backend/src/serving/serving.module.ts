import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ServingService } from './serving.service';
import { ServingController } from './serving.controller';
import { EventsGateway } from '../events.gateway';
import { OrderItemsModule } from '../order-items/order-items.module';
import { KitchenModule } from '../kitchen/kitchen.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [PrismaModule, OrderItemsModule, KitchenModule, OrdersModule],
  controllers: [ServingController],
  providers: [ServingService, EventsGateway],
  exports: [ServingService, EventsGateway],
})
export class ServingModule {}