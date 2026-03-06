import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DishesService {
  private readonly logger = new Logger(DishesService.name);

  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.dish.findMany({
      where: {
        isActive: true, // 只返回活跃的菜品
      },
      include: {
        station: true,
        category: true,
      },
      orderBy: {
        category: {
          displayOrder: 'asc',
        },
      },
    });
  }

  async findOne(id: number) {
    // Prisma schema 中 id 是 Int 类型，需要确保传入的是有效整数
    const idNumber = Number(id);

    if (!idNumber || !Number.isInteger(idNumber) || idNumber <= 0) {
      throw new Error(`无效的菜品 ID: ${id}`);
    }

    return this.prisma.dish.findUnique({
      where: { id: idNumber },
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
          displayOrder: 'asc',
        },
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
      orderBy: {
        category: {
          displayOrder: 'asc',
        },
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
      where: { id: Number(id) }, // 确保 id 是数字类型
      data,
      include: {
        station: true,
        category: true,
      },
    });
  }

  async remove(id: number) {
    // 检查该菜品是否被订单关联
    const orderItemCount = await this.prisma.orderItem.count({
      where: {
        dishId: Number(id), // 确保传入的是数字类型
      },
    });

    if (orderItemCount > 0) {
      // 如果有关联订单，使用软删除：将 isActive 设置为 false
      // 这样可以保留订单历史数据的完整性
      return this.prisma.dish.update({
        where: { id: Number(id) }, // 确保 id 是数字类型
        data: { isActive: false },
        include: {
          station: true,
          category: true,
        },
      });
    } else {
      // 如果没有关联订单，直接从数据库删除
      return this.prisma.dish.delete({
        where: { id: Number(id) }, // 确保 id 是数字类型
      });
    }
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
          displayOrder: 'asc',
        },
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
      orderBy: {
        category: {
          displayOrder: 'asc',
        },
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

  /**
   * 获取按上菜顺序排序的所有分类
   */
  async getCategoriesInServingOrder() {
    this.logger.log('获取分类排序...');
    try {
      const categories = await this.prisma.dishCategory.findMany({
        orderBy: {
          displayOrder: 'asc',
        },
      });
      this.logger.log(`成功获取 ${categories.length} 个分类`);
      return categories;
    } catch (error) {
      this.logger.error('获取分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取按上菜顺序排序的菜品（分组）
   */
  async getDishesGroupedByCategory() {
    this.logger.log('开始获取分组菜品数据');

    try {
      this.logger.log('获取分类排序...');
      const categories = await this.getCategoriesInServingOrder();
      this.logger.log(`获取到 ${categories.length} 个分类`);

      const result = [];

      for (const category of categories) {
        this.logger.log(`处理分类：${category.name} (ID: ${category.id})`);

        try {
          const dishes = await this.prisma.dish.findMany({
            where: {
              categoryId: category.id,
              isActive: true,
            },
            include: {
              station: true,
            },
            orderBy: [
              { name: 'asc' }, // 同一类别的菜品按名称排序
            ],
          });

          this.logger.log(`分类 ${category.name} 包含 ${dishes.length} 个菜品`);

          if (dishes.length > 0) {
            result.push({
              category: {
                id: category.id,
                name: category.name,
                displayOrder: category.displayOrder,
              },
              dishes: dishes,
            });
          }
        } catch (dishError) {
          this.logger.error(`获取分类 ${category.name} 的菜品失败:`, dishError);
          throw dishError;
        }
      }

      this.logger.log(`返回 ${result.length} 个分组`);
      return result;
    } catch (error) {
      this.logger.error('获取分组菜品失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有工位
   */
  async findAllStations() {
    this.logger.log('获取所有工位...');
    try {
      const stations = await this.prisma.station.findMany({
        orderBy: {
          name: 'asc', // 使用 name 字段排序
        },
      });
      this.logger.log(`成功获取 ${stations.length} 个工位`);
      return stations;
    } catch (error) {
      this.logger.error('获取工位失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有分类
   */
  async findAllCategories() {
    this.logger.log('获取所有分类...');
    try {
      const categories = await this.prisma.dishCategory.findMany({
        orderBy: {
          displayOrder: 'asc',
        },
      });
      this.logger.log(`成功获取 ${categories.length} 个分类`);
      return categories;
    } catch (error) {
      this.logger.error('获取分类失败:', error);
      throw error;
    }
  }
}
