import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ServingService } from './serving.service';
import { ServingController } from './serving.controller';
import { EventsGateway } from '../events.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [ServingController],
  providers: [ServingService, EventsGateway],
  exports: [ServingService, EventsGateway],
})
export class ServingModule {}