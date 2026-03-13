import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../events.gateway';

/**
 * 广播服务 - 用于统一处理 WebSocket 事件广播
 *
 * 功能特性：
 * 1. 自动补充订单信息（hallNumber, mealType, mealTime）
 * 2. 统一的错误处理和降级机制
 * 3. 支持自定义广播房间
 */
@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * 广播订单项事件到指定房间
   * 自动查询并补充订单信息（hallNumber, mealType, mealTime）
   *
   * @param event 事件名称（如 'item-created', 'item-updated', 'item-deleted'）
   * @param data 广播数据对象（必须包含 orderId 字段）
   * @param rooms 目标房间列表，默认为 ['order-items', 'all']
   */
  async broadcastItemEvent(
    event: string,
    data: any,
    rooms: string[] = ['order-items', 'all'],
  ): Promise<void> {
    try {
      // 如果数据包含 orderId，自动查询并补充订单信息
      if (data.orderId) {
        const order = await this.prisma.order.findUnique({
          where: { id: data.orderId },
          select: {
            id: true,
            hallNumber: true,
            mealType: true,
            mealTime: true,
          },
        });

        if (order) {
          // 添加扁平化的字段
          data.hallNumber = order.hallNumber;
          data.mealType = order.mealType;
          data.mealTime = order.mealTime;

          // 添加完整的 order 对象引用
          data.order = order;

          this.logger.debug(`已为事件 ${event} 补充订单 ${order.id} 的信息`);
        } else {
          this.logger.warn(`订单 ${data.orderId} 不存在，无法补充订单信息`);
        }
      }

      // 执行广播
      const timestamp = new Date().toISOString();
      rooms.forEach((room) => {
        this.eventsGateway.server.to(room).emit(event, { data, timestamp });
      });

      this.logger.log(`已广播 ${event} 事件到房间：${rooms.join(', ')}`);
    } catch (error) {
      this.logger.error(
        `广播 ${event} 事件失败:`,
        error instanceof Error ? error.message : JSON.stringify(error),
      );

      // 即使失败也尝试广播原始数据（降级处理）
      const timestamp = new Date().toISOString();
      rooms.forEach((room) => {
        this.eventsGateway.server.to(room).emit(event, { data, timestamp });
      });
    }
  }

  /**
   * 广播订单事件到指定房间
   *
   * @param event 事件名称（如 'order-created', 'order-updated', 'order-deleted'）
   * @param data 广播数据对象（必须包含 id 或 orderId 字段）
   * @param rooms 目标房间列表，默认为 ['orders', 'all']
   */
  async broadcastOrderEvent(
    event: string,
    data: any,
    rooms: string[] = ['orders', 'all'],
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      rooms.forEach((room) => {
        this.eventsGateway.server.to(room).emit(event, { data, timestamp });
      });

      this.logger.log(`已广播 ${event} 事件到房间：${rooms.join(', ')}`);
    } catch (error) {
      this.logger.error(
        `广播 ${event} 事件失败:`,
        error instanceof Error ? error.message : JSON.stringify(error),
      );
    }
  }
}
