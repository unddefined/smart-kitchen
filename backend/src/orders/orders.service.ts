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
