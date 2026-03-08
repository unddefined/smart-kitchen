import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsGateway } from '../events.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController],
  providers: [OrdersService, EventsGateway],
  exports: [OrdersService, EventsGateway],
})
export class OrdersModule {}