<template>
  <div class="flex flex-col h-full bg-gray-100">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center h-full">
      <div class="text-center">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">加载中...</p>
      </div>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="error" class="p-4 bg-red-100 rounded-lg m-4">
      <p class="text-red-700">{{ error }}</p>
      <button @click="$emit('dish-action', 'refresh')" class="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">重新加载</button>
    </div>

    <!-- 正常内容 -->
    <template v-else>
      <div class="flex-1 overflow-y-auto p-4">
        <!-- 已出菜品瀑布流 -->
        <div
          class="mb-3 transition-all duration-300"
          :class="{ 'opacity-60': isServedCollapsed }"
          @mouseenter="cancelCollapseTimer"
          @mouseleave="startCollapseTimer">
          <div class="flex justify-between items-center cursor-pointer select-none" @click="toggleServedSection">
            <h3 class="text-lg font-medium text-gray-800">已出</h3>
            <span class="text-lg text-gray-600">
              {{ isServedCollapsed ? "展开" : "收起" }}
            </span>
          </div>
          <DishCards
            v-show="!isServedCollapsed"
            :dishes="servedDishes"
            @click="handleDishClick"
            @dblclick="onDishDoubleClick"
            @contextmenu="onLongPress" />
        </div>

        <!-- 待处理菜品卡片 -->
        <div class="mb-3">
          <h3 class="text-lg font-medium text-gray-800">待上</h3>
          <DishCards :dishes="pendingDishes" @click="handleDishClick" @dblclick="onDishDoubleClick" @contextmenu="onLongPress" />
        </div>

        <!-- 未起菜菜品列表 -->
        <div class="mb-3">
          <h3 class="text-lg font-medium text-gray-800">未起</h3>
          <DishCards :dishes="unstartedDishes" @click="handleDishClick" @dblclick="onDishDoubleClick" @contextmenu="onLongPress" />
        </div>
      </div>
    </template>

    <!-- 优先级调整弹窗 -->
    <div v-if="showPriorityModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click="closePriorityModal">
      <div class="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl" @click.stop>
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800">调整出餐逻辑</h3>
          <button class="w-8 h-8 flex items-center justify-center text-gray-400 text-2xl hover:text-gray-600" @click="closePriorityModal">×</button>
        </div>
        <div class="p-5">
          <div class="mb-5 p-3 bg-gray-100 rounded-lg">
            <strong class="block text-base mb-1">{{ currentDish?.name }}</strong>
            <span class="text-sm">当前优先级：{{ getPriorityLabel(currentDish?.priority) }}</span>
          </div>

          <div class="mb-6">
            <div class="mb-5">
              <label class="block mb-3 font-medium text-gray-800">调整数量:</label>
              <div class="flex items-center gap-3">
                <button
                  class="w-9 h-9 border border-gray-300 bg-white rounded-md flex items-center justify-center text-lg font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="decreaseQuantity"
                  :disabled="tempQuantity <= 1">
                  -
                </button>
                <span class="min-w-10 text-center text-base font-semibold">{{ tempQuantity }}</span>
                <button
                  class="w-9 h-9 border border-gray-300 bg-white rounded-md flex items-center justify-center text-lg font-bold hover:bg-gray-50"
                  @click="increaseQuantity">
                  +
                </button>
              </div>
            </div>

            <div class="mb-5">
              <label class="block mb-3 font-medium text-gray-800">调整优先级:</label>
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="level in priorityOptions"
                  :key="level.value"
                  :class="[
                    'py-3 border-2 rounded-lg bg-white font-medium transition-all duration-200',
                    tempPriority === level.value ? 'border-3 scale-105' : 'border-gray-300',
                    getPriorityButtonClass(level.value, tempPriority === level.value),
                  ]"
                  @click="tempPriority = level.value">
                  {{ level.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="flex gap-3 justify-end">
            <button class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300" @click="closePriorityModal">取消</button>
            <button class="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600" @click="confirmPriorityAdjust">确认</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useToast } from "@/composables/useToast";
import { useDishManager } from "@/composables/useDishManager";
import DishCards from "@/components/DishCards.vue";

// 自定义 v-longpress 指令
const vLongpress = {
  beforeMount(el, binding) {
    let timer = null;
    const delay = binding.arg || 500; // 默认 500ms 触发长按

    const startHandler = (event) => {
      // 防止触发点击事件
      if (event.type === "touchstart") {
        event.preventDefault();
      }

      timer = setTimeout(() => {
        if (typeof binding.value === "function") {
          binding.value(event);
        }
        timer = null;
      }, delay);
    };

    const cancelHandler = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    // 存储处理函数以便在 unmounted 时清理
    el._longpressHandlers = { startHandler, cancelHandler };

    el.addEventListener("mousedown", startHandler);
    el.addEventListener("touchstart", startHandler, { passive: false });
    el.addEventListener("mouseup", cancelHandler);
    el.addEventListener("mouseleave", cancelHandler);
    el.addEventListener("touchend", cancelHandler);
    el.addEventListener("touchcancel", cancelHandler);
  },
  unmounted(el) {
    if (el._longpressHandlers) {
      const { startHandler, cancelHandler } = el._longpressHandlers;
      el.removeEventListener("mousedown", startHandler);
      el.removeEventListener("touchstart", startHandler);
      el.removeEventListener("mouseup", cancelHandler);
      el.removeEventListener("mouseleave", cancelHandler);
      el.removeEventListener("touchend", cancelHandler);
      el.removeEventListener("touchcancel", cancelHandler);
      delete el._longpressHandlers;
    }
  },
};

// 定义 Props - 接收父组件传递的 orders 数据
const props = defineProps({
  orders: {
    type: Array,
    required: true,
    default: () => [],
  },
});

// 定义事件
const emit = defineEmits(["dish-action"]);

// 响应式状态
const loading = ref(false);
const error = ref(null);
const showPriorityModal = ref(false);

// DOM 引用
const cardRefs = ref([]);
const unstartedCardRefs = ref([]);

// 使用 toast 组合式函数（使用全局注入）
const { showToast, showSuccess, showError, showInfo } = useToast();

// 使用菜品管理 Composable - 专注于交互逻辑
const dishManager = useDishManager({
  onStatusChange: (dish, newStatus, newPriority) => {
    // 兼容两种数据结构
    const dishName = dish.name || dish.dish?.name || "未知菜品";
    console.log("状态变更回调:", dishName, newStatus, newPriority);
  },
  onPriorityAdjust: (dish, quantity, priority) => {
    // 兼容两种数据结构
    const dishName = dish.name || dish.dish?.name || "未知菜品";
    console.log("优先级调整回调:", dishName, quantity, priority);
  },
});

// 解构常用方法
const {
  getPriorityClass,
  getPriorityButtonClass,
  handleDishClick: handleDishClickBase,
  closePriorityModal,
  decreaseQuantity,
  increaseQuantity,
  confirmPriorityAdjust: confirmPriorityAdjustBase,
  handleServedDishClick,
  toggleServedSection,
  startCollapseTimer,
  cancelCollapseTimer,
  handleDishDoubleClick,
  isServedCollapsed,
  collapseTimer,
} = dishManager;

// 包装 handleDishClick，注入事件回调逻辑
// OverviewView 作为展示组件，通过事件通知父组件执行相应操作
const handleDishClick = async (dish) => {
  // 刷新回调：通知父组件重新加载数据
  const refreshFn = () => {
    emit("dish-action", "refresh");
  };

  // 状态变更回调：菜品状态发生变化时通知父组件
  const statusChangeFn = (dish, newStatus, newPriority, message) => {
    emit("dish-action", "status-changed", {
      dish,
      newStatus,
      newPriority,
      message,
    });
  };

  // 调用基础处理函数，传入 UI 反馈和回调函数
  await handleDishClickBase(dish, { showSuccess, showError, showInfo }, refreshFn, statusChangeFn);
};

// 包装 handleDishDoubleClick，注入事件回调逻辑
const onDishDoubleClick = (dish) => {
  handleDishDoubleClick(dish, (eventName, eventType, data) => {
    emit(eventName, eventType, data);
  });
};

// 长按事件处理 - 显示优先级调整弹窗
const onLongPress = (dish) => {
  console.log("长按菜品:", dish.name || dish.dish?.name || "未知菜品");
  // 使用 useDishManager 中的 showPriorityAdjustModal 方法
  // 但由于该方法没有导出，我们需要在这里直接实现弹窗逻辑
  currentDish.value = dish;
  tempQuantity.value = dish.totalQuantity || dish.quantity;
  tempPriority.value = dish.priority;
  showPriorityModal.value = true;
};

// 一、提取菜品 - 只负责数据标准化
const normalizeDishes = (orders = []) => {
  const dishes = [];

  for (const order of orders) {
    if (!order?.orderItems?.length) continue;

    for (const item of order.orderItems) {
      // 验证 dish 对象是否存在
      if (!item.dish) {
        console.error("订单项缺少 dish 对象:", JSON.stringify(item, null, 2));
        throw new Error(`订单项 ${item.id} (${item.dishId}) 缺少菜品信息`);
      }

      // 验证 needPrep 字段是否存在
      if (item.dish.needPrep === undefined || item.dish.needPrep === null) {
        console.error("菜品缺少 needPrep 字段:", JSON.stringify(item.dish, null, 2));
        throw new Error(`菜品 "${item.dish.name}" (${item.dish.id}) 的 needPrep 字段为 ${item.dish.needPrep}`);
      }

      // 跳过取消的订单或已完成（done）的订单
      if (order.status === "done" || order.status === "cancelled") {
        continue;
      }

      // 跳过已取消的菜品
      if (item.status === "cancelled") {
        continue;
      }

      const peopleCount = Number(order.peopleCount) || 1;
      const tableCount = Number(order.tableCount) || 1;
      const quantity = Number(item.quantity) || 1;

      const isCountable = item.dish.countable === true;

      let totalQuantity;

      if (isCountable) {
        // 按人数
        totalQuantity = peopleCount * quantity;
      } else {
        // 按桌
        totalQuantity = quantity * tableCount;
      }

      // 计算是否需要处理以及处理类型
      let needsProcessing = false;
      let processType = "";

      if (item.status === "pending") {
        needsProcessing = true;
        processType = "待切配";
      } else if (item.status === "preparing") {
        needsProcessing = true;
        processType = "待处理";
      }

      dishes.push({
        // 订单项 ID（用于 API 调用）
        itemId: item.id,
        // 菜品 ID
        dishId: item.dish.id,
        name: item.dish.name,

        orderId: order.id,
        hallNumber: order.hallNumber,

        status: item.status,
        priority: item.priority,

        remark: item.remark || "",
        weight: item.weight ? item.weight : null,

        peopleCount,
        tableCount,

        quantity,
        totalQuantity,

        countable: isCountable,

        needPrep: item.dish.needPrep,
        needsProcessing,
        processType,
      });
    }
  }

  return dishes;
};

// 二、合并菜品 - 核心算法
const mergeDishes = (dishes) => {
  const map = new Map();

  for (const dish of dishes) {
    const key = `${dish.dishId}|${dish.status}|${dish.priority}`;

    if (!map.has(key)) {
      map.set(key, {
        dishId: dish.dishId,
        itemId: dish.itemId, // 保留第一个订单项 ID 用于向后兼容
        itemIds: [dish.itemId], // 收集所有订单项 ID 用于批量操作
        name: dish.name,
        priority: dish.priority,
        status: dish.status,
        totalQuantity: 0,
        perTableGroups: [],
        remarks: [],
        orderIds: new Set(),
        hallNumbers: new Set(),
        // 保留 remark 和 weight 字段用于 display
        remark: dish.remark || "",
        weight: dish.weight ? dish.weight : null,
        countable: dish.countable,
        // 保留 needPrep 字段
        needPrep: dish.needPrep,
        // 保留 needsProcessing 和 processType 字段
        needsProcessing: dish.needsProcessing,
        processType: dish.processType,
      });
    }

    const existing = map.get(key);

    // 累加总数量
    existing.totalQuantity += dish.totalQuantity;

    // 收集订单 ID 和厅号
    existing.orderIds.add(dish.orderId);
    existing.hallNumbers.add(dish.hallNumber);

    // 收集所有订单项 ID（用于批量操作）
    if (!existing.itemIds.includes(dish.itemId)) {
      existing.itemIds.push(dish.itemId);
    }

    // 处理份量分组（perTableGroups）
    if (dish.countable) {
      // 可数菜品：使用取余平均分配
      const quotient = Math.floor(dish.peopleCount / dish.tableCount);
      const remainder = dish.peopleCount % dish.tableCount;

      // 添加较多人数的组 (商 +1)
      if (remainder > 0) {
        let group = existing.perTableGroups.find((g) => g.quantityPerTable === quotient + 1);
        if (!group) {
          group = {
            quantityPerTable: quotient + 1,
            tableCount: 0,
          };
          existing.perTableGroups.push(group);
        }
        group.tableCount += remainder * dish.quantity;
      }

      // 添加较少人数的组 (商)
      if (quotient > 0 && dish.tableCount - remainder > 0) {
        let group = existing.perTableGroups.find((g) => g.quantityPerTable === quotient);
        if (!group) {
          group = {
            quantityPerTable: quotient,
            tableCount: 0,
          };
          existing.perTableGroups.push(group);
        }
        group.tableCount += (dish.tableCount - remainder) * dish.quantity;
      }
    } else {
      // 普通菜品：单桌订单直接使用 quantity，多桌订单才需要平均分配
      const perTableKey = dish.quantity;
      let group = existing.perTableGroups.find((g) => g.quantityPerTable === perTableKey);
      if (!group) {
        group = {
          quantityPerTable: perTableKey,
          tableCount: 0,
        };
        existing.perTableGroups.push(group);
      }
      group.tableCount += dish.quantity * dish.tableCount;
    }

    // 处理备注分组（remarks）- 包含 weight 字段
    const remarkKey = (dish.remark || "_none") + "|" + (dish.weight || "_none");
    let remark = existing.remarks.find((r) => r.remark === remarkKey.split("|")[0] && r.weight === remarkKey.split("|")[1]);

    if (!remark) {
      remark = {
        remark: dish.remark || "",
        weight: dish.weight ? dish.weight : null,
        quantity: 0,
      };
      existing.remarks.push(remark);
    }

    remark.quantity += dish.totalQuantity;
  }

  // 排序：perTableGroups 按 quantityPerTable 降序
  let result = Array.from(map.values()).map((dish) => ({
    ...dish,
    orderIds: Array.from(dish.orderIds),
    hallNumbers: Array.from(dish.hallNumbers),
    perTableGroups: dish.perTableGroups.sort((a, b) => b.quantityPerTable - a.quantityPerTable),
    remarks: dish.remarks.filter((r) => r.remark !== "_none" || r.weight !== null), // 移除空值
  }));

  // 按优先级排序：3(红/催菜) > 2(黄/等一下) > 1(绿/不急) > 0/-1(灰)
  result.sort((a, b) => {
    // 优先按优先级降序排列
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // 优先级相同时按名称排序
    return a.name.localeCompare(b.name);
  });

  return result;
};

/**
 * TODO: 后端聚合接口预留位置
 *
 * 当实现后端聚合时，替换以下逻辑：
 *
 * 1. 移除前端的 normalizeDishes 和 mergeDishes
 * 2. 直接从后端获取已聚合的数据：
 *
 * const { data: aggregatedDishes } = await fetch('/api/dishes/overview');
 *
 * 3. 后端返回数据结构示例：
 * {
 *   dishes: [
 *     {
 *       dishId: 12,
 *       name: "托炉饼",
 *       priority: 2,
 *       status: "pending",
 *       totalQuantity: 30,
 *       remarkGroups: [
 *         { remark: "", quantity: 18 },
 *         { remark: "微辣", quantity: 12 }
 *       ],
 *       tableGroups: [
 *         { quantityPerTable: 2, tableCount: 6 }
 *       ],
 *       orderIds: [1,2,3],
 *       hallNumbers: ["A1","A2"]
 *     }
 *   ]
 * }
 *
 * 4. WebSocket 推送增量更新，避免全量刷新
 */

// 计算属性 - 处理后的菜品列表
const dishes = computed(() => {
  const extractedDishes = normalizeDishes(props.orders);
  return mergeDishes(extractedDishes);
});

// 计算属性 - 已出菜品（优先级 -1）
const servedDishes = computed(() => {
  return dishes.value.filter((dish) => dish.priority === -1);
});

// 计算属性 - 待上菜品（优先级 > 0）
const pendingDishes = computed(() => {
  return dishes.value.filter((dish) => dish.priority > 0);
});

// 计算属性 - 未起菜品（优先级 0）
const unstartedDishes = computed(() => {
  return dishes.value.filter((dish) => dish.priority === 0);
});

// 监听 orders 变化
watch(
  () => props.orders,
  (newOrders) => {
    console.log("订单数据变化:", newOrders);
  },
);

// 生命周期钩子 - 组件挂载时
onMounted(() => {
  console.log("组件挂载");
});

// 生命周期钩子 - 组件卸载时
onUnmounted(() => {
  console.log("组件卸载");
});
</script>
