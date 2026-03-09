import { api, PRIORITY_LEVELS, ORDER_ITEM_STATUS } from "./api";

// 出餐逻辑服务
export class ServingService {
  // 催菜功能
  static async urgeDish(itemId, reason = "客户催菜") {
    try {
      const result = await api.orderItems.updatePriority(
        itemId,
        PRIORITY_LEVELS.URGENT,
        reason,
      );
      return {
        success: true,
        message: "催菜成功",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "催菜失败: " + error.message,
      };
    }
  }

  // 缓菜功能
  static async delayDish(itemId, reason = "暂缓制作") {
    try {
      const result = await api.orderItems.updatePriority(
        itemId,
        PRIORITY_LEVELS.WAIT,
        reason,
      );
      return {
        success: true,
        message: "暂缓成功",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "暂缓失败: " + error.message,
      };
    }
  }

  // 标记菜品已出菜
  static async markAsServed(itemId) {
    try {
      const result = await api.orderItems.markAsServed(itemId);
      return {
        success: true,
        message: "标记已出菜成功",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "标记失败：" + error.message,
      };
    }
  }

  // 开始制作菜品（pending → preparing）
  static async startPreparation(itemId) {
    try {
      const result = await api.orderItems.startPreparation(itemId);
      return {
        success: true,
        message: "开始制作",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "操作失败：" + error.message,
      };
    }
  }

  // 标记菜品完成切配（pending → prep）
  static async completePreparation(itemId) {
    try {
      const result = await api.serving.completePrep(itemId);
      return {
        success: true,
        message: "切配完成",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "操作失败：" + error.message,
      };
    }
  }

  // 标记菜品已上菜（单个）
  static async serveDish(itemId) {
    try {
      const result = await api.serving.serveDish(itemId);
      return {
        success: true,
        message: "已上菜",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "操作失败：" + error.message,
      };
    }
  }

  // 批量标记菜品已上菜
  static async serveDishes(itemIds) {
    try {
      const result = await api.serving.serveDishes(itemIds);
      return {
        success: result.success,
        message: result.message || `成功上菜 ${result.successCount} 个，失败 ${result.failCount} 个`,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "批量上菜失败：" + error.message,
      };
    }
  }

  // 自动调整优先级
  static async autoAdjustOrderPriorities(orderId) {
    try {
      const result = await api.serving.autoAdjustPriorities(orderId);
      return {
        success: true,
        message: "优先级自动调整完成",
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: "自动调整失败: " + error.message,
      };
    }
  }

  // 获取待处理菜品
  static async getPendingItems() {
    try {
      const items = await api.serving.getPendingItems();
      // 按优先级排序
      return items.sort((a, b) => {
        // 优先级高的在前
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        // 相同优先级按创建时间排序
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    } catch (error) {
      console.error("获取待处理菜品失败:", error);
      return [];
    }
  }

  // 获取已出菜品
  static async getServedItems() {
    try {
      const items = await api.serving.getServedItems();
      // 按出菜时间倒序排列
      return items.sort((a, b) => new Date(b.servedAt) - new Date(a.servedAt));
    } catch (error) {
      console.error("获取已出菜品失败:", error);
      return [];
    }
  }

  // 检测紧急菜品
  static async detectUrgentDishes() {
    try {
      return await api.serving.detectUrgent();
    } catch (error) {
      console.error("检测紧急菜品失败:", error);
      return [];
    }
  }

  // 获取出餐提醒
  static async getServingAlerts() {
    try {
      return await api.serving.getAlerts();
    } catch (error) {
      console.error("获取出餐提醒失败:", error);
      return [];
    }
  }

  // 计算菜品优先级
  static calculatePriority(
    dishType,
    isAddedLater = false,
    timeElapsed = 0,
    orderItemCount = 1,
  ) {
    // 后来加的菜优先级为3级
    if (isAddedLater) {
      return PRIORITY_LEVELS.URGENT;
    }

    // 根据菜品类型设置默认优先级
    switch (dishType) {
      case "前菜":
        return PRIORITY_LEVELS.URGENT;
      case "中菜":
        return PRIORITY_LEVELS.WAIT;
      case "后菜":
      case "尾菜":
        return PRIORITY_LEVELS.NORMAL;
      default:
        return PRIORITY_LEVELS.NORMAL;
    }
  }

  // 自动调整优先级逻辑
  static async adjustPriorityAutomatically(itemId, orderInfo) {
    const { itemCount, lastServeTime, currentTime } = orderInfo;

    // 计算时间间隔
    const timeDiff = currentTime - (lastServeTime || currentTime);
    const threshold = itemCount * 150 * 0.5; // 默认阈值：菜品数量 × 150 × 0.5 秒

    if (timeDiff > threshold) {
      // 超过阈值，提高优先级
      try {
        const result = await api.orderItems.updatePriority(
          itemId,
          PRIORITY_LEVELS.URGENT,
          "超时自动催菜",
        );
        return {
          success: true,
          adjusted: true,
          newPriority: PRIORITY_LEVELS.URGENT,
          message: "优先级已自动调整",
        };
      } catch (error) {
        return {
          success: false,
          adjusted: false,
          message: "自动调整失败: " + error.message,
        };
      }
    }

    return {
      success: true,
      adjusted: false,
      message: "无需调整优先级",
    };
  }

  // 获取优先级对应的颜色
  static getPriorityColor(priority) {
    switch (priority) {
      case PRIORITY_LEVELS.URGENT:
        return "red"; // 红色 - 催菜
      case PRIORITY_LEVELS.WAIT:
        return "yellow"; // 黄色 - 等一下
      case PRIORITY_LEVELS.NORMAL:
        return "green"; // 绿色 - 不急
      case PRIORITY_LEVELS.PENDING:
      case PRIORITY_LEVELS.SERVED:
        return "gray"; // 灰色 - 未起菜/已出
      default:
        return "gray";
    }
  }

  // 获取优先级对应的标签
  static getPriorityLabel(priority) {
    switch (priority) {
      case PRIORITY_LEVELS.URGENT:
        return "催菜";
      case PRIORITY_LEVELS.WAIT:
        return "等一下";
      case PRIORITY_LEVELS.NORMAL:
        return "不急";
      case PRIORITY_LEVELS.PENDING:
        return "未起菜";
      case PRIORITY_LEVELS.SERVED:
        return "已出";
      default:
        return "未知";
    }
  }

  // 验证订单状态流转
  static validateStatusTransition(currentStatus, targetStatus) {
    const validTransitions = {
      [ORDER_ITEM_STATUS.PENDING]: [ORDER_ITEM_STATUS.PREPARING],
      [ORDER_ITEM_STATUS.PREPARING]: [ORDER_ITEM_STATUS.READY],
      [ORDER_ITEM_STATUS.READY]: [ORDER_ITEM_STATUS.SERVED],
      [ORDER_ITEM_STATUS.SERVED]: [],
    };

    return validTransitions[currentStatus]?.includes(targetStatus) || false;
  }
}

export default ServingService;
