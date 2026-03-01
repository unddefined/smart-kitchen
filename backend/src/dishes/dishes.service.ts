import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DishesService {
  private readonly logger = new Logger(DishesService.name);

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
    this.logger.debug('获取分类排序');
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
    this.logger.debug('开始获取分组菜品数据');
    
    try {
      const categories = await this.getCategoriesInServingOrder();
      this.logger.debug(`获取到 ${categories.length} 个分类`);
      
      const result = [];

      for (const category of categories) {
        this.logger.debug(`处理分类: ${category.name} (ID: ${category.id})`);
        
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

        this.logger.debug(`分类 ${category.name} 包含 ${dishes.length} 个菜品`);

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

      this.logger.debug(`返回 ${result.length} 个分组`);
      return result;
    } catch (error) {
      this.logger.error('获取分组菜品失败:', error);
      throw error;
    }
  }
}