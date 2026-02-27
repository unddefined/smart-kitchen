<template>
  <div class="overview-container">
    <!-- 调试信息 -->
    <div v-if="false" class="debug-info">
      <p>Pending dishes: {{ props.pendingDishes?.length || 0 }}</p>
      <p>Served dishes: {{ props.servedDishes?.length || 0 }}</p>
      <p>Merged dishes: {{ mergedPendingDishes.length }}</p>
    </div>

    <div class="overview-content">
      <!-- 已出菜品瀑布流 -->
      <div class="served-section" :class="{ collapsed: isServedCollapsed }" @mouseenter="cancelCollapseTimer" @mouseleave="startCollapseTimer">
        <div class="section-header" @click="toggleServedSection">
          <h3 class="subtitle">已出</h3>
          <span class="collapse-indicator">
            {{ isServedCollapsed ? "展开" : "收起" }}
          </span>
        </div>
        <div v-show="!isServedCollapsed" class="served-grid">
          <div v-for="dish in servedDishes" :key="dish.id" class="served-card" @click="handleServedDishClick(dish)">
            <div class="served-main">
              <span class="dish-name">{{ truncateDishName(dish.name) }}</span>
              <span class="dish-count">×</span>
              <span class="dish-quantity">{{ dish.quantity }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 待处理菜品卡片 -->
      <div class="pending-section">
        <h3 class="subtitle">待上</h3>
        <div ref="waterfallContainer" class="dish-grid">
          <div
            v-for="(dish, index) in mergedPendingDishes"
            :key="`${dish.name}-${dish.priority}`"
            :ref="
              (el) => {
                if (el) cardRefs[index] = el;
              }
            "
            :class="['dish-card', `priority-${dish.priority}` + (dish.needsProcessing ? ' pending-processing' : '')]"
            @click="handleDishClick(dish)"
            @dblclick="handleDishDoubleClick(dish)"
            @longpress="showPriorityAdjustModal(dish)">
            <!-- 待切配/待处理提示 -->
            <div v-if="dish.needsProcessing" class="processing-overlay">
              <span class="processing-text">{{ dish.processType }}</span>
            </div>

            <!-- 菜品主信息 -->
            <div class="dish-main">
              <span class="dish-name">{{ truncateDishName(dish.name) }}</span>
              <span class="dish-count">×</span>
              <span class="dish-quantity">{{ dish.totalQuantity }}</span>
            </div>

            <!-- 菜品详细标注 -->
            <div class="dish-details">
              <div v-for="(detail, idx) in dish.displayDetails" :key="idx" class="detail-item">
                {{ detail }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 未起菜菜品列表 - 复用待处理区域样式 -->
      <div class="pending-section">
        <h3 class="subtitle">未起</h3>
        <div ref="unstartedWaterfallContainer" class="dish-grid">
          <div
            v-for="(dish, index) in unstartedDishes"
            :key="`${dish.name}-${dish.priority}`"
            :ref="
              (el) => {
                if (el) unstartedCardRefs[index] = el;
              }
            "
            :class="['dish-card', `priority-${dish.priority}` + (dish.needsProcessing ? ' pending-processing' : '')]"
            @click="handleDishClick(dish)"
            @dblclick="handleDishDoubleClick(dish)"
            @longpress="showPriorityAdjustModal(dish)">
            <!-- 待切配/待处理提示 -->
            <div v-if="dish.needsProcessing" class="processing-overlay">
              <span class="processing-text">{{ dish.processType }}</span>
            </div>

            <!-- 菜品主信息 -->
            <div class="dish-main">
              <span class="dish-name">{{ truncateDishName(dish.name) }}</span>
              <span class="dish-count">×</span>
              <span class="dish-quantity">{{ dish.quantity }}</span>
            </div>

            <!-- 菜品详细标注 -->
            <div class="dish-details">
              <div v-for="(detail, idx) in dish.displayDetails" :key="idx" class="detail-item">
                {{ detail }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 优先级调整弹窗 -->
    <div v-if="showPriorityModal" class="modal-overlay" @click="closePriorityModal">
      <div class="priority-modal" @click.stop>
        <div class="modal-header">
          <h3>调整出餐逻辑</h3>
          <button class="close-btn" @click="closePriorityModal">×</button>
        </div>
        <div class="modal-content">
          <div class="dish-info">
            <strong>{{ currentDish?.name }}</strong>
            <span>当前优先级: {{ getPriorityLabel(currentDish?.priority) }}</span>
          </div>

          <div class="adjust-options">
            <div class="quantity-adjust">
              <label>调整数量:</label>
              <div class="quantity-controls">
                <button @click="decreaseQuantity" :disabled="tempQuantity <= 1">-</button>
                <span class="quantity-display">{{ tempQuantity }}</span>
                <button @click="increaseQuantity">+</button>
              </div>
            </div>

            <div class="priority-adjust">
              <label>调整优先级:</label>
              <div class="priority-buttons">
                <button
                  v-for="level in priorityOptions"
                  :key="level.value"
                  :class="['priority-btn', `priority-${level.value}`, { active: tempPriority === level.value }]"
                  @click="tempPriority = level.value">
                  {{ level.label }}
                </button>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="cancel-btn" @click="closePriorityModal">取消</button>
            <button class="confirm-btn" @click="confirmPriorityAdjust">确认</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUpdated, nextTick, onUnmounted } from "vue";

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

// 合并相同菜品的逻辑 - 过滤掉优先级为0的菜品（这些显示在未起区域）
const mergedPendingDishes = computed(() => {
  console.log("原始待处理菜品:", props.pendingDishes);

  // 过滤掉优先级为0的菜品（这些会显示在未起区域）
  const filteredDishes = props.pendingDishes.filter((dish) => dish.priority !== 0);

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
      displayDetails: dish.details?.filter((detail) => detail && detail.trim() !== "" && !detail.includes("正常")) || [],
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

<style scoped>
.overview-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.overview-header {
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.overview-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.pending-section,
.served-section,
.unstarted-section {
  margin-bottom: 24px;
}

.served-section.collapsed .served-grid,
.unstarted-section.collapsed .unstarted-grid {
  display: none;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.subtitle {
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.collapse-indicator {
  font-size: 14px;
  color: #666;
}

/* 待处理菜品瀑布流容器 */
.dish-grid {
  position: relative;
  width: 100%;
  column-count: 2;
  column-gap: 8px;
  transition: height 0.3s ease;
}
.dish-card {
  display: block;
  background: white;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  break-inside: avoid;
  justify-content: space-between;
  will-change: transform;
  margin-bottom: 12px;
}

.dish-card:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  z-index: 10;
}

/* 待切配/待处理状态样式 */
.dish-card.pending-processing {
  border: 5px solid #3b82f6;
}

.processing-overlay {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  color: rgb(0, 100, 146);
  font-size: 21px;
  font-weight: 300;
  z-index: 10;
  white-space: nowrap;
}

/* 增强优先级颜色对比度 - 严格按照MVP文档的颜色编码 */
.priority-3 {
  background: #ff9a85;
}

.priority-2 {
  background: #ffdb66;
}

.priority-1 {
  background: #c9e68c;
}

.priority-0 {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: #e5e5e5;
}

.priority--1 {
  border: 2px solid #6b7280; /* 灰色 - 已出 */
  background: linear-gradient(135deg, #f9fafb 0%, #e5e7eb 100%);
  color: #6b7280;
  opacity: 0.8;
}

/* 菜品主信息 - 垂直居中对齐 */
.dish-main {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: bold;
  color: #1f2937;
  line-height: 1.3;
  width: 100%;
  margin-bottom: 8px;
  text-align: center;
}

.dish-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center; /* 名称居中 */
}

.dish-count {
  /* margin: 0 4px; */
  color: #000000;
}

.dish-quantity {
  font-weight: 700;
  color: #111827;
}

/* 菜品详细标注 - 按照MVP文档优化显示 */
.dish-details {
  font-size: 20px; /* 稍微减小字体以容纳更多信息 */
  color: #374151;
  line-height: 1.4; /* 增加行间距提高可读性 */
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-top: 8px; /* 与主信息保持适当间距 */
}

.detail-item {
  margin-bottom: 6px; /* 增加项目间距 */
  word-break: break-all;
  text-align: center; /* 居中显示 */
  padding: 2px 8px; /* 增加内边距 */
  min-width: 80px; /* 最小宽度确保对齐 */
}

.detail-item:last-child {
  margin-bottom: 0;
}

/* 已出菜品瀑布流 - 增强对比度 */
.served-section {
  transition: all 0.3s ease;
}

.served-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.served-card {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); /* 增强阴影 */
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid #e5e7eb; /* 添加边框 */
}

.served-card:hover {
  opacity: 1;
  transform: scale(1.05);
  border-color: #9ca3af; /* 悬停时边框变深 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.served-main {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600; /* 增加字体粗细 */
  color: #1f2937; /* 更深的文字颜色 */
  line-height: 1.3;
}

/* 未起菜菜品卡片样式 */
.unstarted-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 16px 0;
}

.unstarted-card {
  background: #f5f5f5; /* 灰色背景表示未起菜 */
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.unstarted-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #9ca3af; /* 灰色边框 */
}

.unstarted-main {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.unstarted-main .dish-name {
  font-size: 16px;
  font-weight: 500;
  color: #374151;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unstarted-main .dish-count {
  font-size: 14px;
  color: #6b7280;
  margin: 0 4px;
}

.unstarted-main .dish-quantity {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
  min-width: 20px;
  text-align: center;
}

.unstarted-details {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.unstarted-details .detail-item {
  background: rgba(156, 163, 175, 0.2);
  color: #4b5563;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

/* 优先级调整弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.priority-modal {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  padding: 20px;
}

.dish-info {
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.dish-info strong {
  display: block;
  font-size: 16px;
  margin-bottom: 4px;
}

.adjust-options {
  margin-bottom: 24px;
}

.quantity-adjust,
.priority-adjust {
  margin-bottom: 20px;
}

.quantity-adjust label,
.priority-adjust label {
  display: block;
  margin-bottom: 12px;
  font-weight: 500;
  color: #333;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-controls button {
  width: 36px;
  height: 36px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quantity-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity-display {
  min-width: 40px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.priority-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.priority-btn {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.priority-btn.active {
  border-width: 3px;
  transform: scale(1.05);
}

.priority-btn.priority-1 {
  border-color: #c9e68c;
  background: #f0f9ff;
}

.priority-btn.priority-1.active {
  background: #c9e68c;
  color: white;
}

.priority-btn.priority-2 {
  border-color: #ffdb66;
  background: #fffbeb;
}

.priority-btn.priority-2.active {
  background: #ffdb66;
  color: #333;
}

.priority-btn.priority-3 {
  border-color: #ff9a85;
  background: #fff5f5;
}

.priority-btn.priority-3.active {
  background: #ff9a85;
  color: white;
}

.priority-btn.priority--1 {
  border-color: #6b7280;
  background: #f9fafb;
}

.priority-btn.priority--1.active {
  background: #6b7280;
  color: white;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.cancel-btn,
.confirm-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
}

.cancel-btn {
  background: #f3f4f6;
  color: #374151;
}

.confirm-btn {
  background: #3b82f6;
  color: white;
}

.confirm-btn:hover {
  background: #2563eb;
}
</style>
