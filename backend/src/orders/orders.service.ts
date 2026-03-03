import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

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

  async findAll() {
    const orders = await this.prisma.order.findMany({
      include: {
        orderItems: true, // 先只包含 orderItems，不包含 dish
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 手动获取每个订单项的菜品信息，避免 IN (NULL) 查询
    const ordersWithDishes = await Promise.all(
      orders.map(async (order) => {
        const orderItemsWithDish = await Promise.all(
          order.orderItems.map(async (item) => {
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
          ...order,
          orderItems: orderItemsWithDish,
        };
      }),
    );

    return ordersWithDishes;
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

    // 手动获取每个订单项的菜品信息
    const orderItemsWithDish = await Promise.all(
      order.orderItems.map(async (item) => {
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
      ...order,
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

  async remove(id: number) {
    return await this.prisma.order.delete({ where: { id } });
  }
}
