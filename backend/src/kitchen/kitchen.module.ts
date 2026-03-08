import { Module } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsGateway } from '../events.gateway';

@Module({
  imports: [PrismaModule],
  providers: [KitchenService, EventsGateway],
  exports: [KitchenService],
})
export class KitchenModule {}
