<template>
  <div class="order-container">
    <div class="order-content">
      <!-- 订单信息表格 -->
      <div class="order-info-section">
        <h3 class="section-subtitle">订单信息</h3>
        <div class="info-grid">
          <!-- 将人数和桌数放在同一行 -->
          <div class="info-row">
            <div class="info-item">
              <span class="label">人数:</span>
              <span class="value">{{ order.peopleCount }}</span>
            </div>
            <div class="info-item">
              <span class="label">桌数:</span>
              <span class="value">{{ order.tableCount }}</span>
            </div>
          </div>
          <div class="info-item">
            <span class="label">厅号:</span>
            <span class="value">{{ order.hallNumber }}</span>
          </div>
          <div class="info-item">
            <span class="label">备注:</span>
            <span class="value">{{ order.remark }}</span>
          </div>
          <div class="info-item">
            <span class="label">起菜时间:</span>
            <span class="value">{{ order.startTime }}</span>
          </div>
          <div class="info-item">
            <span class="label">上一道菜间隔:</span>
            <span class="value">{{ order.lastInterval }}秒</span>
          </div>
        </div>
      </div>

      <!-- 已出菜品 -->
      <div class="served-section">
        <h3 class="section-subtitle">已出菜品</h3>
        <div class="dish-list">
          <div
            v-for="dish in servedDishes"
            :key="dish.id"
            class="dish-item served"
          >
            <div class="dish-info">
              <span class="dish-name">{{ dish.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 待上菜品 -->
      <div class="pending-section">
        <h3 class="section-subtitle">待上菜品</h3>
        <div class="dish-list">
          <div
            v-for="dish in pendingDishes"
            :key="dish.id"
            :class="['dish-item']"
            @click="handleDishClick(dish)"
          >
            <div class="dish-info">
              <span class="dish-name">{{ dish.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="secondary-btn" @click="addRemark">添加备注</button>
        <button class="secondary-btn" @click="editOrder">编辑订单信息</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

// Props
const props = defineProps({
  orderId: {
    type: [String, Number],
    required: true,
  },
});

// Emits
const emit = defineEmits(["back"]);

// 模拟订单数据
const order = ref({
  id: props.orderId,
  peopleCount: 4,
  tableCount: 1,
  hallNumber: "A01",
  startTime: "18:30",
  lastInterval: 180,
});

const servedDishes = ref([
  {
    id: 1,
    name: "糖醋里脊",
    quantity: 1,
    status: "served",
  },
]);

const pendingDishes = ref([
  {
    id: 2,
    name: "宫保鸡丁",
    quantity: 2,
    status: "pending",
    priority: 3,
  },
  {
    id: 3,
    name: "麻婆豆腐",
    quantity: 1,
    status: "prep",
    priority: 2,
  },
  {
    id: 4,
    name: "水煮鱼",
    quantity: 1,
    status: "ready",
    priority: 1,
  },
]);

// 方法
const handleDishClick = (dish) => {
  console.log("点击菜品:", dish);
};

const startDish = (dish) => {
  dish.status = "prep";
  console.log("起菜:", dish.name);
};

const finishDish = (dish) => {
  dish.status = "ready";
  console.log("完成:", dish.name);
};

const serveDish = (dish) => {
  dish.status = "served";
  // 移动到已出菜品列表
  const index = pendingDishes.value.findIndex((d) => d.id === dish.id);
  if (index > -1) {
    const servedDish = pendingDishes.value.splice(index, 1)[0];
    servedDishes.value.push(servedDish);
  }
  console.log("上菜:", dish.name);
};

const addRemark = () => {
  console.log("添加备注");
};

const editOrder = () => {
  console.log("编辑订单信息");
};
</script>

<style scoped>
.order-container {
  height: 100%;
  background: #f8f9fa;
}

.order-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.order-content {
  padding: 12px;
}

.section-subtitle {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin: 0 0 16px 0;
}

.order-info-section {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-row {
  display: flex;
  gap: 16px;
  width: 100%;
}

.info-row .info-item {
  flex: 1;
  min-width: 0;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.label {
  color: #666;
  font-size: 16px;
}

.value {
  color: #333;
  font-weight: 500;
  font-size: 16px;
}

.served-section,
.pending-section {
  background: white;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dish-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid #ddd;
  transition: all 0.2s;
}

.dish-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dish-item.priority-3 {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.dish-item.priority-2 {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
}

.dish-item.priority-1 {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
}

.dish-info {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

.dish-name {
  margin-right: 8px;
}

.dish-quantity {
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: space-between;
  width: 100%;
}

.secondary-btn {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex 0 1 auto;
  white-space: nowrap;
  flex-grow: 1;
  letter-spacing: 1px;
  min-width: fit-content;
}

.secondary-btn:hover {
  background: #f5f5f5;
  border-color: #999;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
