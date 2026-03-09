import { ref } from "vue";
import { api } from "@/services/api";
import { ServingService } from "@/services";

/**
 * 菜品交互管理 Composable
 * 专注于菜品点击、优先级调整等交互逻辑，数据处理由各视图自行实现
 * 
 * @param {Object} options - 配置选项
 * @param {Function} options.onStatusChange - 状态变更回调 (dish, newStatus, newPriority) => void
 * @param {Function} options.onPriorityAdjust - 优先级调整回调 (dish, quantity, priority) => void
 * 
 * @returns {Object} 响应式状态和方法
 */
export function useDishManager(options = {}) {
  const {
    onStatusChange,
    onPriorityAdjust,
  } = options;

  // 响应式状态
  const showPriorityModal = ref(false);
  const currentDish = ref(null);
  const tempQuantity = ref(1);
  const tempPriority = ref(2);
  const isServedCollapsed = ref(true);
  const collapseTimer = ref(null);

  // 优先级选项 - 严格按照 MVP文档要求
  const priorityOptions = [
    { label: "不急 (1)", value: 1 },
    { label: "等一下 (2)", value: 2 },
    { label: "催菜 (3)", value: 3 },
    { label: "已出 (-1)", value: -1 },
  ];

  /**
   * 获取优先级对应的 CSS 类
   */
  const getPriorityClass = (priority) => {
    const classes = {
      3: "bg-red-300",
      2: "bg-yellow-300",
      1: "bg-green-300",
      0: "bg-white text-gray-400",
      "-1": "bg-gray-100 text-gray-600",
    };
    return classes[priority] || "bg-white";
  };

  /**
   * 获取优先级按钮对应的 CSS 类
   */
  const getPriorityButtonClass = (priority, isActive) => {
    const baseClasses = {
      1: "border-green-400 bg-blue-50",
      2: "border-yellow-400 bg-yellow-50",
      3: "border-red-400 bg-red-50",
      "-1": "border-gray-500 bg-gray-100",
    };

    const activeClasses = {
      1: "bg-priority-green text-white",
      2: "bg-priority-yellow text-gray-800",
      3: "bg-priority-red text-white",
      "-1": "bg-gray-500 text-white",
    };

    return isActive ? activeClasses[priority] : baseClasses[priority];
  };

  /**
   * 获取优先级标签文本
   */
  const getPriorityLabel = (priority) => {
    const option = priorityOptions.find((opt) => opt.value === priority);
    return option ? option.label : "未知";
  };
  /**
   * 处理菜品点击事件 - 统一状态流转逻辑
   * @param {Object} dish - 菜品对象
   * @param {Function} showToastFn - Toast 提示函数
   * @param {Function} refreshFn - 刷新数据函数
   * @param {Function} emitFn - 事件发送函数
   */
  const handleDishClick = async (dish, showToastFn, refreshFn, emitFn) => {
    // 兼容两种数据结构：
    // 1. 扁平化结构（OverviewView）: { name, status, priority, needPrep, itemId, dishId, ... }
    // 2. 嵌套结构（OrderView）: { id, dish: { name }, status, priority, ... }
    const dishName = dish.name || dish.dish?.name || "未知菜品";
    const needPrep = dish.needPrep ?? dish.dish?.needPrep;
    
    console.log("点击菜品:", dishName, "当前状态:", dish.status, "优先级:", dish.priority, "needPrep:", needPrep);

    // 获取订单项 ID（兼容两种数据结构）
    // 如果是聚合的菜品（来自 OverviewView 的 mergeDishes），可能包含多个 itemId
    const itemId = dish.itemId ?? dish.id;
    const itemIds = dish.itemIds || (itemId ? [itemId] : []);
    
    if (!itemIds || itemIds.length === 0) {
      showToastFn.showError("菜品 ID 不存在，无法操作");
      return;
    }

    // 根据 MVP文档，优先级为 0 的菜品（未起）不能直接上菜
    if (dish.priority === 0 && (dish.status === "ready" || dish.status === "preparing")) {
      showToastFn.showError(`还未起菜，无法上菜。`);
      return;
    }

    let result;
    let message;

    try {
      if (dish.status === "pending") {
        // 检查是否需要预处理
        if (needPrep === false) {
          // 不需要预处理，直接从 pending → ready
          // 批量操作
          if (itemIds.length > 1) {
            const results = await Promise.all(
              itemIds.map(id => api.serving.completePrep(id))
            );
            const successCount = results.filter(r => r?.success).length;
            result = { success: true, count: successCount, total: itemIds.length };
            message = `已将${successCount}份"${dishName}"标记为准备下锅（跳过预处理）`;
          } else {
            result = await api.serving.completePrep(itemIds[0]);
            message = `已将"${dishName}"标记为准备下锅（跳过预处理）`;
          }
          showToastFn.showSuccess(message);
        } else {
          // 需要预处理，pending → preparing
          // 批量操作
          if (itemIds.length > 1) {
            const results = await Promise.all(
              itemIds.map(id => ServingService.completePreparation(id))
            );
            const successCount = results.filter(r => r?.success).length;
            result = { success: true, count: successCount, total: itemIds.length };
            message = `已将${successCount}份"${dishName}"标记为待处理`;
          } else {
            result = await ServingService.completePreparation(itemIds[0]);
            message = `已将"${dishName}"标记为待处理`;
          }
          showToastFn.showSuccess(message);
        }
      } else if (dish.status === "preparing") {
        // preparing → ready
        // 批量操作
        if (itemIds.length > 1) {
          const results = await Promise.all(
            itemIds.map(id => api.serving.completePrep(id))
          );
          const successCount = results.filter(r => r?.success).length;
          result = { success: true, count: successCount, total: itemIds.length };
          message = `已将${successCount}份"${dishName}"标记为准备下锅`;
        } else {
          result = await api.serving.completePrep(itemIds[0]);
          message = `已将"${dishName}"标记为准备下锅`;
        }
        showToastFn.showSuccess(message);
      } else if (dish.status === "ready") {
        // ready → served（使用批量上菜接口）
        result = await ServingService.serveDishes(itemIds);
        if (result.success) {
          const data = result.data || {};
          message = `成功上菜 ${data.successCount || itemIds.length} 份"${dishName}"`;
          showToastFn.showSuccess(message);
        } else {
          showToastFn.showError(result.message || "上菜失败");
          return;
        }
      } else if (dish.status === "served") {
        message = `"${dishName}"已经是已上菜状态`;
        showToastFn.showInfo(message);
        return;
      } else {
        message = `无法更改"${dishName}"的状态（当前状态：${dish.status}）`;
        showToastFn.showError(message);
        return;
      }

      console.log(message, result);

      if (result?.success) {
        showToastFn.showSuccess(message);
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        // 发送状态变更事件通知父组件
        if (emitFn && typeof emitFn === "function") {
          // emitFn 接收 4 个参数：dish, newStatus, newPriority, message
          emitFn(dish, 'served', -1, message);
        }
        
        // 刷新数据
        if (refreshFn && typeof refreshFn === "function") {
          await refreshFn();
        }
      } else {
        showToastFn.showError(result?.message || message);
      }
    } catch (error) {
      console.error("状态更新失败:", error);
      showToastFn.showError(error.message || "状态更新失败");
    }
  };

  /**
   * 显示优先级调整弹窗
   */
  const showPriorityAdjustModal = (dish) => {
    currentDish.value = dish;
    tempQuantity.value = dish.totalQuantity || dish.quantity;
    tempPriority.value = dish.priority;
    showPriorityModal.value = true;
  };

  /**
   * 关闭优先级调整弹窗
   */
  const closePriorityModal = () => {
    showPriorityModal.value = false;
    currentDish.value = null;
  };

  /**
   * 减少数量
   */
  const decreaseQuantity = () => {
    if (tempQuantity.value > 1) {
      tempQuantity.value--;
    }
  };

  /**
   * 增加数量
   */
  const increaseQuantity = () => {
    tempQuantity.value++;
  };

  /**
   * 确认优先级调整
   */
  const confirmPriorityAdjust = (emitFn) => {
    // 兼容两种数据结构
    const dishName = currentDish.value?.name || currentDish.value?.dish?.name || "未知菜品";
    
    console.log("调整菜品:", {
      dish: dishName,
      quantity: tempQuantity.value,
      priority: tempPriority.value,
    });

    closePriorityModal();
    
    if (emitFn) {
      emitFn("dish-action", "adjust-priority", {
        dish: currentDish.value,
        quantity: tempQuantity.value,
        priority: tempPriority.value,
      });
    }
    
    if (onPriorityAdjust) {
      onPriorityAdjust(currentDish.value, tempQuantity.value, tempPriority.value);
    }
  };

  /**
   * 处理已出菜品点击
   */
  const handleServedDishClick = (dish, emitFn) => {
    if (emitFn) {
      emitFn("dish-action", "served-click", dish);
    }
  };

  /**
   * 切换已出区域折叠状态
   */
  const toggleServedSection = () => {
    isServedCollapsed.value = !isServedCollapsed.value;
  };

  /**
   * 开始折叠计时器
   */
  const startCollapseTimer = () => {
    cancelCollapseTimer();
    collapseTimer.value = setTimeout(() => {
      isServedCollapsed.value = true;
    }, 5000);
  };

  /**
   * 取消折叠计时器
   */
  const cancelCollapseTimer = () => {
    if (collapseTimer.value) {
      clearTimeout(collapseTimer.value);
      collapseTimer.value = null;
    }
  };

  /**
   * 处理菜品双击事件
   */
  const handleDishDoubleClick = (dish, emitFn) => {
    if (emitFn) {
      emitFn("dish-action", "double-click", dish);
    }
  };

  return {
    // 状态
    showPriorityModal,
    currentDish,
    tempQuantity,
    tempPriority,
    isServedCollapsed,
    collapseTimer,
    priorityOptions,
    
    // 方法
    getPriorityClass,
    getPriorityButtonClass,
    getPriorityLabel,
    handleDishClick,
    showPriorityAdjustModal,
    closePriorityModal,
    decreaseQuantity,
    increaseQuantity,
    confirmPriorityAdjust,
    handleServedDishClick,
    toggleServedSection,
    startCollapseTimer,
    cancelCollapseTimer,
    handleDishDoubleClick,
  };
}
