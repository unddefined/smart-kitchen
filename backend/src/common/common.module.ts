import { Module, Global } from '@nestjs/common';
import { BroadcastService } from './services/broadcast.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EventsGateway } from '../events.gateway';

/**
 * 公共模块 - 提供全局共享的服务
 *
 * 使用 @Global() 装饰器标记为全局模块，无需在其它模块中重复导入
 */
@Global()
@Module({
  providers: [BroadcastService, PrismaModule, EventsGateway],
  exports: [BroadcastService],
})
export class CommonModule {}
