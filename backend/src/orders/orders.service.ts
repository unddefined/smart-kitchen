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

    return await this.prisma.orderItem.create({
      data: {
        orderId,
        dishId: createOrderItemDto.dishId,
        quantity: createOrderItemDto.quantity || 1,
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

  async remove(id: number) {
    return await this.prisma.order.delete({ where: { id } });
  }
}