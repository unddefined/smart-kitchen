import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: any) {
    return await this.prisma.order.create({
      data: {
        hallNumber: createOrderDto.hallNumber,
        peopleCount: createOrderDto.peopleCount,
        tableCount: createOrderDto.tableCount,
        mealTime: createOrderDto.mealTime,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll() {
    return await this.prisma.order.findMany({
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
  }

  async findOne(id: number) {
    return await this.prisma.order.findUnique({
      where: { id },
      include: {
        orderItems: {
          include: {
            dish: true,
          },
        },
      },
    });
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