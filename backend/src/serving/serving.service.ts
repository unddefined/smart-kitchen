import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { OrderItemsService } from '../order-items/order-items.service';
import { KitchenService } from '../kitchen/kitchen.service';
import { EventsGateway } from '../events.gateway';

@Injectable()
export class ServingService {
  private readonly logger = new Logger(ServingService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private kitchenService: KitchenService,
    private orderItemsService: OrderItemsService,
    private ordersService: OrdersService,
  ) {}

  /**
   * 广播订单项事件到指定房间
   */
  private broadcastItemEvent(
    event: string,
    data: any,
    rooms: string[] = ['order-items', 'all'],
  ) {
    const timestamp = new Date().toISOString();
    rooms.forEach((room) => {
      this.eventsGateway.server.to(room).emit(event, { data, timestamp });
    });
    this.logger.log(`已广播 ${event} 事件到房间：${rooms.join(', ')}`);
  }

  /**
   * 计算菜品优先级 (与数据库函数保持一致)
   */
  private calculateDishPriority(
    categoryName: string,
    isAddedLater: boolean = false,
    basePriority: number = 0,
  ): number {
    // 如果是后来加菜的，优先级为 3 级 (催菜级别)
    if (isAddedLater) {
      return 3;
    }

    // 根据菜品分类设置默认优先级
    // 前菜：3 级，中菜：2 级，后菜：1 级，尾菜：1 级
    const priorityMap: Record<string, number> = {
      前菜: 3,
      中菜: 2,
      点心: 2, // 点心按中菜处理
      蒸菜: 2, // 蒸菜按中菜处理
      后菜: 1,
      尾菜: 1,
      凉菜: 3, // 凉菜按前菜处理
    };

    return priorityMap[categoryName] || basePriority;
  }

  /**
   * 自动调整订单中后续菜品的优先级 (按分类链式调整)
   * 当前面分类的所有菜都上完后，后面分类的菜自动 +1
   *
   * 分类优先级顺序：前菜/凉菜 (3) → 中菜/点心/蒸菜 (2) → 后菜 (1) → 尾菜 (1)
   */
  private async autoAdjustSubsequentPriorities(
    orderId: number,
    servedItemId: number,
  ) {
    try {
      // 获取订单的所有菜品 (包括已上菜的)
      const orderItems = await this.prisma.orderItem.findMany({
        where: { orderId },
        include: {
          dish: {
            include: {
              category: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (orderItems.length === 0) {
        return;
      }

      // 定义分类优先级顺序
      const categoryOrder: Record<string, number> = {
        前菜: 0,
        凉菜: 0,
        中菜: 1,
        点心: 1,
        蒸菜: 1,
        后菜: 2,
        尾菜: 3,
      };

      // 获取刚上完的菜品的分类
      const servedItem = orderItems.find((item) => item.id === servedItemId);
      if (!servedItem?.dish?.category?.name) {
        return;
      }

      const servedCategoryName = servedItem.dish.category.name;
      const servedCategoryLevel = categoryOrder[servedCategoryName];

      if (servedCategoryLevel === undefined) {
        return;
      }

      this.logger.log(
        `订单 ${orderId} 的 ${servedItem.dish.name} (${servedCategoryName}) 已上菜，检查是否需要调整后续分类优先级`,
      );

      // 检查当前分类是否所有菜都已上完（排除刚上完的那道）
      const itemsInSameCategory = orderItems.filter((item) => {
        const categoryName = item.dish?.category?.name;
        return (
          categoryName &&
          categoryOrder[categoryName] === servedCategoryLevel &&
          item.id !== servedItemId // 排除刚上完的这道菜
        );
      });

      const allServedInCategory = itemsInSameCategory.every(
        (item) => item.status === 'served' || item.status === 'cancelled',
      );

      // 如果当前分类还有未上完的菜，不调整
      if (!allServedInCategory) {
        this.logger.log(
          `订单 ${orderId} 的 ${servedCategoryName} 分类还有未上完的菜品，暂不调整`,
        );
        return;
      }

      this.logger.log(
        `订单 ${orderId} 的 ${servedCategoryName} 分类已全部上完，准备提升下一分类优先级`,
      );

      // 找到下一个分类级别
      const nextCategoryLevel = servedCategoryLevel + 1;
      const nextCategoryNames = Object.entries(categoryOrder)
        .filter(([_, level]) => level === nextCategoryLevel)
        .map(([name, _]) => name);

      if (nextCategoryNames.length === 0) {
        this.logger.log(`订单 ${orderId} 已是最后一个分类，无需调整`);
        return;
      }

      this.logger.log(
        `订单 ${orderId} 的下一分类为：${nextCategoryNames.join('、')}`,
      );

      // 获取下一个分类的所有未上菜菜品
      const itemsToUpgrade = orderItems.filter((item) => {
        const categoryName = item.dish?.category?.name;
        return (
          categoryName &&
          categoryOrder[categoryName] === nextCategoryLevel &&
          item.status !== 'served' &&
          item.status !== 'cancelled'
        );
      });

      if (itemsToUpgrade.length === 0) {
        this.logger.log(`订单 ${orderId} 的下一分类没有需要调整的菜品`);
        return;
      }

      // 遍历所有下一分类的菜品，提升优先级 (最高到 3)
      for (const item of itemsToUpgrade) {
        const currentPriority = item.priority || 0;
        const newPriority = Math.min(currentPriority + 1, 3);

        // 只有当优先级确实改变时才更新
        if (newPriority > currentPriority) {
          const updatedItem = await this.prisma.orderItem.update({
            where: { id: item.id },
            data: { priority: newPriority },
          });

          // 广播订单项状态更新事件
          this.broadcastItemEvent('item-updated', updatedItem);

          this.logger.log(
            `订单${orderId}的${item.dish.name}优先级从 ${currentPriority} 提升到 ${newPriority}`,
            {
              orderId,
              itemId: item.id,
              dishName: item.dish.name,
              categoryName: item.dish?.category?.name,
              oldPriority: currentPriority,
              newPriority,
            },
          );
        }
      }

      this.logger.log(
        `订单 ${orderId} 完成优先级调整，共提升 ${itemsToUpgrade.length} 个菜品`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this.logger.error(`调整后续菜品优先级失败：${errorMessage}`, {
        orderId,
        servedItemId,
      });
      // 不抛出异常，避免影响主流程
    }
  }

  // 获取订单详情
  async getOrder(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            dish: true,
          },
        },
      },
    });
    return order;
  }

  // 获取所有订单
  async getAllOrders() {
    const orders = await this.prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            dish: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return orders;
  }

  // 获取订单项详情
  async getOrderItem(itemId: number) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        order: true,
        dish: true,
      },
    });
    return item;
  }

  // 更新订单项状态
  async updateOrderItemStatus(itemId: number, status: string) {
    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });
    return updatedItem;
  }

  // 更新订单项优先级
  async updateOrderItemPriority(itemId: number, priority: number) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('订单项不存在');
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { priority },
    });

    return updatedItem;
  }

  /**
   * 开始制作菜品（pending → preparing）
   * 验证状态流转合法性并更新状态
   */
  async startDishPreparation(itemId: number) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: {
        dish: true,
      },
    });

    if (!item) {
      throw new Error('订单项不存在');
    }

    // 验证当前状态是否为 pending
    if (item.status !== 'pending') {
      throw new Error(
        `只有待制作状态的菜品才能开始制作，当前状态为 ${item.status}`,
      );
    }

    // 更新状态为 preparing
    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: 'preparing',
      },
    });

    this.broadcastItemEvent('item-updated', updatedItem);

    this.logger.log(
      `订单菜品 ${itemId} (${item.dish.name}) 开始制作：pending → preparing`,
    );

    return updatedItem;
  }

  // 标记订单项为已出菜
  async markAsServed(itemId: number) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('订单项不存在');
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: 'served',
        servedAt: new Date(),
      },
    });

    this.broadcastItemEvent('item-updated', updatedItem);

    return updatedItem;
  }

  // 获取待处理的订单项
  async getPendingItems() {
    const items = await this.prisma.orderItem.findMany({
      where: {
        status: 'pending',
      },
      include: {
        order: true,
        dish: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
    return items;
  }

  // 获取已出菜的订单项
  async getServedItems() {
    const items = await this.prisma.orderItem.findMany({
      where: {
        status: 'served',
      },
      include: {
        order: true,
        dish: true,
      },
      orderBy: {
        servedAt: 'desc',
      },
    });
    return items;
  }

  // 获取订单出餐状态
  async getOrderServingStatus(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            dish: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 计算各种状态的菜品数量
    const pendingCount = order.orderItems.filter(
      (item) => item.status === 'pending',
    ).length;
    const preparingCount = order.orderItems.filter(
      (item) => item.status === 'preparing',
    ).length;
    const readyCount = order.orderItems.filter(
      (item) => item.status === 'ready',
    ).length;
    const servedCount = order.orderItems.filter(
      (item) => item.status === 'served',
    ).length;

    return {
      orderId: order.id,
      hallNumber: order.hallNumber,
      status: order.status,
      itemCount: {
        pending: pendingCount,
        preparing: preparingCount,
        ready: readyCount,
        served: servedCount,
        total: order.orderItems.length,
      },
      items: order.orderItems.map((item) => ({
        id: item.id,
        dishName: item.dish.name,
        quantity: Number(item.quantity), // 转换为 number 类型
        status: item.status,
        priority: item.priority,
        createdAt: item.createdAt,
      })),
    };
  }

  // 更新菜品优先级（催菜功能）
  async updateItemPriority(itemId: number, priority: number, reason?: string) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true, dish: true },
    });

    if (!item) {
      throw new Error('订单菜品不存在');
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { priority },
    });

    // 记录催菜日志
    this.logger.log(
      `催菜：订单${item.order.hallNumber}的${item.dish.name}优先级调整为${priority}`,
      {
        orderId: item.orderId,
        dishId: item.dishId,
        priority,
        reason,
      },
    );

    // 广播订单项优先级更新事件
    this.broadcastItemEvent('item-updated', updatedItem);

    return {
      success: true,
      itemId: updatedItem.id,
      priority: updatedItem.priority,
      message: `菜品${item.dish.name}优先级已更新`,
    };
  }

  // 标记菜品制作完成
  async completeDishPreparation(itemId: number) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true, dish: true },
    });

    if (!item) {
      throw new Error('订单菜品不存在');
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: { status: 'ready' },
    });

    this.logger.log(
      `菜品制作完成：订单${item.order.hallNumber}的${item.dish.name}`,
      {
        orderId: item.orderId,
        dishId: item.dishId,
      },
    );

    // 广播订单项状态更新事件
    this.broadcastItemEvent('item-updated', updatedItem);

    return {
      success: true,
      itemId: updatedItem.id,
      status: updatedItem.status,
      message: `菜品${item.dish.name}制作完成`,
    };
  }

  // 标记菜品已上菜（批量）
  async serveDishes(itemIds: number[]) {
    if (!itemIds || itemIds.length === 0) {
      throw new Error('菜品 ID 列表不能为空');
    }

    return await this.prisma.$transaction(async (tx) => {
      const results = [];

      for (const itemId of itemIds) {
        try {
          const item = await tx.orderItem.findUnique({
            where: { id: itemId },
            include: { order: true, dish: true },
          });

          if (!item) {
            this.logger.warn(`订单项 ${itemId} 不存在，跳过`);
            continue;
          }

          // 检查优先级
          if (item.priority === 0) {
            this.logger.warn(
              `菜品"${item.dish.name}"(ID: ${itemId}) 还未起菜，跳过`,
            );
            results.push({
              success: false,
              itemId,
              message: `菜品"${item.dish.name}"还未起菜，无法上菜`,
            });
            continue;
          }

          // 更新状态
          const updatedItem = await tx.orderItem.update({
            where: { id: itemId },
            data: {
              status: 'served',
              priority: -1,
              servedAt: new Date(),
            },
          });

          this.logger.log(
            `批量上菜：订单${item.order.hallNumber}的${item.dish.name}`,
            {
              orderId: item.orderId,
              dishId: item.dishId,
            },
          );

          results.push({
            success: true,
            itemId: updatedItem.id,
            status: updatedItem.status,
            priority: updatedItem.priority,
            servedAt: updatedItem.servedAt,
            message: `菜品${item.dish.name}已上菜`,
          });

          // 广播订单项状态更新事件
          this.broadcastItemEvent('item-updated', updatedItem);

          // 处理订单状态
          if (item.order.status === 'urged') {
            try {
              await this.ordersService.resumeOrderAfterServe(item.orderId);
              this.logger.log(`订单 ${item.orderId} 已自动恢复为 serving 状态`);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : '未知错误';
              this.logger.error(`恢复订单状态失败：${errorMessage}`);
            }
          }

          // 上菜后，自动调整后续菜品优先级（链式提升）
          // 根据 MVP文档：当前面分类的所有菜都上完后，后面分类的菜自动 +1
          await this.autoAdjustSubsequentPriorities(item.orderId, item.id);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '未知错误';
          this.logger.error(`批量上菜失败 (ID: ${itemId}): ${errorMessage}`);
          results.push({
            success: false,
            itemId,
            message: errorMessage,
          });
        }
      }

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      this.logger.log(
        `批量上菜完成：成功${successCount}个，失败${failCount}个`,
      );

      return {
        success: true,
        total: itemIds.length,
        successCount,
        failCount,
        results,
        message: `批量上菜完成：成功${successCount}个，失败${failCount}个`,
      };
    });
  }

  // 标记菜品已上菜（单个）
  async serveDish(itemId: number) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true, dish: true },
    });

    if (!item) {
      throw new Error('订单菜品不存在');
    }

    // 根据 MVP文档，优先级为 0 的菜品（未起）不能直接上菜
    if (item.priority === 0) {
      throw new Error(`菜品"${item.dish.name}"还未起菜，无法上菜。`);
    }

    // 使用事务同时更新菜品状态和优先级
    return await this.prisma.$transaction(async (tx) => {
      // 1. 检查菜品是否需要预处理
      // 如果 needPrep 为 false，且当前状态为 pending，则跳过 prep 阶段直接进入 ready
      const nextStatus = 'served';

      // 记录日志
      this.logger.log(
        `准备上菜：订单${item.order.hallNumber}的${item.dish.name}，needPrep=${item.dish.needPrep}, 当前状态=${item.status}`,
      );

      // 2. 更新菜品状态为 served，并设置优先级为 -1
      const updatedItem = await tx.orderItem.update({
        where: { id: itemId },
        data: {
          status: nextStatus,
          priority: -1, // 上菜后优先级设为 -1
          servedAt: new Date(),
        },
      });

      this.logger.log(
        `菜品已上菜：订单${item.order.hallNumber}的${item.dish.name}`,
        {
          orderId: item.orderId,
          dishId: item.dishId,
          newPriority: -1,
        },
      );

      // 3. 广播订单项状态更新事件
      this.broadcastItemEvent('item-updated', updatedItem);

      // 4. 如果订单状态为 urged，检查是否需要恢复为 serving
      if (item.order.status === 'urged') {
        try {
          await this.ordersService.resumeOrderAfterServe(item.orderId);
          this.logger.log(`订单 ${item.orderId} 已自动恢复为 serving 状态`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '未知错误';
          this.logger.error(`恢复订单状态失败：${errorMessage}`);
        }
      }

      // 5. 上菜后，自动调整后续菜品优先级（链式提升）
      // 根据 MVP文档：当前面分类的所有菜都上完后，后面分类的菜自动 +1
      await this.autoAdjustSubsequentPriorities(item.orderId, item.id);

      return {
        success: true,
        itemId: updatedItem.id,
        status: updatedItem.status,
        priority: updatedItem.priority,
        servedAt: updatedItem.servedAt,
        message: `菜品${item.dish.name}已上菜`,
      };
    });
  }

  // 自动调整订单优先级
  async autoAdjustOrderPriorities(orderId: number) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });

    // 实现优先级自动调整逻辑
    // 这里可以根据业务规则调整优先级
    const adjustments: Array<{
      itemId: number;
      oldPriority: number;
      newPriority: number;
    }> = [];

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      // 示例：后来加的菜优先级设为3
      if (Date.now() - new Date(item.createdAt).getTime() > 10 * 60 * 1000) {
        // 10分钟后
        if (item.priority < 3) {
          await this.prisma.orderItem.update({
            where: { id: item.id },
            data: { priority: 3 },
          });
          adjustments.push({
            itemId: item.id,
            oldPriority: item.priority,
            newPriority: 3,
          });
        }
      }
    }

    return {
      success: true,
      orderId,
      adjustments,
      message: `订单${orderId}优先级自动调整完成`,
    };
  }

  // 获取所有出餐提醒
  async getServingAlerts() {
    // 获取需要提醒的菜品（如超时未制作、催菜等）
    const urgentItems = await this.prisma.orderItem.findMany({
      where: {
        OR: [
          { priority: 3 }, // 催菜
          {
            AND: [
              { status: 'pending' },
              { createdAt: { lte: new Date(Date.now() - 30 * 60 * 1000) } }, // 30分钟未处理
            ],
          },
        ],
      },
      include: {
        order: true,
        dish: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    return urgentItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      dishName: item.dish.name,
      hallNumber: item.order.hallNumber,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt,
      isOverdue:
        Date.now() - new Date(item.createdAt).getTime() > 30 * 60 * 1000,
      quantity: Number(item.quantity), // 转换为 number 类型
    }));
  }

  // 检测紧急菜品（催菜检测）
  async detectUrgentDishes() {
    const urgentItems = await this.prisma.orderItem.findMany({
      where: {
        priority: 3,
        status: { not: 'served' },
      },
      include: {
        order: true,
        dish: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return urgentItems.map((item) => ({
      id: item.id,
      orderId: item.orderId,
      dishName: item.dish.name,
      hallNumber: item.order.hallNumber,
      priority: item.priority,
      status: item.status,
      createdAt: item.createdAt,
      quantity: Number(item.quantity), // 转换为 number 类型
    }));
  }
}
