import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Order } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { EventsGateway } from '../events.gateway';

// 订单状态机定义（根据 MVP文档）
const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  created: ['started', 'cancelled'],
  started: ['serving', 'cancelled'],
  serving: ['urged', 'started', 'done'],
  urged: ['serving', 'started'],
  done: [],
  cancelled: [],
};

@Injectable()
export class KitchenService {
  private readonly logger = new Logger(KitchenService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
  ) {}

  /**
   * 广播订单事件到指定房间
   */
  private broadcastOrderEvent(
    event: string,
    data: any,
    rooms: string[] = ['orders', 'all'],
  ) {
    const timestamp = new Date().toISOString();
    rooms.forEach((room) => {
      this.eventsGateway.server.to(room).emit(event, { data, timestamp });
    });
    this.logger.log(`已广播 ${event} 事件到房间：${rooms.join(', ')}`);
  }

  /**
   * 验证订单状态转换是否合法
   */
  validateStatusTransition(fromStatus: string, toStatus: string): boolean {
    const allowedTransitions = ORDER_STATUS_TRANSITIONS[fromStatus];
    if (!allowedTransitions) {
      this.logger.warn(`未知状态：${fromStatus}`);
      return false;
    }

    const isValid = allowedTransitions.includes(toStatus);
    if (!isValid) {
      this.logger.warn(
        `非法的状态转换：${fromStatus} -> ${toStatus}，允许的状态：${allowedTransitions.join(', ')}`,
      );
    }
    return isValid;
  }

  /**
   * 根据订单状态更新订单菜品 - 支持事务
   * 如果订单状态从 serving/urged 回退到 started/paused，重置所有菜品优先级为 0
   */
  async updateOrderItemsByStatus(
    order: Order,
    tx?: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
    >,
  ) {
    const client = tx || this.prisma;

    if (order.status === 'started') {
      // 检查是否有需要重置优先级的菜品
      const itemsWithPriority = await client.orderItem.findMany({
        where: {
          orderId: order.id,
          priority: { gt: 0 },
        },
      });

      // 批量更新优先级为 0（排除已出菜的菜品）
      if (itemsWithPriority.length > 0) {
        await client.orderItem.updateMany({
          where: {
            orderId: order.id,
            status: { not: 'served' },
          },
          data: { priority: 0 },
        });

        this.logger.log(
          `订单${order.id}状态回退到 ${order.status}，所有菜品优先级重置为 0`,
          { orderId: order.id, resetCount: itemsWithPriority.length },
        );
      }
    } else if (order.status === 'serving') {
      // 当订单状态变为 serving 时，初始化所有菜品的优先级
      await this.initializeDishPriorities(order.id, client);
    }
  }

  /**
   * 初始化订单中所有菜品的优先级 - 支持事务，使用批量更新优化性能
   * 将 N 次单独更新减少到 3-4 次批量更新
   */
  async initializeDishPriorities(
    orderId: number,
    tx?: Omit<
      PrismaClient,
      '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
    >,
  ) {
    const client = tx || this.prisma;

    // 查询所有未出菜的菜品
    const orderItems = await client.orderItem.findMany({
      where: {
        orderId,
        status: { not: 'served' },
        priority: { not: -1 },
      },
      include: {
        dish: {
          include: { category: true },
        },
      },
    });

    // 查询已出菜的菜品（用于日志记录）
    const servedItems = await client.orderItem.findMany({
      where: { orderId, status: 'served' },
      include: { dish: true },
    });

    this.logger.log(`订单${orderId}开始初始化菜品优先级`, {
      orderId,
      totalItems: orderItems.length + servedItems.length,
      itemsToInitialize: orderItems.length,
      servedItemsSkipped: servedItems.length,
    });

    // 定义菜品分类与优先级的映射关系
    const priorityMap: Record<string, number> = {
      前菜: 3,
      中菜: 2,
      点心: 2,
      蒸菜: 2,
      后菜: 1,
      尾菜: 1,
      凉菜: 3,
    };

    // 按优先级分组，准备批量更新
    const groupedByPriority: Record<number, number[]> = {};

    for (const item of orderItems) {
      if (item.dish?.category?.name) {
        const categoryName = item.dish.category.name;
        const priority = priorityMap[categoryName] || 0;

        if (!groupedByPriority[priority]) {
          groupedByPriority[priority] = [];
        }
        groupedByPriority[priority].push(item.id);

        this.logger.log(
          `订单${orderId}的${item.dish.name}(${categoryName}) 设置优先级为 ${priority}`,
          {
            orderId,
            itemId: item.id,
            dishName: item.dish.name,
            categoryName,
            priority,
          },
        );
      }
    }

    // 批量更新：将 N 次更新减少到 3-4 次
    for (const [priority, ids] of Object.entries(groupedByPriority)) {
      await client.orderItem.updateMany({
        where: { id: { in: ids } },
        data: { priority: Number(priority) },
      });
    }
  }

  /**
   * 检查并更新订单状态 - 基于用餐时间自动状态流转
   * 午餐：9:00-14:00，晚餐：15:00-21:00
   */
  async checkAndUpdateOrderStatus(order: Order) {
    return order;
    // 只有 created 或 started 状态的订单才需要检查
    if (order.status !== 'created' && order.status !== 'started') {
      return order;
    }

    // 检查是否有用餐时间设置
    if (!order.mealTime) {
      return order;
    }

    const now = new Date();
    const mealTime = new Date(order.mealTime);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // 判断是否为午餐或晚餐订单
    const isLunch = order.mealType === 'lunch';
    const isDinner = order.mealType === 'dinner';

    // 检查是否到达用餐日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mealDate = new Date(mealTime);
    mealDate.setHours(0, 0, 0, 0);

    // 如果还没到用餐日期，不更新状态
    if (now < mealDate) {
      return order;
    }

    // 检查是否在用餐时间范围内或已过期
    let shouldStart = false;
    let isExpired = false;

    if (isLunch) {
      // 午餐时间范围：9:00-14:00
      const lunchStart = 9 * 60;
      const lunchEnd = 14 * 60;

      if (currentTimeInMinutes > lunchEnd) {
        isExpired = true;
      } else if (
        currentTimeInMinutes >= lunchStart &&
        currentTimeInMinutes <= lunchEnd
      ) {
        shouldStart = true;
      }
    } else if (isDinner) {
      // 晚餐时间范围：15:00-21:00
      const dinnerStart = 15 * 60;
      const dinnerEnd = 20 * 60;

      if (currentTimeInMinutes > dinnerEnd) {
        isExpired = true;
      } else if (
        currentTimeInMinutes >= dinnerStart &&
        currentTimeInMinutes <= dinnerEnd
      ) {
        shouldStart = true;
      }
    } else {
      // 其他类型（早餐等），默认在用餐时间开始后即可起菜
      shouldStart = now >= mealTime;
    }

    // 如果已过期，更新状态为 'cancelled'
    if (isExpired) {
      const cancelledOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'cancelled', updatedAt: new Date() },
      });
      await this.updateOrderItemsByStatus(cancelledOrder);
      this.broadcastOrderEvent('order-updated', cancelledOrder);
      return cancelledOrder;
    }

    // 如果在用餐时间范围内且当前状态是 created，更新状态为 'started'
    if (shouldStart && order.status === 'created') {
      const startedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'started', updatedAt: new Date() },
      });
      this.broadcastOrderEvent('order-updated', startedOrder);
      return startedOrder;
    }

    return order;
  }

  /**
   * 起菜 - 将订单状态更新为 serving 并初始化菜品优先级
   */
  async startServing(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            dish: { include: { category: true } },
          },
        },
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 验证状态转换
    if (!this.validateStatusTransition(order.status, 'serving')) {
      throw new Error(`无法从 ${order.status} 状态起菜`);
    }

    // 使用事务更新订单状态和菜品优先级
    const updatedOrder = await this.prisma.$transaction(async (tx) => {
      // 1. 更新订单状态
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: 'serving',
          startTime: new Date(),
          updatedAt: new Date(),
        },
      });

      // 2. 初始化所有菜品的优先级
      await this.initializeDishPriorities(id, tx);

      this.logger.log(`订单${id}已起菜`, {
        orderId: id,
        previousStatus: order.status,
        newStatus: 'serving',
      });

      return updatedOrder;
    });

    // 广播订单更新事件
    this.broadcastOrderEvent('order-updated', updatedOrder);

    return updatedOrder;
  }

  /**
   * 催菜 - 将订单状态更新为 urged
   */
  async urgeOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 验证状态转换
    if (!this.validateStatusTransition(order.status, 'urged')) {
      throw new Error(`无法从 ${order.status} 状态催菜`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: 'urged', updatedAt: new Date() },
    });

    this.broadcastOrderEvent('order-updated', updatedOrder);
    return updatedOrder;
  }

  /**
   * 恢复 - 催菜后上了一道菜时自动恢复为 serving
   */
  async resumeOrderAfterServe(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 只有在 urged 状态下才执行恢复逻辑
    if (order.status !== 'urged') {
      return order;
    }

    // 检查是否有已上菜的菜品
    const hasServedItems = order.orderItems.some(
      (item) => item.status === 'served',
    );

    if (hasServedItems) {
      const updatedOrder = await this.prisma.order.update({
        where: { id },
        data: { status: 'serving', updatedAt: new Date() },
      });

      this.broadcastOrderEvent('order-updated', updatedOrder);
      return updatedOrder;
    }

    return order;
  }

  /**
   * 完成订单 - 手动将订单状态更新为 done
   */
  async completeOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { orderItems: true },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查是否所有菜品都已上完
    const allItemsServed = order.orderItems.every(
      (item) => item.status === 'served',
    );

    if (!allItemsServed) {
      throw new Error('仍有菜品未上完，无法完成订单');
    }

    // 验证状态转换
    if (!this.validateStatusTransition(order.status, 'done')) {
      throw new Error(`无法从 ${order.status} 状态完成订单`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: 'done' },
    });

    this.broadcastOrderEvent('order-updated', updatedOrder);
    return updatedOrder;
  }
}
