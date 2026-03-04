import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 检查并更新订单状态 - 如果订单进入用餐时间范围，自动将状态从 'created' 更新为 'started'
   * 如果订单已过用餐时间范围，自动将状态更新为 'cancelled'
   * 午餐：9:00-14:00
   * 晚餐：15:00-21:00
   */
  private async checkAndUpdateOrderStatus(order: any) {
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

  async create(createOrderDto: any) {
    // 解析 mealTime 和 mealType
    // 前端传递的 mealTime 格式："2026-03-03 午餐" 或 "2026-03-03 晚餐"
    let mealTimeDate = null;
    let mealTypeValue = null;

    if (createOrderDto.mealTime) {
      const mealTimeStr = createOrderDto.mealTime.toString();

      // 尝试提取日期部分和餐型
      const dateParts = mealTimeStr.split(' ');
      if (dateParts.length >= 1) {
        // 解析日期部分（格式：YYYY-MM-DD）
        const dateStr = dateParts[0];

        // 尝试多种日期格式解析
        try {
          // 如果是标准日期格式 YYYY-MM-DD
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            mealTimeDate = new Date(dateStr);

            // 如果有时分信息，也解析出来
            if (dateParts.length >= 2 && /^\d{2}:\d{2}/.test(dateParts[1])) {
              const timeStr = dateParts[1];
              const [hours, minutes] = timeStr.split(':').map(Number);
              mealTimeDate.setHours(hours, minutes, 0, 0);
            } else {
              // 默认设置为中午 12 点
              mealTimeDate.setHours(12, 0, 0, 0);
            }
          } else {
            // 尝试直接解析整个字符串
            mealTimeDate = new Date(mealTimeStr);
          }

          // 验证日期是否有效
          if (isNaN(mealTimeDate.getTime())) {
            throw new Error('无效的用餐时间格式');
          }
        } catch (error) {
          throw new Error(`用餐时间格式错误：${mealTimeStr}`);
        }
      }

      // 提取餐型（午餐/晚餐/其他）
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

    return await this.prisma.order.create({
      data: {
        hallNumber: createOrderDto.hallNumber,
        peopleCount: createOrderDto.peopleCount,
        tableCount: createOrderDto.tableCount,
        mealTime: mealTimeDate,
        mealType: mealTypeValue,
        status: 'created',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll(queryParams: any) {
    const orders = await this.prisma.order.findMany({
      include: {
        orderItems: true, // 先只包含 orderItems，不包含 dish
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 检查并更新每个订单的状态，然后手动获取每个订单项的菜品信息
    const updatedOrders = await Promise.all(
      orders.map(async (order) => {
        // 检查并可能更新订单状态
        const updatedOrder = await this.checkAndUpdateOrderStatus(order);

        const orderItemsWithDish = await Promise.all(
          updatedOrder.orderItems.map(async (item) => {
            const dish = item.dishId
              ? await this.prisma.dish.findUnique({
                  where: { id: item.dishId },
                  include: {
                    station: true,
                    category: true,
                  },
                })
              : null;

            return {
              ...item,
              dish,
            };
          }),
        );

        return {
          ...updatedOrder,
          orderItems: orderItemsWithDish,
        };
      }),
    );

    // 应用筛选条件
    let filteredOrders = updatedOrders;

    // 按日期筛选
    if (queryParams.date) {
      const filterDateStr = queryParams.date; // 格式："2026-03-04"

      filteredOrders = filteredOrders.filter((order) => {
        if (!order.mealTime) return false;

        // mealTime 是 Date 对象或 ISO 字符串 "2026-03-03T04:00:00.000Z"
        let orderDateStr;

        if (typeof order.mealTime === 'string') {
          // ISO 字符串格式：2026-03-03T04:00:00.000Z
          orderDateStr = order.mealTime.split('T')[0];
        } else if (order.mealTime instanceof Date) {
          // Date 对象
          const d = order.mealTime;
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
        orderItems: true,
      },
    });

    if (!order) {
      return null;
    }

    // 检查并可能更新订单状态
    const updatedOrder = await this.checkAndUpdateOrderStatus(order);

    // 手动获取每个订单项的菜品信息
    const orderItemsWithDish = await Promise.all(
      updatedOrder.orderItems.map(async (item) => {
        const dish = item.dishId
          ? await this.prisma.dish.findUnique({
              where: { id: item.dishId },
              include: {
                station: true,
                category: true,
              },
            })
          : null;

        return {
          ...item,
          dish,
        };
      }),
    );

    return {
      ...updatedOrder,
      orderItems: orderItemsWithDish,
    };
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
   * 只有 started 状态的订单可以起菜
   */
  async startServing(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new Error('订单不存在');
    }

    // 检查订单状态，只有 started 状态的订单可以起菜
    if (order.status !== 'started') {
      throw new Error('只有待起菜状态的订单可以起菜');
    }

    return await this.prisma.order.update({
      where: { id },
      data: {
        status: 'serving',
        startTime: new Date(),
        updatedAt: new Date(),
      },
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
    return this.prisma.$transaction(async (tx) => {
      // 删除所有订单项
      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      // 删除订单本身
      await tx.order.delete({
        where: { id },
      });
    });
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
}
