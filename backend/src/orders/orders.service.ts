import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Order } from '@prisma/client';

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
  constructor(private prisma: PrismaService) {}

  /**
   * 检查并更新订单状态 - 如果订单进入用餐时间范围，自动将状态从 'created' 更新为 'started'
   * 如果订单已过用餐时间范围，自动将状态更新为 'cancelled'
   * 午餐：9:00-14:00
   * 晚餐：15:00-21:00
   */
  private async checkAndUpdateOrderStatus(order: Order) {
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
      const lunchStart = 9 * 60; // 9:00 = 540 分钟
      const lunchEnd = 14 * 60; // 14:00 = 840 分钟

      if (currentTimeInMinutes > lunchEnd) {
        // 已过午餐时间
        isExpired = true;
      } else if (
        currentTimeInMinutes >= lunchStart &&
        currentTimeInMinutes <= lunchEnd
      ) {
        // 在午餐时间内
        shouldStart = true;
      }
    } else if (isDinner) {
      // 晚餐时间范围：15:00-21:00
      const dinnerStart = 15 * 60; // 15:00 = 900 分钟
      const dinnerEnd = 20 * 60; // 20:00 = 1200 分钟

      if (currentTimeInMinutes > dinnerEnd) {
        // 已过晚餐时间
        isExpired = true;
      } else if (
        currentTimeInMinutes >= dinnerStart &&
        currentTimeInMinutes <= dinnerEnd
      ) {
        // 在晚餐时间内
        shouldStart = true;
      }
    } else {
      // 其他类型（早餐等），默认在用餐时间开始后即可起菜
      shouldStart = now >= mealTime;
    }

    // 如果已过期，更新状态为 'cancelled'
    if (isExpired) {
      return await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'cancelled',
          updatedAt: now,
        },
      });
    }

    // 如果在用餐时间范围内且当前状态是 created，更新状态为 'started'
    if (shouldStart && order.status === 'created') {
      return await this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'started',
          updatedAt: now,
        },
      });
    }

    return order;
  }

  async create(createOrderDto: Order) {
    this.logger.log('=== 开始创建订单 ===');
    this.logger.log('接收到的数据:', JSON.stringify(createOrderDto));

    // 解析 mealTime 和 mealType
    // 前端现在直接传递 mealTime (ISO 日期字符串) 和 mealType ('lunch'/'dinner')
    let mealTimeDate: Date | null = null;
    let mealTypeValue: 'lunch' | 'dinner' | 'breakfast' | 'other' | null = null;

    // 处理 mealTime（日期时间）
    if (createOrderDto.mealTime) {
      try {
        // 如果是 ISO 字符串或 Date 对象，直接创建 Date
        mealTimeDate = new Date(createOrderDto.mealTime);

        // 验证日期是否有效
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 第二步：检查并更新每个订单的状态
    const updatedOrders = await Promise.all(
      orders.map(async (order) => {
        const updatedOrder = await this.checkAndUpdateOrderStatus(order);
        return updatedOrder;
      }),
    );

    // 第三步：应用筛选条件
    let filteredOrders = updatedOrders;

    // 按日期筛选
    if (queryParams.date) {
      const filterDateStr = queryParams.date; // 格式："2026-03-04"

      filteredOrders = filteredOrders.filter((order) => {
        if (!order.mealTime) return false;

        // mealTime 是 Date 对象或 ISO 字符串 "2026-03-03T04:00:00.000Z"
        let orderDateStr: string;

        const mealTime = order.mealTime as Date | string;

        if (typeof mealTime === 'string') {
          // ISO 字符串格式：2026-03-03T04:00:00.000Z
          orderDateStr = mealTime.split('T')[0];
        } else if (mealTime instanceof Date) {
          // Date 对象
          const d = mealTime;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          orderDateStr = `${year}-${month}-${day}`;
        } else {
          return false;
        }

        // 比较日期字符串
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
    const updatedOrder = await this.checkAndUpdateOrderStatus(order);
    return updatedOrder;
  }

  async findOrderItems(orderId: number) {
    return await this.prisma.orderItem.findMany({
      where: { orderId },
      include: {
        dish: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async addOrderItem(orderId: number, createOrderItemDto: any) {
    // 首先验证订单是否存在
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 处理quantity字段，支持一位小数
    let quantity = 1.0;
    if (createOrderItemDto.quantity !== undefined) {
      quantity = parseFloat(createOrderItemDto.quantity.toString());
      // 限制在合理范围内
      if (quantity < 0.1 || quantity > 99.9) {
        throw new Error('数量必须在0.1到99.9之间');
      }
      // 保留一位小数
      quantity = Math.round(quantity * 10) / 10;
    }

    return await this.prisma.orderItem.create({
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
      include: {
        dish: true,
      },
    });
  }

  async update(id: number, updateOrderDto: any) {
    return await this.prisma.order.update({
      where: { id },
      data: {
        ...updateOrderDto,
        updatedAt: new Date(),
      },
    });
  }

  async cancelOrder(id: number) {
    // 首先验证订单是否存在
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

    return await this.prisma.order.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 起菜 - 将订单状态更新为 serving 并设置起菜时间
   * 同时初始化菜品优先级：前菜 3 级，中菜 2 级，后菜/尾菜 1 级
   */
  async startServing(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            dish: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查订单状态，只有 started 状态的订单可以起菜
    if (order.status !== 'started') {
      throw new Error('只有待起菜状态的订单可以起菜');
    }

    // 使用事务更新订单状态和菜品优先级
    return await this.prisma.$transaction(async (tx) => {
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
      const priorityMap: Record<string, number> = {
        前菜: 3,
        中菜: 2,
        点心: 2,
        蒸菜: 2,
        后菜: 1,
        尾菜: 1,
        凉菜: 3,
      };

      // 更新每个订单项的优先级
      for (const item of order.orderItems) {
        if (item.dish?.category?.name) {
          const categoryName = item.dish.category.name;
          const priority = priorityMap[categoryName] || 0;

          await tx.orderItem.update({
            where: { id: item.id },
            data: { priority },
          });

          this.logger.log(
            `订单${id}的${item.dish.name}( ${categoryName}) 设置优先级为 ${priority}`,
            {
              orderId: id,
              itemId: item.id,
              dishName: item.dish.name,
              categoryName,
              priority,
            },
          );
        }
      }

      return updatedOrder;
    });
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

    // 检查订单状态，只有 serving 状态的订单可以催菜
    if (order.status !== 'serving') {
      throw new Error('只有出餐中的订单可以催菜');
    }

    // 只更新订单状态为 urged
    return await this.prisma.order.update({
      where: { id },
      data: {
        status: 'urged',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 暂停 - 将订单状态更新为 started
   * 可以从 serving 或 urged 状态切换到 started
   */
  async pauseOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查订单状态，只有 serving 或 urged 状态的订单可以暂停
    if (order.status !== 'serving' && order.status !== 'urged') {
      throw new Error('只有出餐中或催菜状态的订单可以暂停');
    }

    return await this.prisma.order.update({
      where: { id },
      data: {
        status: 'started',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 恢复 - 催菜后上了一道菜时自动恢复为 serving
   * 当 status = 'urged' 并在上了一道菜后，该订单的 status = 'serving'
   */
  async resumeOrderAfterServe(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
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
      // 恢复订单状态为 serving
      return await this.prisma.order.update({
        where: { id },
        data: {
          status: 'serving',
          updatedAt: new Date(),
        },
      });
    }

    return order;
  }

  async remove(id: number) {
    // 首先验证订单是否存在
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

  /**
   * 完成订单 - 手动将订单状态更新为 done
   * 当订单的所有菜品都上完后，也可以手动确认完成
   */
  async completeOrder(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
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

    return await this.prisma.order.update({
      where: { id },
      data: {
        status: 'done',
        updatedAt: new Date(),
      },
    });
  }

  /**
   * 删除订单中的某个菜品项
   * @param orderId 订单 ID
   * @param itemId 订单项 ID
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

    // 删除订单项
    return await this.prisma.orderItem.delete({
      where: { id: itemId },
    });
  }
}
