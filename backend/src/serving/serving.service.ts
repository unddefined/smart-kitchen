import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class ServingService {
  private readonly logger = new Logger(ServingService.name);
  private readonly ordersService: OrdersService;

  constructor(private prisma: PrismaService) {
    this.ordersService = new OrdersService(prisma);
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
   * 自动调整订单中后续菜品的优先级
   * 当某道菜上完后，该订单后面的菜自动 +1
   */
  private async autoAdjustSubsequentPriorities(
    orderId: number,
    servedItemId: number,
  ) {
    try {
      // 获取订单的所有未上菜菜品
      const orderItems = await this.prisma.orderItem.findMany({
        where: {
          orderId,
          status: {
            notIn: ['served', 'cancelled'],
          },
        },
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

      this.logger.log(
        `开始调整订单 ${orderId} 的后续菜品优先级，共 ${orderItems.length} 个菜品`,
      );

      // 遍历所有未上菜的菜品，提升优先级 (最高到 3)
      for (const item of orderItems) {
        const currentPriority = item.priority || 0;

        // 如果当前优先级小于 3，则 +1
        if (currentPriority < 3) {
          const newPriority = Math.min(currentPriority + 1, 3);

          await this.prisma.orderItem.update({
            where: { id: item.id },
            data: { priority: newPriority },
          });

          this.logger.log(
            `订单${orderId}的${item.dish.name}优先级从 ${currentPriority} 提升到 ${newPriority}`,
            {
              orderId,
              itemId: item.id,
              dishName: item.dish.name,
              oldPriority: currentPriority,
              newPriority,
            },
          );
        }
      }
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

  // 更新订单状态
  async updateOrderStatus(orderId: number, status: string) {
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    return updatedOrder;
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
      `催菜: 订单${item.order.hallNumber}的${item.dish.name}优先级调整为${priority}`,
      {
        orderId: item.orderId,
        dishId: item.dishId,
        priority,
        reason,
      },
    );

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
      `菜品制作完成: 订单${item.order.hallNumber}的${item.dish.name}`,
      {
        orderId: item.orderId,
        dishId: item.dishId,
      },
    );

    return {
      success: true,
      itemId: updatedItem.id,
      status: updatedItem.status,
      message: `菜品${item.dish.name}制作完成`,
    };
  }

  // 标记菜品已上菜
  async serveDish(itemId: number) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { order: true, dish: true },
    });

    if (!item) {
      throw new Error('订单菜品不存在');
    }

    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: {
        status: 'served',
        servedAt: new Date(),
      },
    });

    this.logger.log(
      `菜品已上菜：订单${item.order.hallNumber}的${item.dish.name}`,
      {
        orderId: item.orderId,
        dishId: item.dishId,
      },
    );

    // 如果订单状态为 urged，检查是否需要恢复为 serving
    if (item.order.status === 'urged') {
      const ordersService = new OrdersService(this.prisma);
      try {
        await ordersService.resumeOrderAfterServe(item.orderId);
        this.logger.log(`订单 ${item.orderId} 已自动恢复为 serving 状态`);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '未知错误';
        this.logger.error(`恢复订单状态失败：${errorMessage}`);
      }
    }

    // 上菜后，自动调整该订单后续菜品的优先级
    await this.autoAdjustSubsequentPriorities(item.orderId, item.id);

    return {
      success: true,
      itemId: updatedItem.id,
      status: updatedItem.status,
      servedAt: updatedItem.servedAt,
      message: `菜品${item.dish.name}已上菜`,
    };
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
