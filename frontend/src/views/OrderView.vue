<template>
  <div class="order-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>正在加载订单详情...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button @click="loadOrderDetail" class="retry-btn">重新加载</button>
    </div>

    <!-- 订单详情内容 -->
    <div v-else-if="orderDetail" class="order-content">
      <!-- 订单信息表格 -->
      <div class="order-info-section">
        <h3 class="section-subtitle">订单信息</h3>
        <div class="info-grid">
          <!-- 将人数和桌数放在同一行 -->
          <div class="info-row">
            <div class="info-item">
              <span class="label">人数:</span>
              <span class="value">{{ orderDetail.peopleCount }}</span>
            </div>
            <div class="info-item">
              <span class="label">桌数:</span>
              <span class="value">{{ orderDetail.tableCount }}</span>
            </div>
          </div>
          <div class="info-item">
            <span class="label">台号:</span>
            <span class="value">{{ orderDetail.hallNumber }}</span>
          </div>
          <div class="info-item">
            <span class="label">状态:</span>
            <span class="value">{{ getOrderStatusText(orderDetail.status) }}</span>
          </div>
          <div class="info-item">
            <span class="label">创建时间:</span>
            <span class="value">{{ formatDate(orderDetail.createdAt) }}</span>
          </div>
          <div v-if="orderDetail.mealTime" class="info-item">
            <span class="label">用餐时间:</span>
            <span class="value">{{ orderDetail.mealTime }}</span>
          </div>
          <div v-if="orderDetail.remark" class="info-item">
            <span class="label">备注:</span>
            <span class="value">{{ orderDetail.remark }}</span>
          </div>
          <div v-if="orderDetail.startTime" class="info-item">
            <span class="label">起菜时间:</span>
            <span class="value">{{ orderDetail.startTime }}</span>
          </div>
        </div>
      </div>

      <!-- 已出菜品 -->
      <div class="served-section">
        <h3 class="section-subtitle">已出菜品</h3>
        <div class="dish-list">
          <div v-for="dish in servedDishes" :key="dish.id" class="dish-item served">
            <div class="dish-info">
              <span class="dish-name">{{ dish.dish?.name || "未知菜品" }}</span>
              <span class="dish-quantity">×{{ dish.quantity }}</span>
            </div>
            <div v-if="dish.remark" class="dish-remark">
              {{ dish.remark }}
            </div>
          </div>
        </div>
      </div>

      <!-- 待上菜品 -->
      <div class="pending-section">
        <h3 class="section-subtitle">待上菜品</h3>
        <div class="dish-list">
          <div v-for="dish in pendingDishes" :key="dish.id" :class="['dish-item', `priority-${dish.priority || 0}`]" @click="handleDishClick(dish)">
            <div class="dish-info">
              <span class="text-xl">
                <span>{{ dish.dish?.name || "未知菜品" }}</span> <span class="">×{{ dish.quantity }}</span>
              </span>
              <span class="dish-status">{{ getOrderItemStatusText(dish.status) }}</span>
            </div>
            <div v-if="dish.remark" class="dish-remark">
              {{ dish.remark }}
            </div>
            <div class="dish-meta"></div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="secondary-btn" @click="addRemark">添加备注</button>
        <button class="secondary-btn" @click="editOrder">编辑订单信息</button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📋</div>
      <p>未找到订单详情</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { OrderService } from "@/services";

// Props
const props = defineProps({
  orderId: {
    type: [String, Number],
    required: true,
  },
});

// Emits
const emit = defineEmits(["back"]);

// 响应式数据
const orderDetail = ref(null);
const loading = ref(false);
const error = ref(null);

// 计算属性
const servedDishes = computed(() => {
  if (!orderDetail.value?.items) return [];
  return orderDetail.value.items.filter((item) => item.status === "served");
});

const pendingDishes = computed(() => {
  if (!orderDetail.value?.items) return [];
  return orderDetail.value.items.filter((item) => item.status !== "served");
});

const orderStats = computed(() => {
  if (!orderDetail.value?.items) return null;
  return OrderService.calculateOrderStats(orderDetail.value.items);
});

// 方法
const loadOrderDetail = async () => {
  try {
    loading.value = true;
    error.value = null;

    // 确保orderId是数字类型
    const orderId = parseInt(props.orderId);
    if (isNaN(orderId)) {
      throw new Error("无效的订单ID");
    }

    const detail = await OrderService.getOrderDetail(orderId);
    if (detail) {
      orderDetail.value = detail;
    } else {
      error.value = "未找到该订单";
    }
  } catch (err) {
    console.error("加载订单详情失败:", err);
    error.value = "加载订单详情失败: " + (err.message || "未知错误");
  } finally {
    loading.value = false;
  }
};

const handleDishClick = (dish) => {
  console.log("点击菜品:", dish);
  // 可以在这里添加菜品操作逻辑
};

const addRemark = () => {
  console.log("添加备注");
  // 实现添加备注功能
};

const editOrder = () => {
  console.log("编辑订单信息");
  // 实现编辑订单功能
};

const getOrderStatusText = (status) => {
  return OrderService.getOrderStatusText(status);
};

const getOrderItemStatusText = (status) => {
  return OrderService.getOrderItemStatusText(status);
};

const formatDate = (dateString) => {
  if (!dateString) return "未知";
  return new Date(dateString).toLocaleString("zh-CN");
};

// 监听orderId变化，重新加载数据
watch(
  () => props.orderId,
  (newId) => {
    if (newId) {
      loadOrderDetail();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.order-container {
  height: 100%;
  background: #f8f9fa;
  padding: 12px;
  overflow-y: auto;
}

/* 加载状态样式 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-state p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

/* 错误状态样式 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-state p {
  margin: 0 0 20px 0;
  color: #666;
  font-size: 16px;
}

.retry-btn {
  padding: 12px 24px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px;
  text-align: center;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  margin: 0;
  color: #666;
  font-size: 18px;
}

.order-content {
  height: 100%;
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
  padding: 16px;
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

/* 统计部分样式 */
.stats-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.stat-card {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #3b82f6;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.served-section,
.pending-section {
  background: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dish-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dish-item {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #ddd;
  transition: all 0.2s;
  cursor: pointer;
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

.dish-item.priority-0,
.dish-item.priority--1 {
  border-color: #9ca3af;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.dish-info {
  display: flex;
  justify-content: space-between;
  font-weight: 500;
  color: #333;
}

.dish-remark {
  font-size: 18px;
  color: #666;
  margin-top: 8px;
  padding: 4px 8px;
  background: #f1f5f9;
  border-radius: 4px;
}

.dish-status {
  background: #e5e7eb;
  padding: 2px 8px;
  border-radius: 12px;
}

.dish-priority {
  color: #3b82f6;
  font-weight: 500;
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
  display: flex;
  flex: 1;
  justify-content: center;
  white-space: nowrap;
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
