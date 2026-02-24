import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ServingService } from './serving.service';
import { ServingController } from './serving.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ServingController],
  providers: [ServingService],
  exports: [ServingService],
})
export class ServingModule {}