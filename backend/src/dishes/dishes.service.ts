import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DishesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.dish.findMany({
      include: {
        station: true,
        category: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.dish.findUnique({
      where: { id },
      include: {
        station: true,
        category: true,
      },
    });
  }

  async create(data: any) {
    return this.prisma.dish.create({
      data,
    });
  }

  async update(id: number, data: any) {
    return this.prisma.dish.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.dish.delete({
      where: { id },
    });
  }
}
