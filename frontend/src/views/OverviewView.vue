<template>
  <div class="flex flex-col h-full bg-gray-100">
    <!-- Toast 提示 -->
    <Toast v-model:visible="toast.visible" :message="toast.message" :type="toast.type" :duration="toast.duration" />

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
      <!-- 调试信息 -->
      <div v-if="false" class="p-4 bg-yellow-100 rounded-lg m-4">
        <p>Pending dishes: {{ pendingDishes?.length || 0 }}</p>
        <p>Served dishes: {{ servedDishes?.length || 0 }}</p>
        <p>Unstarted dishes: {{ unstartedDishes?.length || 0 }}</p>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <!-- 已出菜品瀑布流 -->
        <div
          class="mb-3 transition-all duration-300"
          :class="{ 'opacity-60': isServedCollapsed }"
          @mouseenter="cancelCollapseTimer"
          @mouseleave="startCollapseTimer">
          <div class="flex justify-between items-center cursor-pointer select-none" @click="toggleServedSection">
            <h3 class="text-lg font-medium text-gray-800">已出</h3>
            <span class="text-sm text-gray-600">
              {{ isServedCollapsed ? "展开" : "收起" }}
            </span>
          </div>
          <div v-show="!isServedCollapsed" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
            <div
              v-for="dish in servedDishes"
              :key="dish.id"
              class="flex items-center justify-center bg-white rounded-lg p-3 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 border-gray-200 hover:border-gray-400 cursor-pointer"
              @click="handleServedDishClick(dish)">
              <div class="flex items-center text-base font-semibold text-gray-800">
                <span class="truncate max-w-[100px]">{{ truncateDishName(dish.name) }}</span>
                <span class="mx-1 text-gray-900">×</span>
                <span class="font-bold text-gray-900">{{ dish.quantity }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 待处理菜品卡片 -->
        <div class="mb-3">
          <h3 class="text-lg font-medium text-gray-800">待上</h3>
          <div ref="waterfallContainer" class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-1.5">
            <div
              v-for="(dish, index) in pendingDishes"
              :key="`pending-${dish.itemId}`"
              :ref="
                (el) => {
                  if (el) cardRefs[index] = el;
                }
              "
              :class="[
                'break-inside-avoid mb-2 rounded-xl p-1.5 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:scale-105 hover:shadow-xl cursor-pointer relative',
                getPriorityClass(dish.priority),
                dish.needsProcessing ? 'border-4 border-blue-500' : '',
              ]"
              @click="handleDishClick(dish)"
              @dblclick="handleDishDoubleClick(dish)"
              @contextmenu.prevent="onLongPress(dish)">
              <!-- 待切配/待处理提示 -->
              <div
                v-if="dish.needsProcessing"
                class="absolute -top-2 left-1/2 transform -translate-x-1/2 text-blue-700 text-xl font-light z-10 whitespace-nowrap">
                <span class="processing-text">{{ dish.processType }}</span>
              </div>

              <!-- 菜品主信息 -->
              <div class="flex items-center justify-center text-xl font-bold text-gray-800 leading-tight w-full mb-1 text-center">
                <span class="truncate max-w-[120px] text-center">{{ truncateDishName(dish.name) }}</span>
                <span class="text-black mx-1">×</span>
                <span class="font-bold text-gray-900">{{ dish.totalQuantity }}</span>
              </div>

              <!-- 菜品详细标注 -->
              <div class="text-lg text-gray-800 leading-relaxed font-medium flex flex-col items-center justify-center">
                <div v-for="(detail, idx) in dish.displayDetails" :key="idx" class="text-center break-all min-w-[80px]">
                  {{ detail }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 未起菜菜品列表 -->
        <div class="mb-3">
          <h3 class="text-lg font-medium text-gray-800">未起</h3>
          <div ref="unstartedWaterfallContainer" class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2">
            <div
              v-for="(dish, index) in unstartedDishes"
              :key="`unstarted-${dish.itemId}`"
              :ref="
                (el) => {
                  if (el) unstartedCardRefs[index] = el;
                }
              "
              :class="[
                'break-inside-avoid mb-3 rounded-xl p-1 shadow transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer relative border-2',
                getPriorityClass(dish.priority),
                dish.needsProcessing ? 'border-4 border-blue-500' : '',
              ]"
              @click="handleDishClick(dish)"
              @dblclick="handleDishDoubleClick(dish)"
              @contextmenu.prevent="onLongPress(dish)">
              <!-- 待切配/待处理提示 -->
              <div
                v-if="dish.needsProcessing"
                class="absolute -top-2 left-1/2 transform -translate-x-1/2 text-blue-700 text-lg font-light z-10 whitespace-nowrap">
                <span class="processing-text">{{ dish.processType }}</span>
              </div>

              <!-- 菜品主信息 -->
              <div class="flex items-center justify-center text-base font-medium text-gray-700 leading-tight w-full mb-1">
                <span class="text-xl truncate max-w-[100px] text-center">{{ truncateDishName(dish.name) }}</span>
                <span class="text-gray-600 mx-1">×</span>
                <span class="font-semibold text-gray-800 text-xl">{{ dish.quantity }}</span>
              </div>

              <!-- 菜品详细标注 -->
              <div class="text-lg text-gray-800 leading-relaxed font-medium flex flex-col items-center justify-center">
                <!-- 催菜提示 - 基于订单状态显示，而不是优先级 -->
                <div v-if="dish.orderStatus === 'urged'" class="text-red-600 font-bold text-center mb-1">{{ dish.hallNumber }}催菜</div>
                <div v-for="(detail, idx) in dish.displayDetails" :key="idx" class="text-center break-all min-w-[80px]">
                  {{ detail }}
                </div>
              </div>
            </div>
          </div>
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
import { OrderService } from "@/services";
import { ServingService } from "@/services";
import { api } from "@/services/api";
import Toast from "@/components/Toast.vue";
import { useToast } from "@/composables/useToast";
import { useOrderAutoRefresh } from "@/composables/useOrderAutoRefresh";

// 自定义 v-longpress 指令
const vLongpress = {
  beforeMount(el, binding) {
    let timer = null;
    const delay = binding.arg || 500; // 默认 500ms 触发长按
    
    const startHandler = (event) => {
      // 防止触发点击事件
      if (event.type === 'touchstart') {
        event.preventDefault();
      }
      
      timer = setTimeout(() => {
        if (typeof binding.value === 'function') {
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
    
    el.addEventListener('mousedown', startHandler);
    el.addEventListener('touchstart', startHandler, { passive: false });
    el.addEventListener('mouseup', cancelHandler);
    el.addEventListener('mouseleave', cancelHandler);
    el.addEventListener('touchend', cancelHandler);
    el.addEventListener('touchcancel', cancelHandler);
  },
  unmounted(el) {
    if (el._longpressHandlers) {
      const { startHandler, cancelHandler } = el._longpressHandlers;
      el.removeEventListener('mousedown', startHandler);
      el.removeEventListener('touchstart', startHandler);
      el.removeEventListener('mouseup', cancelHandler);
      el.removeEventListener('mouseleave', cancelHandler);
      el.removeEventListener('touchend', cancelHandler);
      el.removeEventListener('touchcancel', cancelHandler);
      delete el._longpressHandlers;
    }
  }
};

// 定义 Props - 接收父组件传递的 orders 数据
const props = defineProps({
  orders: {
    type: Array,
    required: true,
    default: () => [],
  },
});

// 使用 toast 组合式函数
const { toast, showToast, showSuccess, showError, showInfo } = useToast();

// 状态管理
const loading = ref(false);
const error = ref(null);
const showPriorityModal = ref(false);
const currentDish = ref(null);
const tempQuantity = ref(1);
const tempPriority = ref(2);
const isServedCollapsed = ref(true);
const collapseTimer = ref(null);

// 数据 - 不再本地存储 orders，直接使用 props.orders
const cardRefs = ref([]);
const unstartedCardRefs = ref([]);

// 右键菜单功能
const onLongPress = (dish) => {
  console.log("右键点击菜品:", dish.name);
  showPriorityAdjustModal(dish);
};

// 获取优先级对应的 CSS 类
const getPriorityClass = (priority) => {
  const classes = {
    3: "bg-red-300", // 红色 - 催菜
    2: "bg-yellow-300", // 黄色 - 等一下
    1: "bg-green-300", // 绿色 - 不急
    0: "bg-gray-100 text-gray-400", // 灰色 - 未起
    "-1": "bg-gray-100 text-gray-500 opacity-70", // 灰色 - 已出
  };
  return classes[priority] || "bg-white";
};

// 获取优先级按钮对应的 CSS 类
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

// 计算属性 - 直接使用 props.orders
const extractDishesFromOrders = () => {
  const result = [];

  if (!props.orders || props.orders.length === 0) {
    return result;
  }

  props.orders.forEach((order) => {
    if (!order.orderItems || order.orderItems.length === 0) {
      return;
    }

    order.orderItems.forEach((item) => {
      if (!item.dish) return;

      // 跳过已取消的菜品
      if (item.status === "cancelled") {
        return;
      }

      // 跳过未开始的订单中的菜品
      if (order.status !== "started") {
        return;
      }

      // 计算实际数量：根据 countable 字段决定
      let quantity = item.quantity;
      let totalQuantity = item.quantity * (order.tableCount || 1);
      
      if (item.dish.countable === true) {
        // 按人头计数：显示数量 = 人数
        quantity = order.peopleCount || 1;
        totalQuantity = order.peopleCount || 1;
      } else {
        // 普通菜品：数量 = 份量 × 桌数
        quantity = item.quantity;
        totalQuantity = item.quantity * (order.tableCount || 1);
      }

      const dish = {
        ...item.dish,
        itemId: item.id,
        id: item.id, // 确保有 id 字段
        orderId: order.id,
        status: item.status,
        quantity: quantity, // 显示的数量
        totalQuantity: totalQuantity, // 合并后的总数量
        priority: item.priority,
        remark: item.remark,
        hallNumber: order.hallNumber,
        peopleCount: order.peopleCount,
        tableCount: order.tableCount,
        orderStatus: order.status,
        needPrep: item.dish.needPrep,
        countable: item.dish.countable,
        details: [],
        orderIds: [order.id], // 记录包含此菜品的所有订单 ID
        hallNumbers: [order.hallNumber], // 记录所有厅号
      };

      // 处理备注信息
      if (dish.remark && dish.remark.trim() !== "") {
        dish.details.push(dish.remark);
      }

      result.push(dish);
    });
  });

  return result;
};

// 合并同名同状态同优先级的菜品
const mergeDishes = (dishes) => {
  const mergedMap = new Map();

  dishes.forEach((dish) => {
    // 使用"名称 + 状态 + 优先级"作为合并键
    const mergeKey = `${dish.name}|${dish.status}|${dish.priority}`;

    if (mergedMap.has(mergeKey)) {
      // 已存在相同菜品，累加数量和信息
      const existing = mergedMap.get(mergeKey);
      existing.totalQuantity += dish.totalQuantity;
      
      // 合并订单信息（去重）
      if (!existing.orderIds.includes(dish.orderId)) {
        existing.orderIds.push(dish.orderId);
      }
      if (dish.hallNumber && !existing.hallNumbers.includes(dish.hallNumber)) {
        existing.hallNumbers.push(dish.hallNumber);
      }
      
      // 对于 countable 菜品，需要保留人数和桌数信息用于显示
      if (dish.countable) {
        existing.countable = true;
        // 计算每桌分配数量
        const perTableCount = Math.floor(dish.peopleCount / dish.tableCount);
        
        // 如果已有相同每桌数量的组，累加桌数
        if (!existing.perTableGroups) {
          existing.perTableGroups = {};
        }
        
        if (existing.perTableGroups[perTableCount]) {
          // 已有相同每桌数量的订单，累加桌数和人数
          existing.perTableGroups[perTableCount].tableCount += dish.tableCount;
          existing.perTableGroups[perTableCount].peopleCount += dish.peopleCount;
        } else {
          // 新的每桌数量，创建新组
          existing.perTableGroups[perTableCount] = {
            tableCount: dish.tableCount,
            peopleCount: dish.peopleCount,
          };
        }
      } else {
        // 普通菜品，累加份量和桌数
        existing.quantity = (existing.quantity || 0) + dish.quantity;
        existing.tableCount = (existing.tableCount || 0) + dish.tableCount;
      }
      
      // 合并备注信息（去重）
      dish.details.forEach((detail) => {
        if (detail && !existing.details.includes(detail)) {
          existing.details.push(detail);
        }
      });
    } else {
      // 新菜品，直接添加
      const newDish = { ...dish };
      // 初始化 countable 菜品的分组信息
      if (dish.countable) {
        const quotient = Math.floor(dish.peopleCount / dish.tableCount);
        const remainder = dish.peopleCount % dish.tableCount;
        newDish.perTableGroups = {};
        
        // 有余数时，添加较多人数的组
        if (remainder > 0) {
          newDish.perTableGroups[quotient + 1] = remainder;
        }
        
        // 添加较少人数的组
        if (quotient > 0 && dish.tableCount - remainder > 0) {
          newDish.perTableGroups[quotient] = dish.tableCount - remainder;
        }
      }
      mergedMap.set(mergeKey, newDish);
    }
  });

  return Array.from(mergedMap.values());
};

// 已出菜品 - 筛选出状态为 served 的菜品
const servedDishes = computed(() => {
  const allDishes = extractDishesFromOrders();
  const filtered = allDishes.filter((dish) => dish.status === "served" && dish.priority === -1);
  const merged = mergeDishes(filtered);
  return merged.map((dish) => ({
    ...dish,
    displayDetails: generateDisplayDetails(dish),
  }));
});

// 待处理菜品列表 - 包括准备中和待切配的菜品（优先级 > 0 且非 served）
const pendingDishes = computed(() => {
  const allDishes = extractDishesFromOrders();
  const filtered = allDishes.filter((dish) => dish.priority > 0 && dish.orderStatus === "serving");
  const merged = mergeDishes(filtered);
  return merged.map((dish) => ({
    ...dish,
    needsProcessing: dish.status === "pending" || dish.status === "preparing",
    processType: dish.status === "pending" ? "待切配" : dish.status === "preparing" ? "待处理" : "",
    displayDetails: generateDisplayDetails(dish),
  }));
});

// 未起菜菜品列表 - 筛选出订单状态为 started 且优先级为 0 的菜品（可能处于备菜的任何阶段）
const unstartedDishes = computed(() => {
  const allDishes = extractDishesFromOrders();
  const filtered = allDishes.filter((dish) => dish.orderStatus === "started" && dish.priority === 0);
  const merged = mergeDishes(filtered);
  return merged.map((dish) => ({
    ...dish,
    needsProcessing: dish.status === "pending" || dish.status === "preparing",
    processType: dish.status === "pending" ? "待切配" : dish.status === "preparing" ? "待处理" : "",
    displayDetails: generateDisplayDetails(dish),
  }));
});

// 生成菜品详细标注信息
const generateDisplayDetails = (dish) => {
  const details = [];
  
  // 如果是按人头计数的菜品（countable = true），显示人数和桌数信息
  if (dish.countable === true && dish.perTableGroups) {
    // 遍历所有不同的每桌数量分组
    Object.keys(dish.perTableGroups).forEach((perTableCount) => {
      const group = dish.perTableGroups[perTableCount];
      // 格式：[人数÷桌数]个×[桌数]份
      details.push(`${perTableCount}个×${group.tableCount}份`);
    });
  } else {
    // 普通菜品，如果份量 > 1 或桌数 > 1，显示份量和桌数信息
    if (dish.quantity > 1 || dish.tableCount > 1) {
      const parts = [];
      if (dish.quantity > 1) {
        parts.push(`${dish.quantity}份`);
      }
      if (dish.tableCount > 1) {
        parts.push(`${dish.tableCount}桌`);
      }
      details.push(parts.join('/'));
    }
  }
  
  // 添加催菜提示（基于订单状态）
  if (dish.orderStatus === 'urged' && dish.hallNumber) {
    details.push(`${dish.hallNumber}催菜`);
  }
  
  // 添加备注信息（排除"正常"等无效备注）
  if (dish.details && dish.details.length > 0) {
    dish.details.forEach((detail) => {
      if (detail && detail.trim() !== "" && !detail.includes("正常")) {
        details.push(detail);
      }
    });
  }
  
  // 如果有多订单信息，显示厅号列表
  // if (dish.hallNumbers && dish.hallNumbers.length > 1) {
  //   details.push(`共${dish.hallNumbers.length}单`);
  // }
  
  return details;
};

// 优先级选项 - 严格按照 MVP文档要求
const priorityOptions = [
  { label: "不急 (1)", value: 1 },
  { label: "等一下 (2)", value: 2 },
  { label: "催菜 (3)", value: 3 },
  { label: "已出 (-1)", value: -1 },
];

// 工具函数
const truncateDishName = (name) => {
  if (!name || name.length <= 8) {
    return name;
  }

  // 保留最后一个字，省略中间部分
  const maxLength = 8;
  const lastChar = name.slice(-1); // 最后一个字符
  const prefixLength = maxLength - 1; // 前面可显示的字符数

  if (prefixLength > 0) {
    return name.substring(0, prefixLength) + "..." + lastChar;
  } else {
    // 极端情况下，只显示最后几个字符
    return "..." + name.slice(-Math.min(5, name.length));
  }
};

const getPriorityLabel = (priority) => {
  const option = priorityOptions.find((opt) => opt.value === priority);
  return option ? option.label : "未知";
};

// 事件处理 - 点击菜品卡片实现状态流转
const handleDishClick = async (dish) => {
  console.log("点击菜品:", dish.name, "当前状态:", dish.status, "优先级:", dish.priority, "needPrep:", dish.needPrep);

  // 根据 MVP文档，优先级为 0 的菜品（未起）不能直接上菜
  if (dish.priority === 0 && (dish.status === "ready" || dish.status === "preparing")) {
    showError(`菜品"${dish.name}"还未起菜，无法上菜。`);
    return;
  }

  // 根据 need_prep 字段和当前状态执行不同的流转逻辑
  // need_prep=true: pending → preparing → ready → served
  // need_prep=false: pending → ready → served（跳过 preparing 阶段）
  let result;
  let message;

  try {
    if (dish.status === "pending") {
      // 检查是否需要预处理
      if (dish.needPrep === false) {
        // 不需要预处理，直接从 pending → ready（通过标记完成切配实现）
        result = await api.serving.completePrep(dish.id);
        message = `已将"${dish.name}"标记为准备下锅（跳过预处理）`;
      } else {
        // 需要预处理，pending → preparing
        result = await ServingService.completePreparation(dish.id);
        message = `已将"${dish.name}"标记为待处理`;
      }
    } else if (dish.status === "preparing") {
      // preparing → ready: 准备下锅
      result = await api.serving.completePrep(dish.id);
      message = `已将"${dish.name}"标记为准备下锅`;
    } else if (dish.status === "ready") {
      // ready → served: 上菜（同时自动将优先级设为 -1）
      result = await ServingService.serveDish(dish.id);
      message = `已将"${dish.name}"标记为已上菜`;
    } else if (dish.status === "served") {
      // 已经是已上菜状态，不做处理
      message = `"${dish.name}"已经是已上菜状态`;
      showInfo(message);
      return;
    } else {
      // 其他状态（如 cancelled），提示用户
      message = `无法更改"${dish.name}"的状态（当前状态：${dish.status}）`;
      showError(message);
      return;
    }

    console.log(message, result);

    // 操作成功后刷新数据
    if (result?.success) {
      showSuccess(message);

      // 等待一小段时间再刷新，让用户看到提示
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      // 发送事件通知父组件，由父组件负责刷新数据
      emit("dish-action", "status-changed", {
        dish,
        newStatus: result.data?.status || dish.status,
        newPriority: result.data?.priority || dish.priority,
        message,
      });
    } else {
      // 操作失败显示错误提示
      showError(result?.message || message);
    }
  } catch (error) {
    console.error("状态更新失败:", error);
    // 显示后端返回的具体错误信息（如"还未起菜，无法上菜"）
    showError(error.message || "状态更新失败");
  }
};

const handleDishDoubleClick = (dish) => {
  console.log("双击菜品:", dish.name);
  emit("dish-action", "double-click", dish);
};

const showPriorityAdjustModal = (dish) => {
  currentDish.value = dish;
  tempQuantity.value = dish.totalQuantity;
  tempPriority.value = dish.priority;
  showPriorityModal.value = true;
};

const closePriorityModal = () => {
  showPriorityModal.value = false;
  currentDish.value = null;
};

const decreaseQuantity = () => {
  if (tempQuantity.value > 1) {
    tempQuantity.value--;
  }
};

const increaseQuantity = () => {
  tempQuantity.value++;
};

const confirmPriorityAdjust = () => {
  console.log("调整菜品:", {
    dish: currentDish.value.name,
    quantity: tempQuantity.value,
    priority: tempPriority.value,
  });

  closePriorityModal();
  emit("dish-action", "adjust-priority", {
    dish: currentDish.value,
    quantity: tempQuantity.value,
    priority: tempPriority.value,
  });
};

const handleServedDishClick = (dish) => {
  emit("dish-action", "served-click", dish);
};

const toggleServedSection = () => {
  isServedCollapsed.value = !isServedCollapsed.value;
};

const startCollapseTimer = () => {
  cancelCollapseTimer();
  collapseTimer.value = setTimeout(() => {
    isServedCollapsed.value = true;
  }, 5000);
};

const cancelCollapseTimer = () => {
  if (collapseTimer.value) {
    clearTimeout(collapseTimer.value);
    collapseTimer.value = null;
  }
};

// 定义事件
const emit = defineEmits(["dish-action"]);

// 监听父组件传递的 orders 变化，更新本地数据（用于调试日志）
watch(
  () => props.orders,
  (newOrders) => {
    console.log("=== OverviewView watch 触发 ===");
    console.log("收到父组件传递的 orders:", newOrders);
    console.log("orders 数量:", newOrders.length);

    if (newOrders && newOrders.length > 0) {
      newOrders.forEach((order, index) => {
        console.log(`订单 ${index + 1}:`, {
          id: order.id,
          hallNumber: order.hallNumber,
          status: order.status,
          itemCount: order.orderItems?.length,
        });
      });
    }
  },
  { immediate: true },
);

// 移除 loadDishes 方法，数据由父组件管理
</script>
