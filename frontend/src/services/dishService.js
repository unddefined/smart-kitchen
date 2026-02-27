import { api } from "./api";

// 菜品管理服务
export class DishService {
  // 获取所有菜品
  static async getAllDishes() {
    try {
      const dishes = await api.dishes.list();
      return dishes.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    } catch (error) {
      console.error("获取菜品列表失败:", error);
      return [];
    }
  }

  // 根据工位获取菜品
  static async getDishesByStation(stationId) {
    try {
      const dishes = await api.dishes.list();
      return dishes
        .filter((dish) => dish.stationId === stationId)
        .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    } catch (error) {
      console.error("获取工位菜品失败:", error);
      return [];
    }
  }

  // 根据分类获取菜品
  static async getDishesByCategory(categoryId) {
    try {
      const dishes = await api.dishes.list();
      return dishes
        .filter((dish) => dish.categoryId === categoryId)
        .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    } catch (error) {
      console.error("获取分类菜品失败:", error);
      return [];
    }
  }

  // 搜索菜品
  static async searchDishes(query) {
    try {
      if (!query || query.trim() === "") {
        return await this.getAllDishes();
      }

      // 先尝试使用API搜索
      try {
        const results = await api.dishes.search(query);
        return results;
      } catch (searchError) {
        // 如果API搜索失败，使用本地搜索
        const allDishes = await this.getAllDishes();
        const searchTerm = query.toLowerCase().trim();

        return allDishes.filter(
          (dish) =>
            dish.name.toLowerCase().includes(searchTerm) ||
            (dish.shortcutCode &&
              dish.shortcutCode.toLowerCase().includes(searchTerm)),
        );
      }
    } catch (error) {
      console.error("搜索菜品失败:", error);
      return [];
    }
  }

  // 获取菜品详情
  static async getDishDetail(dishId) {
    try {
      return await api.dishes.get(dishId);
    } catch (error) {
      console.error("获取菜品详情失败:", error);
      return null;
    }
  }

  // 创建新菜品
  static async createDish(dishData) {
    try {
      // 验证必要字段
      const validation = this.validateDishData(dishData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      const dish = await api.dishes.create({
        name: dishData.name,
        stationId: dishData.stationId,
        categoryId: dishData.categoryId,
        shortcutCode: dishData.shortcutCode || null,
        recipe: dishData.recipe || null,
        countable: dishData.countable || false,
      });

      return {
        success: true,
        message: "菜品创建成功",
        data: dish,
      };
    } catch (error) {
      return {
        success: false,
        message: "菜品创建失败: " + error.message,
      };
    }
  }

  // 更新菜品
  static async updateDish(dishId, dishData) {
    try {
      const dish = await api.dishes.update(dishId, dishData);
      return {
        success: true,
        message: "菜品更新成功",
        data: dish,
      };
    } catch (error) {
      return {
        success: false,
        message: "菜品更新失败: " + error.message,
      };
    }
  }

  // 删除菜品
  static async deleteDish(dishId) {
    try {
      await api.dishes.delete(dishId);
      return {
        success: true,
        message: "菜品删除成功",
      };
    } catch (error) {
      return {
        success: false,
        message: "菜品删除失败: " + error.message,
      };
    }
  }

  // 验证菜品数据
  static validateDishData(dishData) {
    const errors = [];

    if (!dishData.name || dishData.name.trim() === "") {
      errors.push("菜品名称不能为空");
    }

    if (!dishData.stationId) {
      errors.push("必须选择工位");
    }

    if (!dishData.categoryId) {
      errors.push("必须选择分类");
    }

    // 检查菜品名称长度
    if (dishData.name && dishData.name.length > 50) {
      errors.push("菜品名称不能超过50个字符");
    }

    // 检查助记码长度
    if (dishData.shortcutCode && dishData.shortcutCode.length > 20) {
      errors.push("助记码不能超过20个字符");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 获取热门菜品（根据使用频率）
  static async getPopularDishes(limit = 10) {
    try {
      // 这里可以实现基于订单数据的热门菜品统计
      // 暂时返回所有菜品按名称排序
      const dishes = await this.getAllDishes();
      return dishes.slice(0, limit);
    } catch (error) {
      console.error("获取热门菜品失败:", error);
      return [];
    }
  }

  // 获取菜品使用统计
  static async getDishUsageStats() {
    try {
      // 这里可以实现菜品使用频率统计
      // 需要结合订单数据进行分析
      const dishes = await this.getAllDishes();
      return dishes.map((dish) => ({
        id: dish.id,
        name: dish.name,
        usageCount: 0, // 需要从订单数据中统计
        lastUsed: null, // 需要从订单数据中获取
      }));
    } catch (error) {
      console.error("获取菜品使用统计失败:", error);
      return [];
    }
  }

  // 格式化菜品显示信息
  static formatDishDisplay(dish) {
    return {
      id: dish.id,
      name: dish.name,
      stationName: dish.station?.name || "未知工位",
      categoryName: dish.category?.name || "未分类",
      shortcutCode: dish.shortcutCode,
      countable: dish.countable,
      createdAt: new Date(dish.createdAt).toLocaleString("zh-CN"),
    };
  }

  // 根据菜品类型分类
  static categorizeDishes(dishes) {
    const categorized = {
      前菜: [],
      中菜: [],
      后菜: [],
      尾菜: [],
      其他: [],
    };

    dishes.forEach((dish) => {
      // 这里可以根据菜品名称或分类进行智能分类
      // 暂时使用简单规则
      const dishName = dish.name;
      if (dishName.includes("汤") || dishName.includes("羹")) {
        categorized.前菜.push(dish);
      } else if (dishName.includes("炒") || dishName.includes("烧")) {
        categorized.中菜.push(dish);
      } else if (dishName.includes("炖") || dishName.includes("煮")) {
        categorized.后菜.push(dish);
      } else if (dishName.includes("饭") || dishName.includes("面")) {
        categorized.尾菜.push(dish);
      } else {
        categorized.其他.push(dish);
      }
    });

    return categorized;
  }

  // 获取菜品的完整信息（包含关联数据）
  static async getDishFullInfo(dishId) {
    try {
      const dish = await this.getDishDetail(dishId);
      if (!dish) return null;

      // 获取相关的菜谱信息
      // 这里可以添加获取菜谱详情的逻辑
      return {
        ...dish,
        fullRecipe: dish.recipe ? JSON.parse(dish.recipe) : null,
      };
    } catch (error) {
      console.error("获取菜品完整信息失败:", error);
      return null;
    }
  }
}

export default DishService;
