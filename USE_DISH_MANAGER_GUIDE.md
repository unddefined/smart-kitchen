# useDishManager Composable 使用指南（精简版）

## 定位变化

**之前的问题**：试图把所有逻辑（包括复杂的 merge 和数据处理）都塞进 composable，导致职责不清。

**现在的定位**：**专注于交互逻辑** - 点击、长按、优先级调整、状态流转。

**数据处理**：由各视图根据需求自行实现（merge、extract、generateDetails 等）。

## API

### 导入方式
```javascript
import { useDishManager } from "@/composables/useDishManager";
```

### 配置选项（简化了）
```javascript
const dishManager = useDishManager({
  onStatusChange: (dish, newStatus, newPriority) => {},  // 状态变更回调
  onPriorityAdjust: (dish, quantity, priority) => {},    // 优先级调整回调
});
```

### 返回值

#### 状态
- `showPriorityModal`: ref<boolean> - 优先级调整弹窗显示状态
- `currentDish`: ref<Object> - 当前操作的菜品对象
- `tempQuantity`: ref<number> - 临时数量值
- `tempPriority`: ref<number> - 临时优先级值
- `isServedCollapsed`: ref<boolean> - 已出区域是否折叠
- `collapseTimer`: ref<any> - 折叠计时器
- `priorityOptions`: Array - 优先级选项列表 `[{label, value}]`

#### 方法
- `getPriorityClass(priority)`: 获取优先级对应的 CSS 类名
- `getPriorityButtonClass(priority, isActive)`: 获取优先级按钮的 CSS 类名
- `getPriorityLabel(priority)`: 获取优先级标签文本
- `truncateDishName(name, maxLength)`: 截断菜品名称
- `handleDishClick(dish, showToastFn, refreshFn, emitFn)`: **核心方法** - 处理菜品点击（状态流转）
- `showPriorityAdjustModal(dish)`: 显示优先级调整弹窗
- `closePriorityModal()`: 关闭优先级调整弹窗
- `decreaseQuantity()`: 减少数量
- `increaseQuantity()`: 增加数量
- `confirmPriorityAdjust(emitFn)`: 确认优先级调整
- `handleServedDishClick(dish, emitFn)`: 处理已出菜品点击
- `toggleServedSection()`: 切换已出区域折叠状态
- `startCollapseTimer()`: 开始折叠计时器
- `cancelCollapseTimer()`: 取消折叠计时器
- `handleDishDoubleClick(dish, emitFn)`: 处理菜品双击事件

## 使用示例

### OverviewView（多订单聚合模式）

```vue
<template>
  <div class="flex flex-col h-full">
    <!-- 待上区域 -->
    <div>
      <h3>待上</h3>
      <div v-for="dish in pendingDishes" :key="dish.id"
           :class="getPriorityClass(dish.priority)"
           @click="handleDishClick(dish)"
           @contextmenu.prevent="showPriorityAdjustModal(dish)">
        <span>{{ truncateDishName(dish.name) }}</span>
        <span>×{{ dish.totalQuantity }}</span>
        <div v-for="detail in generateDisplayDetails(dish)" :key="detail">
          {{ detail }}
        </div>
      </div>
    </div>

    <!-- 优先级调整弹窗 -->
    <div v-if="showPriorityModal" @click="closePriorityModal">
      <div @click.stop>
        <button @click="decreaseQuantity">-</button>
        <span>{{ tempQuantity }}</span>
        <button @click="increaseQuantity">+</button>
        
        <button v-for="level in priorityOptions"
                :key="level.value"
                :class="getPriorityButtonClass(level.value, tempPriority === level.value)"
                @click="tempPriority = level.value">
          {{ level.label }}
        </button>
        
        <button @click="confirmPriorityAdjust">确认</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDishManager } from "@/composables/useDishManager";
import { useToast } from "@/composables/useToast";

const props = defineProps({ orders: Array });
const emit = defineEmits(["dish-action"]);
const { showSuccess, showError, showInfo } = useToast();

// 1. 使用 composable（交互逻辑）
const dishManager = useDishManager({
  onStatusChange: (dish, newStatus, newPriority) => {
    console.log('状态变更:', dish.name, newStatus, newPriority);
  },
  onPriorityAdjust: (dish, quantity, priority) => {
    console.log('优先级调整:', dish.name, quantity, priority);
  },
});

// 2. 解构方法
const {
  getPriorityClass,
  truncateDishName,
  handleDishClick: handleDishClickBase,
  showPriorityAdjustModal,
  closePriorityModal,
  decreaseQuantity,
  increaseQuantity,
  confirmPriorityAdjust: confirmPriorityAdjustBase,
  isServedCollapsed,
} = dishManager;

// 3. 包装事件处理
const handleDishClick = async (dish) => {
  await handleDishClickBase(dish, { showSuccess, showError, showInfo }, null, emit);
};

const confirmPriorityAdjust = () => {
  confirmPriorityAdjustBase(emit);
};

// 4. 自己实现数据处理逻辑（merge、extract 等）
const extractDishesFromOrders = (orders) => {
  const result = [];
  orders.forEach(order => {
    order.orderItems.forEach(item => {
      if (item.status !== "cancelled" && order.status !== "done") {
        result.push({
          ...item.dish,
          itemId: item.id,
          status: item.status,
          priority: item.priority,
          // ... 其他字段
        });
      }
    });
  });
  return result;
};

const mergeDishes = (dishes) => {
  const mergedMap = new Map();
  dishes.forEach(dish => {
    const key = `${dish.name}|${dish.status}|${dish.priority}`;
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key);
      existing.totalQuantity += dish.totalQuantity;
      // ... 合并逻辑
    } else {
      mergedMap.set(key, dish);
    }
  });
  return Array.from(mergedMap.values());
};

const generateDisplayDetails = (dish) => {
  const details = [];
  if (dish.countable && dish.perTableGroups) {
    Object.keys(dish.perTableGroups).forEach(perTableCount => {
      const group = dish.perTableGroups[perTableCount];
      details.push(`${perTableCount}个×${group.tableCount}份`);
    });
  }
  if (dish.orderStatus === 'urged' && dish.hallNumber) {
    details.push(`${dish.hallNumber}催菜`);
  }
  if (dish.remark && !dish.remark.includes("正常")) {
    details.push(dish.remark);
  }
  return details;
};

// 5. 计算属性
const pendingDishes = computed(() => {
  const allDishes = extractDishesFromOrders(props.orders);
  const filtered = allDishes.filter(d => d.priority > 0);
  const merged = mergeDishes(filtered);
  return merged.map(d => ({ ...d, displayDetails: generateDisplayDetails(d) }));
});
</script>
```

### OrderView（单订单详情模式）

```vue
<script setup>
import { useDishManager } from "@/composables/useDishManager";

const dishManager = useDishManager({
  onStatusChange: (dish, newStatus, newPriority) => {
    loadOrderDetail(); // 详情页需要重新加载
  },
});

const { handleDishClick: handleDishClickBase } = dishManager;

const handleDishClick = async (dish) => {
  // 添加自定义验证
  if (dish.priority === 0 && dish.status === "ready") {
    showError("还未起菜");
    return;
  }
  await handleDishClickBase(dish, { showSuccess, showError, showInfo }, loadOrderDetail, null);
};
</script>
```

## 职责划分

### ✅ useDishManager 负责（交互逻辑）
- 点击事件处理 → 状态流转
- 长按/右键 → 优先级调整弹窗
- 数量增减
- 已出区域折叠控制
- 优先级样式映射

### ❌ useDishManager 不负责（数据处理）
- ❌ 从订单中提取菜品
- ❌ 合并同名菜品
- ❌ 生成详情信息
- ❌ 瀑布流布局计算

这些由各视图**自行实现**，因为：
1. 不同视图的数据结构可能不同
2. merge 逻辑复杂且易变
3. Details 显示规则因场景而异

## 迁移指南

### 如果你之前用了旧版

```javascript
// 旧版（已废弃）
const dishManager = useDishManager({ enableMerge: true, mode: 'overview' });
const { mergeDishes, extractDishesFromOrders, generateDisplayDetails } = dishManager;

// 新版
const dishManager = useDishManager(); // 不再需要 enableMerge 和 mode

// 自己在视图中实现
const mergeDishes = (dishes) => { /* 你的实现 */ };
const extractDishesFromOrders = (orders) => { /* 你的实现 */ };
const generateDisplayDetails = (dish) => { /* 你的实现 */ };
```

## 优势

### 📦 代码更清晰
- Composable 职责单一：只管交互
- 视图职责明确：数据处理自己掌控

### 🔧 更灵活
- OverviewView 可以用复杂的 merge 逻辑
- OrderView 可以简单直接展示原始数据
- 未来新视图可以自由定制数据处理方式

### 🐛 更容易调试
- 交互问题 → 查 composable
- 数据问题 → 查视图自己的实现
- 职责分离，排查路径清晰

## 完整示例代码

查看项目中的实际实现：
- [`OverviewView.vue`](../frontend/src/views/OverviewView.vue) - 多订单聚合场景
- [`OrderView.vue`](../frontend/src/views/OrderView.vue) - 单订单详情场景
- [`useDishManager.js`](../frontend/src/composables/useDishManager.js) - composable 源码
