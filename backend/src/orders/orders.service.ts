import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Order } from '@prisma/client';
import { KitchenService } from '../kitchen/kitchen.service';
import { OrderItemsService } from '../order-items/order-items.service';
import { EventsGateway } from '../events.gateway';

// 查询参数类型
export interface FindAllQueryParams {
  status?: string;
  mealType?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  page?: number;
  size?: number;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private kitchenService: KitchenService,
    private orderItemsService: OrderItemsService,
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
   * 创建订单
   */
  async create(createOrderDto: Order) {
    this.logger.log('=== 开始创建订单 ===');
    this.logger.log('接收到的数据:', JSON.stringify(createOrderDto));

    // 解析 mealTime 和 mealType
    let mealTimeDate: Date | null = null;
    let mealTypeValue: 'lunch' | 'dinner' | 'breakfast' | 'other' | null = null;

    // 处理 mealTime（日期时间）
    if (createOrderDto.mealTime) {
      try {
        mealTimeDate = new Date(createOrderDto.mealTime);
        if (isNaN(mealTimeDate.getTime())) {
          throw new Error('无效的用餐时间格式');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(
          '用餐时间解析失败:',
          errorMessage,
          createOrderDto.mealTime,
        );
        throw new Error(
          `用餐时间格式错误：${typeof createOrderDto.mealTime === 'string' ? createOrderDto.mealTime : 'invalid date'}`,
        );
      }
    }

    // 处理 mealType（餐型）
    if (createOrderDto.mealType) {
      mealTypeValue = createOrderDto.mealType as
        | 'lunch'
        | 'dinner'
        | 'breakfast'
        | 'other';
    } else if (createOrderDto.mealTime) {
      // 兼容旧格式：从 mealTime 字符串中解析餐型
      const mealTimeStr = createOrderDto.mealTime.toString();
      if (mealTimeStr.includes('午餐')) {
        mealTypeValue = 'lunch';
      } else if (mealTimeStr.includes('晚餐')) {
        mealTypeValue = 'dinner';
      } else if (mealTimeStr.includes('早餐')) {
        mealTypeValue = 'breakfast';
      } else {
        mealTypeValue = 'other';
      }
    }

    this.logger.log(
      '解析后的值 - mealTime:',
      mealTimeDate,
      'mealType:',
      mealTypeValue,
    );

    const order = await this.prisma.order.create({
      data: {
        hallNumber: createOrderDto.hallNumber,
        peopleCount: createOrderDto.peopleCount,
        tableCount: createOrderDto.tableCount || 1,
        mealTime: mealTimeDate,
        mealType: mealTypeValue,
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    this.logger.log('订单创建成功 - ID:', order.id);

    return order;
  }

  /**
   * 查询所有订单（支持筛选）
   */
  async findAll(queryParams: FindAllQueryParams) {
    // 第一步：查询所有订单及其订单项
    const orders = await this.prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            dish: {
              include: {
                station: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 第二步：检查并更新每个订单的状态
    const updatedOrders = await Promise.all(
      orders.map(async (order) => {
        const updatedOrder =
          await this.kitchenService.checkAndUpdateOrderStatus(order);
        return {
          ...updatedOrder,
          orderItems: order.orderItems,
        };
      }),
    );

    // 第三步：应用筛选条件
    let filteredOrders = updatedOrders;

    // 按日期筛选
    if (queryParams.date) {
      const filterDateStr = queryParams.date;
      filteredOrders = filteredOrders.filter((order) => {
        if (!order.mealTime) return false;

        let orderDateStr: string;
        const mealTime = order.mealTime as Date | string;

        if (typeof mealTime === 'string') {
          orderDateStr = mealTime.split('T')[0];
        } else if (mealTime instanceof Date) {
          const d = mealTime;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          orderDateStr = `${year}-${month}-${day}`;
        } else {
          return false;
        }

        return orderDateStr === filterDateStr;
      });
    }

    // 按餐型筛选
    if (queryParams.mealType) {
      filteredOrders = filteredOrders.filter(
        (order) => order.mealType === queryParams.mealType,
      );
    }

    return filteredOrders;
  }

  /**
   * 查询单个订单
   */
  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            dish: {
              include: {
                station: true,
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    // 检查并可能更新订单状态
    const updatedOrder =
      await this.kitchenService.checkAndUpdateOrderStatus(order);
    return updatedOrder;
  }

  /**
   * 更新订单
   */
  async update(id: number, updateOrderDto: any) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 验证状态转换（如果更新状态）
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      if (
        !this.kitchenService.validateStatusTransition(
          order.status,
          updateOrderDto.status,
        )
      ) {
        throw new Error(
          `无法从 ${order.status} 状态更新为 ${updateOrderDto.status}`,
        );
      }
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        ...updateOrderDto,
        updatedAt: new Date(),
      },
    });

    // 广播订单更新事件（包括状态变更和非状态字段更新）
    this.broadcastOrderEvent('order-updated', updatedOrder);

    // 只有当状态变更时，才更新订单菜品
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      await this.kitchenService.updateOrderItemsByStatus(updatedOrder);
    }

    return updatedOrder;
  }

  /**
   * 取消订单
   */
  async cancelOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查订单状态，不能取消已完成的订单
    if (order.status === 'done' || order.status === 'cancelled') {
      throw new Error('无法取消已完成或已取消的订单');
    }

    const cancelledOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });

    return cancelledOrder;
  }

  /**
   * 起菜 - 委托给 KitchenService
   */
  async startServing(id: number) {
    return await this.kitchenService.startServing(id);
  }

  /**
   * 催菜 - 委托给 KitchenService
   */
  async urgeOrder(id: number) {
    return await this.kitchenService.urgeOrder(id);
  }

  /**
   * 恢复 - 委托给 KitchenService
   */
  async resumeOrderAfterServe(id: number) {
    return await this.kitchenService.resumeOrderAfterServe(id);
  }

  /**
   * 完成订单 - 委托给 KitchenService
   */
  async completeOrder(id: number) {
    return await this.kitchenService.completeOrder(id);
  }

  /**
   * 删除订单
   */
  async remove(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 使用事务同时删除订单及其关联项
    await this.prisma.$transaction(async (tx) => {
      // 删除所有订单项
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      // 删除订单本身
      await tx.order.delete({
        where: { id },
      });
    });

    // 返回成功消息
    return { success: true, message: '订单已删除', id };
  }

  // ========== 以下方法委托给 OrderItemsService ==========

  /**
   * 查询订单的所有菜品项
   */
  async findOrderItems(orderId: number) {
    return await this.orderItemsService.findOrderItems(orderId);
  }

  /**
   * 添加订单菜品项
   */
  async addOrderItem(orderId: number, createOrderItemDto: any) {
    return await this.orderItemsService.addOrderItem(
      orderId,
      createOrderItemDto,
    );
  }

  /**
   * 删除订单中的某个菜品项
   */
  async removeOrderItem(orderId: number, itemId: number) {
    return await this.orderItemsService.removeOrderItem(orderId, itemId);
  }

  /**
   * 更新订单中的某个菜品项
   */
  async updateOrderItem(orderId: number, itemId: number, updateData: any) {
    return await this.orderItemsService.updateOrderItem(
      orderId,
      itemId,
      updateData,
    );
  }
}
