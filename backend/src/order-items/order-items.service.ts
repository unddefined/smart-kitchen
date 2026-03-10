import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events.gateway';

@Injectable()
export class OrderItemsService {
  private readonly logger = new Logger(OrderItemsService.name);

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
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
   * 查询订单的所有菜品项
   */
  async findOrderItems(orderId: number) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId },
      include: { dish: true },
      orderBy: { createdAt: 'asc' },
    });

    // 调试日志
    this.logger.log(
      `查询订单 ${orderId} 的菜品项:`,
      items.map((item) => ({
        id: item.id,
        dishId: item.dishId,
        name: item.dish.name,
        weight: item.weight,
        quantity: item.quantity,
      })),
    );

    return items;
  }

  /**
   * 添加订单菜品项
   */
  async addOrderItem(orderId: number, createOrderItemDto: any) {
    // 首先验证订单是否存在
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 处理 quantity 字段
    let quantity = 1;
    if (createOrderItemDto.quantity !== undefined) {
      quantity = parseFloat(createOrderItemDto.quantity.toString());
      // 限制在合理范围内
      if (quantity < 1 || quantity > 99) {
        throw new Error('数量必须在 1 到 99 之间');
      }
    }

    const createdItem = await this.prisma.orderItem.create({
      data: {
        orderId,
        dishId: createOrderItemDto.dishId,
        quantity: quantity,
        weight: createOrderItemDto.weight || null,
        status: createOrderItemDto.status || 'pending',
        priority: createOrderItemDto.priority || 0,
        remark: createOrderItemDto.remark || null,
        createdAt: new Date(),
      },
      include: { dish: true },
    });

    // ✅ 优化：广播时包含订单 hallNumber 信息
    const broadcastData = {
      ...createdItem,
      hallNumber: order.hallNumber, // 添加厅号信息
    };
    this.broadcastItemEvent('item-created', broadcastData);

    return createdItem;
  }

  /**
   * 删除订单中的某个菜品项
   */
  async removeOrderItem(orderId: number, itemId: number) {
    // 首先验证订单是否存在
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 验证订单项是否存在且属于该订单
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!orderItem) {
      throw new Error('订单项不存在');
    }

    if (orderItem.orderId !== orderId) {
      throw new Error('订单项不属于该订单');
    }

    // 检查订单项状态，已上菜的菜品不能删除
    if (orderItem.status === 'served') {
      throw new Error('已上菜的菜品不能删除');
    }

    // ✅ 优化：在删除前查询订单项获取 dish 信息
    const itemWithDish = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { dish: true },
    });

    // 删除订单项
    const deletedItem = await this.prisma.orderItem.delete({
      where: { id: itemId },
    });

    // ✅ 广播时包含 dish 和 hallNumber 信息
    const broadcastData = {
      ...itemWithDish,
      hallNumber: order.hallNumber, // 添加厅号信息
    };
    this.broadcastItemEvent('item-deleted', broadcastData);

    return deletedItem;
  }

  /**
   * 更新订单中的某个菜品项
   */
  async updateOrderItem(orderId: number, itemId: number, updateData: any) {
    // 首先验证订单是否存在
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 验证订单项是否存在且属于该订单
    const orderItem = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
    });

    if (!orderItem) {
      throw new Error('订单项不存在');
    }

    if (orderItem.orderId !== orderId) {
      throw new Error('订单项不属于该订单');
    }

    // 检查订单项状态，已上菜的菜品不能修改
    if (orderItem.status === 'served') {
      throw new Error('已上菜的菜品不能修改');
    }

    // 构建更新数据对象
    const dataToUpdate: any = {};

    // 处理 quantity 字段
    if (updateData.quantity !== undefined) {
      let quantity = parseFloat(updateData.quantity.toString());
      if (quantity < 1 || quantity > 99) {
        throw new Error('数量必须在 1 到 99 之间');
      }
      quantity = Math.round(quantity * 10) / 10;
      dataToUpdate.quantity = quantity;
    }

    // 处理其他字段
    if (updateData.weight !== undefined) {
      dataToUpdate.weight = updateData.weight || null;
    }

    if (updateData.remark !== undefined) {
      dataToUpdate.remark = updateData.remark || null;
    }

    // 注意：priority 和 status 字段不能在 OrderItemsService.updateOrderItem 中更新
    // 原因：
    // 1. DishSelector 编辑弹窗中不提供这两个字段的 UI
    // 2. 优先级应由 KitchenService 根据业务规则自动管理
    // 3. 状态应通过专门的状态机接口（如催菜、起菜）来变更

    // 更新订单项
    const updatedItem = await this.prisma.orderItem.update({
      where: { id: itemId },
      data: dataToUpdate,
      include: { dish: true },
    });

    // 广播订单项更新事件
    this.broadcastItemEvent('item-updated', updatedItem);

    return updatedItem;
  }
}
