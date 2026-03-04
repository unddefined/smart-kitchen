import { api, ORDER_STATUS, ORDER_ITEM_STATUS } from "./api";

// 订单管理服务
export class OrderService {
  // 创建新订单
  static async createOrder(orderData) {
    try {
      // 验证必要字段
      if (!orderData.hallNumber || !orderData.peopleCount) {
        throw new Error("台号和人数为必填项");
      }

      const order = await api.orders.create({
        hallNumber: orderData.hallNumber,
        peopleCount: orderData.peopleCount,
        tableCount: orderData.tableCount || 1,
        mealTime: orderData.mealTime || this.getCurrentMealTime(),
        status: ORDER_STATUS.CREATED,
      });

      return {
        success: true,
        message: "订单创建成功",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: "订单创建失败: " + error.message,
      };
    }
  }

  // 添加菜品到订单
  static async addDishToOrder(orderId, dishData) {
    try {
      // 验证必要字段
      if (!dishData.dishId || !dishData.quantity) {
        throw new Error("菜品和数量为必填项");
      }

      const orderItem = await api.orderItems.create(orderId, {
        dishId: dishData.dishId,
        quantity: dishData.quantity,
        weight: dishData.weight || null,
        remark: dishData.remark || null,
        countable: dishData.countable || false,
        status: ORDER_ITEM_STATUS.PENDING,
        priority: dishData.priority || 0,
      });

      return {
        success: true,
        message: "菜品添加成功",
        data: orderItem,
      };
    } catch (error) {
      return {
        success: false,
        message: "菜品添加失败: " + error.message,
      };
    }
  }

  // 批量添加菜品
  static async addMultipleDishes(orderId, dishes) {
    const results = [];

    for (const dish of dishes) {
      const result = await this.addDishToOrder(orderId, dish);
      results.push(result);
    }

    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    return {
      success: successCount === totalCount,
      message: `成功添加 ${successCount}/${totalCount} 个菜品`,
      data: results,
    };
  }

  // 更新订单状态
  static async updateOrderStatus(orderId, status) {
    try {
      // 验证状态有效性
      if (!Object.values(ORDER_STATUS).includes(status)) {
        throw new Error("无效的订单状态");
      }

      const order = await api.orders.updateStatus(orderId, status);

      return {
        success: true,
        message: "订单状态更新成功",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: "订单状态更新失败: " + error.message,
      };
    }
  }

  // 起菜 - 将订单状态更新为 serving 并设置起菜时间
  static async startOrder(orderId) {
    try {
      const order = await api.orders.start(orderId);

      return {
        success: true,
        message: "订单已起菜",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: "起菜失败: " + error.message,
      };
    }
  }

  // 催菜 - 将订单状态更新为 urged
  static async urgeOrder(orderId) {
    try {
      const order = await api.orders.urge(orderId);

      return {
        success: true,
        message: "订单已催菜",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: "催菜失败: " + error.message,
      };
    }
  }

  // 暂停 - 将订单状态更新为 started
  static async pauseOrder(orderId) {
    try {
      const order = await api.orders.pause(orderId);

      return {
        success: true,
        message: "订单已暂停",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: "暂停失败: " + error.message,
      };
    }
  }

  // 恢复 - 催菜后自动恢复
  static async resumeOrder(orderId) {
    try {
      const order = await api.orders.resume(orderId);

      return {
        success: true,
        message: "订单已恢复",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: "恢复失败: " + error.message,
      };
    }
  }

  // 获取订单列表
  static async getOrders(filters = {}) {
    try {
      // 将筛选参数传递给后端
      const queryParams = {};
      
      if (filters.date) {
        queryParams.date = filters.date;
      }
      
      if (filters.mealType) {
        queryParams.mealType = filters.mealType;
      }

      const orders = await api.orders.list(queryParams);

      // 应用前端过滤条件（如果需要额外的状态过滤）
      let filteredOrders = orders;

      if (filters.status) {
        filteredOrders = filteredOrders.filter(
          (order) => order.status === filters.status,
        );
      }

      // 按创建时间倒序排列
      return filteredOrders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    } catch (error) {
      console.error("获取订单列表失败:", error);
      return [];
    }
  }

  // 获取订单详情（包含菜品信息）
  static async getOrderDetail(orderId) {
    try {
      const [order, orderItems] = await Promise.all([
        api.orders.get(orderId),
        api.orderItems.listByOrder(orderId),
      ]);

      return {
        ...order,
        items: orderItems,
        // 计算统计数据
        stats: this.calculateOrderStats(orderItems),
      };
    } catch (error) {
      console.error("获取订单详情失败:", error);
      return null;
    }
  }

  // 计算订单统计数据
  static calculateOrderStats(orderItems) {
    const stats = {
      totalItems: orderItems.length,
      pendingCount: 0,
      preparingCount: 0,
      readyCount: 0,
      servedCount: 0,
      totalCountable: 0,
    };

    orderItems.forEach((item) => {
      switch (item.status) {
        case ORDER_ITEM_STATUS.PENDING:
          stats.pendingCount++;
          break;
        case ORDER_ITEM_STATUS.PREPARING:
          stats.preparingCount++;
          break;
        case ORDER_ITEM_STATUS.READY:
          stats.readyCount++;
          break;
        case ORDER_ITEM_STATUS.SERVED:
          stats.servedCount++;
          break;
      }

      if (item.countable) {
        stats.totalCountable += item.quantity;
      }
    });

    return stats;
  }

  // 获取当前餐次
  static getCurrentMealTime() {
    const now = new Date();
    const hour = now.getHours();

    if (hour >= 11 && hour < 14) {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} 午餐`;
    } else if (hour >= 17 && hour < 21) {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} 晚餐`;
    } else {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} 其他`;
    }
  }

  // 验证订单数据
  static validateOrderData(orderData) {
    const errors = [];

    if (!orderData.hallNumber) {
      errors.push("台号不能为空");
    }

    if (!orderData.peopleCount || orderData.peopleCount <= 0) {
      errors.push("人数必须大于等于0");
    }

    if (orderData.tableCount && orderData.tableCount <= 0) {
      errors.push("桌数必须大于0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 验证菜品数据
  static validateDishData(dishData) {
    const errors = [];

    if (!dishData.dishId) {
      errors.push("必须选择菜品");
    }

    if (!dishData.quantity || dishData.quantity <= 0) {
      errors.push("数量必须大于0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // 格式化订单显示信息
  static formatOrderDisplay(order) {
    return {
      id: order.id,
      hallNumber: order.hallNumber,
      peopleCount: order.peopleCount,
      tableCount: order.tableCount,
      status: order.status,
      mealTime: order.mealTime,
      createdAt: new Date(order.createdAt).toLocaleString("zh-CN"),
      statusText: this.getOrderStatusText(order.status),
    };
  }

  // 获取订单状态文本
  static getOrderStatusText(status) {
    const statusMap = {
      [ORDER_STATUS.CREATED]: "已创建",
      [ORDER_STATUS.STARTED]: "待起菜",
      [ORDER_STATUS.SERVING]: "出餐中",
      [ORDER_STATUS.DONE]: "已完成",
      [ORDER_STATUS.CANCELLED]: "已取消",
    };
    return statusMap[status] || "未知状态";
  }

  // 获取菜品状态文本
  static getOrderItemStatusText(status) {
    const statusMap = {
      [ORDER_ITEM_STATUS.PENDING]: "待切配",
      [ORDER_ITEM_STATUS.PREPARING]: "待处理",
      [ORDER_ITEM_STATUS.READY]: "准备下锅",
      [ORDER_ITEM_STATUS.SERVED]: "已上菜",
    };
    return statusMap[status] || "未知状态";
  }

  // 删除订单中的菜品
  static async removeDishFromOrder(orderId, dishId) {
    try {
      // 这里需要根据实际API实现
      // 可能需要先获取订单详情，然后删除对应的菜品项
      const orderItems = await api.orderItems.listByOrder(orderId);
      const itemToDelete = orderItems.find((item) => item.dishId === dishId);

      if (itemToDelete) {
        await api.orderItems.delete(itemToDelete.id);
        return {
          success: true,
          message: "菜品删除成功",
        };
      } else {
        throw new Error("未找到对应的菜品");
      }
    } catch (error) {
      return {
        success: false,
        message: "菜品删除失败: " + error.message,
      };
    }
  }

  // 取消订单
  static async cancelOrder(orderId) {
    try {
      const order = await api.orders.cancel(orderId);
      
      return {
        success: true,
        message: "订单取消成功",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: "订单取消失败: " + error.message,
      };
    }
  }

  // 删除订单
  static async deleteOrder(orderId) {
    try {
      await api.orders.delete(orderId);
      
      return {
        success: true,
        message: "订单删除成功",
      };
    } catch (error) {
      return {
        success: false,
        message: "订单删除失败: " + error.message,
      };
    }
  }

  // 完成订单 - 当所有菜品上完后手动确认完成
  static async completeOrder(orderId) {
    try {
      const order = await api.orders.complete(orderId);
      
      return {
        success: true,
        message: "订单已完成",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: "订单完成失败: " + error.message,
      };
    }
  }

  // 更新订单信息（人数、台号、状态、用餐时间）
  static async updateOrder(orderId, updateData) {
    try {
      // 验证必要字段
      if (!updateData || Object.keys(updateData).length === 0) {
        throw new Error("至少需要一个更新字段");
      }

      const order = await api.orders.update(orderId, updateData);

      return {
        success: true,
        message: "订单信息更新成功",
        data: order,
      };
    } catch (error) {
      return {
        success: false,
        message: "订单信息更新失败：" + error.message,
      };
    }
  }
}

// 同时导出实例以保持向后兼容
export default new OrderService();
