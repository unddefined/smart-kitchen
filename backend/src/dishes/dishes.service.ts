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
      orderBy: {
        category: {
          displayOrder: 'asc'
        }
      }
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
      orderBy: {
        category: {
          displayOrder: 'asc'
        }
      }
    });
  }

  async findByStation(stationId: number) {
    return this.prisma.dish.findMany({
      where: { stationId },
      include: {
        station: true,
        category: true,
      },
      orderBy: {
        category: {
          displayOrder: 'asc'
        }
      }
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
      orderBy: {
        category: {
          displayOrder: 'asc'
        }
      }
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
      orderBy: {
        category: {
          displayOrder: 'asc'
        }
      }
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

  /**
   * 获取按上菜顺序排序的所有分类
   */
  async getCategoriesInServingOrder() {
    return this.prisma.dishCategory.findMany({
      orderBy: {
        displayOrder: 'asc'
      }
    });
  }

  /**
   * 获取按上菜顺序排序的菜品（分组）
   */
  async getDishesGroupedByCategory() {
    const categories = await this.getCategoriesInServingOrder();
    const result = [];

    for (const category of categories) {
      const dishes = await this.prisma.dish.findMany({
        where: { 
          categoryId: category.id,
          isActive: true
        },
        include: {
          station: true
        },
        orderBy: [
          { name: 'asc' }  // 同一类别的菜品按名称排序
        ]
      });

      if (dishes.length > 0) {
        result.push({
          category: {
            id: category.id,
            name: category.name,
            displayOrder: category.displayOrder
          },
          dishes: dishes
        });
      }
    }

    return result;
  }
}