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

  async findByCategory(categoryId: number) {
    return this.prisma.dish.findMany({
      where: { categoryId },
      include: {
        station: true,
        category: true,
      },
    });
  }

  async findByStation(stationId: number) {
    return this.prisma.dish.findMany({
      where: { stationId },
      include: {
        station: true,
        category: true,
      },
    });
  }

  async create(data: any) {
    return this.prisma.dish.create({
      data,
      include: {
        station: true,
        category: true,
      },
    });
  }

  async update(id: number, data: any) {
    return this.prisma.dish.update({
      where: { id },
      data,
      include: {
        station: true,
        category: true,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.dish.delete({
      where: { id },
    });
  }

  async searchByName(name: string) {
    return this.prisma.dish.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      include: {
        station: true,
        category: true,
      },
    });
  }

  /**
   * 根据预处理需求筛选菜品
   */
  async findByPrepRequirement(needPrep: boolean) {
    return this.prisma.dish.findMany({
      where: { needPrep },
      include: {
        station: true,
        category: true,
      },
    });
  }

  /**
   * 批量更新菜品的预处理需求
   */
  async batchUpdatePrepRequirement(dishIds: number[], needPrep: boolean) {
    return this.prisma.dish.updateMany({
      where: {
        id: {
          in: dishIds,
        },
      },
      data: {
        needPrep,
      },
    });
  }
}