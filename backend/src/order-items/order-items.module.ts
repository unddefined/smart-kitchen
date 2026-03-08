import { Module } from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsGateway } from '../events.gateway';

@Module({
  imports: [PrismaModule],
  providers: [OrderItemsService, EventsGateway],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}
