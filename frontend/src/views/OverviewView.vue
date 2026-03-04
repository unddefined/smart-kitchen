<template>
  <div class="flex flex-col h-full bg-gray-100">
    <!-- 调试信息 -->
    <div v-if="false" class="p-4 bg-yellow-100 rounded-lg m-4">
      <p>Pending dishes: {{ props.pendingDishes?.length || 0 }}</p>
      <p>Served dishes: {{ props.servedDishes?.length || 0 }}</p>
      <p>Merged dishes: {{ mergedPendingDishes.length }}</p>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <!-- 已出菜品瀑布流 -->
      <div
        class="mb-3 transition-all duration-300"
        :class="{ 'opacity-60': isServedCollapsed }"
        @mouseenter="cancelCollapseTimer"
        @mouseleave="startCollapseTimer"
      >
        <div
          class="flex justify-between items-center cursor-pointer select-none"
          @click="toggleServedSection"
        >
          <h3 class="text-lg font-medium text-gray-800">已出</h3>
          <span class="text-sm text-gray-600">
            {{ isServedCollapsed ? "展开" : "收起" }}
          </span>
        </div>
        <div
          v-show="!isServedCollapsed"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1"
        >
          <div
            v-for="dish in servedDishes"
            :key="dish.id"
            class="flex items-center justify-center bg-white rounded-lg p-3 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 border-2 border-gray-200 hover:border-gray-400 cursor-pointer"
            @click="handleServedDishClick(dish)"
          >
            <div
              class="flex items-center text-base font-semibold text-gray-800"
            >
              <span class="truncate max-w-[100px]">{{
                truncateDishName(dish.name)
              }}</span>
              <span class="mx-1 text-gray-900">×</span>
              <span class="font-bold text-gray-900">{{ dish.quantity }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 待处理菜品卡片 -->
      <div class="mb-3">
        <h3 class="text-lg font-medium text-gray-800">待上</h3>
        <div
          ref="waterfallContainer"
          class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-1.5"
        >
          <div
            v-for="(dish, index) in mergedPendingDishes"
            :key="`${dish.name}-${dish.priority}`"
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
            @longpress="showPriorityAdjustModal(dish)"
          >
            <!-- 待切配/待处理提示 -->
            <div
              v-if="dish.needsProcessing"
              class="absolute -top-2 left-1/2 transform -translate-x-1/2 text-blue-700 text-xl font-light z-10 whitespace-nowrap"
            >
              <span class="processing-text">{{ dish.processType }}</span>
            </div>

            <!-- 菜品主信息 -->
            <div
              class="flex items-center justify-center text-xl font-bold text-gray-800 leading-tight w-full mb-1 text-center"
            >
              <span class="truncate max-w-[120px] text-center">{{
                truncateDishName(dish.name)
              }}</span>
              <span class="text-black mx-1">×</span>
              <span class="font-bold text-gray-900">{{
                dish.totalQuantity
              }}</span>
            </div>

            <!-- 菜品详细标注 -->
            <div class="text-lg text-gray-800 leading-relaxed font-medium flex flex-col items-center justify-center">
              <!-- 催菜提示 - 当优先级为 3 时显示 -->
              <div
                v-if="dish.priority === 3"
                class="text-red-600 font-bold text-center mb-1"
              >
                催菜
              </div>
              <div
                v-for="(detail, idx) in dish.displayDetails"
                :key="idx"
                class="text-center break-all min-w-[80px]"
              >
                {{ detail }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 未起菜菜品列表 - 复用待处理区域样式 -->
      <div class="mb-3">
        <h3 class="text-lg font-medium text-gray-800">未起</h3>
        <div
          ref="unstartedWaterfallContainer"
          class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2"
        >
          <div
            v-for="(dish, index) in unstartedDishes"
            :key="`${dish.name}-${dish.priority}`"
            :ref="
              (el) => {
                if (el) unstartedCardRefs[index] = el;
              }
            "
            :class="[
              'break-inside-avoid mb-3 rounded-xl p-2 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer relative border-2',
              getPriorityClass(dish.priority),
              dish.needsProcessing ? 'border-4 border-blue-500' : '',
            ]"
            @click="handleDishClick(dish)"
            @dblclick="handleDishDoubleClick(dish)"
            @longpress="showPriorityAdjustModal(dish)"
          >
            <!-- 待切配/待处理提示 -->
            <div
              v-if="dish.needsProcessing"
              class="absolute -top-2 left-1/2 transform -translate-x-1/2 text-blue-700 text-lg font-light z-10 whitespace-nowrap"
            >
              <span class="processing-text">{{ dish.processType }}</span>
            </div>

            <!-- 菜品主信息 -->
            <div
              class="flex items-center justify-center text-base font-medium text-gray-700 leading-tight w-full mb-1"
            >
              <span class="truncate max-w-[100px] text-center">{{
                truncateDishName(dish.name)
              }}</span>
              <span class="text-gray-600 mx-1">×</span>
              <span class="font-semibold text-gray-800">{{
                dish.quantity
              }}</span>
            </div>

            <!-- 菜品详细标注 -->
            <div class="text-lg text-gray-800 leading-relaxed font-medium flex flex-col items-center justify-center">
              <div
                v-for="(detail, idx) in dish.displayDetails"
                :key="idx"
                class="text-center break-all min-w-[80px]"
              >
                {{ detail }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 优先级调整弹窗 -->
    <div
      v-if="showPriorityModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="closePriorityModal"
    >
      <div
        class="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl"
        @click.stop
      >
        <div
          class="flex justify-between items-center p-5 border-b border-gray-200"
        >
          <h3 class="text-lg font-semibold text-gray-800">调整出餐逻辑</h3>
          <button
            class="w-8 h-8 flex items-center justify-center text-gray-400 text-2xl hover:text-gray-600"
            @click="closePriorityModal"
          >
            ×
          </button>
        </div>
        <div class="p-5">
          <div class="mb-5 p-3 bg-gray-100 rounded-lg">
            <strong class="block text-base mb-1">{{
              currentDish?.name
            }}</strong>
            <span class="text-sm"
              >当前优先级: {{ getPriorityLabel(currentDish?.priority) }}</span
            >
          </div>

          <div class="mb-6">
            <div class="mb-5">
              <label class="block mb-3 font-medium text-gray-800"
                >调整数量:</label
              >
              <div class="flex items-center gap-3">
                <button
                  class="w-9 h-9 border border-gray-300 bg-white rounded-md flex items-center justify-center text-lg font-bold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  @click="decreaseQuantity"
                  :disabled="tempQuantity <= 1"
                >
                  -
                </button>
                <span class="min-w-10 text-center text-base font-semibold">{{
                  tempQuantity
                }}</span>
                <button
                  class="w-9 h-9 border border-gray-300 bg-white rounded-md flex items-center justify-center text-lg font-bold hover:bg-gray-50"
                  @click="increaseQuantity"
                >
                  +
                </button>
              </div>
            </div>

            <div class="mb-5">
              <label class="block mb-3 font-medium text-gray-800"
                >调整优先级:</label
              >
              <div class="grid grid-cols-2 gap-3">
                <button
                  v-for="level in priorityOptions"
                  :key="level.value"
                  :class="[
                    'py-3 border-2 rounded-lg bg-white font-medium transition-all duration-200',
                    tempPriority === level.value
                      ? 'border-3 scale-105'
                      : 'border-gray-300',
                    getPriorityButtonClass(
                      level.value,
                      tempPriority === level.value,
                    ),
                  ]"
                  @click="tempPriority = level.value"
                >
                  {{ level.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="flex gap-3 justify-end">
            <button
              class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
              @click="closePriorityModal"
            >
              取消
            </button>
            <button
              class="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600"
              @click="confirmPriorityAdjust"
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  onMounted,
  onUpdated,
  nextTick,
  onUnmounted,
} from "vue";

const props = defineProps({
  pendingDishes: {
    type: Array,
    default: () => [],
  },
  servedDishes: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["dish-action"]);

// 状态管理
const showPriorityModal = ref(false);
const currentDish = ref(null);
const tempQuantity = ref(1);
const tempPriority = ref(2);
const isServedCollapsed = ref(true);
const collapseTimer = ref(null);

// 瀑布流布局相关引用
const cardRefs = ref([]);
const unstartedCardRefs = ref([]);

// 获取优先级对应的CSS类
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

// 获取优先级按钮对应的CSS类
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

// 合并相同菜品的逻辑 - 过滤掉优先级为0的菜品（这些显示在未起区域）
const mergedPendingDishes = computed(() => {
  console.log("原始待处理菜品:", props.pendingDishes);

  // 过滤掉优先级为0的菜品（这些会显示在未起区域）
  const filteredDishes = props.pendingDishes.filter(
    (dish) => dish.priority !== 0,
  );

  const dishMap = new Map();

  filteredDishes.forEach((dish) => {
    const key = `${dish.name}-${dish.priority}`;
    if (dishMap.has(key)) {
      const existing = dishMap.get(key);
      existing.totalQuantity += dish.quantity;
      existing.quantities.push(dish.quantity);
      // 合并标注信息
      if (dish.details && dish.details.length > 0) {
        dish.details.forEach((detail) => {
          if (!existing.allDetails.includes(detail)) {
            existing.allDetails.push(detail);
          }
        });
      }
    } else {
      dishMap.set(key, {
        ...dish,
        totalQuantity: dish.quantity,
        quantities: [dish.quantity],
        allDetails: dish.details || [],
        needsProcessing: dish.status === "pending" || dish.status === "prep",
        processType: dish.status === "pending" ? "待切配" : "待处理",
      });
    }
  });

  // 处理显示的标注信息 - 按照MVP文档要求分别处理份量和备注
  let result = Array.from(dishMap.values()).map((dish) => {
    // 分离份量信息和备注信息
    const quantityDetails = []; // 存储份量信息
    const remarkDetails = []; // 存储备注信息

    dish.allDetails.forEach((detail) => {
      if (!detail || detail.trim() === "") return;

      // 判断是否为份量信息（包含数字+单位的格式）
      if (detail.match(/^\d+(个|份|斤|两)$/)) {
        quantityDetails.push(detail);
      }
      // 判断是否为备注信息（排除无意义的默认状态）
      else if (!detail.includes("正常") && !detail.match(/^标准?$/)) {
        remarkDetails.push(detail);
      }
    });

    // 构建显示的标注信息
    const displayDetails = [];

    // 如果有份量信息，按格式显示（如"12个·2份"）
    if (quantityDetails.length > 0) {
      // 统计每种份量的数量
      const quantityMap = new Map();
      quantityDetails.forEach((qty) => {
        quantityMap.set(qty, (quantityMap.get(qty) || 0) + 1);
      });

      // 生成格式化的份量显示
      quantityMap.forEach((count, qty) => {
        displayDetails.push(`${qty}·${count}份`);
      });
    }

    // 如果有备注信息，直接显示
    remarkDetails.forEach((remark) => {
      displayDetails.push(`${remark}·1份`);
    });

    return {
      ...dish,
      displayDetails: displayDetails,
    };
  });

  // 按优先级排序：3(红) > 2(黄) > 1(绿) > 0/-1(灰)
  result.sort((a, b) => {
    // 优先按优先级降序排列
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    // 优先级相同时按名称排序
    return a.name.localeCompare(b.name);
  });

  console.log("合并并排序后的菜品:", result);
  return result;
});

// 未起菜菜品列表 - 筛选出优先级为0的菜品
const unstartedDishes = computed(() => {
  return props.pendingDishes
    .filter((dish) => dish.priority === 0)
    .map((dish) => ({
      ...dish,
      displayDetails:
        dish.details?.filter(
          (detail) =>
            detail && detail.trim() !== "" && !detail.includes("正常"),
        ) || [],
    }));
});

// 优先级选项 - 严格按照MVP文档要求
const priorityOptions = [
  { label: "不急(1)", value: 1 },
  { label: "等一下(2)", value: 2 },
  { label: "催菜(3)", value: 3 },
  { label: "已出(-1)", value: -1 },
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

// 事件处理
const handleDishClick = (dish) => {
  console.log("点击菜品:", dish.name);
  emit("dish-action", "click", dish);
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

// 未起菜菜品点击处理
const handleUnstartedDishClick = (dish) => {
  console.log("点击未起菜:", dish.name);
  emit("dish-action", "unstarted-click", dish);
};

// 未起菜菜品双击处理
const handleUnstartedDishDoubleClick = (dish) => {
  console.log("双击未起菜:", dish.name);
  emit("dish-action", "unstarted-double-click", dish);
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

// 生命周期钩子
onMounted(() => {
  console.log("OverviewView mounted");
  console.log("接收到的props:", props);
  startCollapseTimer();
});

onUnmounted(() => {
  cancelCollapseTimer();
});
</script>
