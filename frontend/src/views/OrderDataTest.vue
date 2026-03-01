<template>
  <div class="order-test-container">
    <div class="test-header">
      <h1>订单数据获取测试</h1>
      <div class="test-controls">
        <button @click="testLoadOrders" :disabled="loading" class="test-btn">
          {{ loading ? '加载中...' : '加载订单数据' }}
        </button>
        <button @click="testCreateOrder" :disabled="loading" class="test-btn secondary">
          创建测试订单
        </button>
      </div>
    </div>

    <!-- 错误显示 -->
    <div v-if="error" class="error-banner">
      <strong>错误:</strong> {{ error }}
    </div>

    <!-- 订单统计 -->
    <div v-if="orders.length > 0" class="stats-section">
      <h2>订单统计</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ orders.length }}</div>
          <div class="stat-label">总订单数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">待处理</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ servingCount }}</div>
          <div class="stat-label">制作中</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ doneCount }}</div>
          <div class="stat-label">已完成</div>
        </div>
      </div>
    </div>

    <!-- 订单列表 -->
    <div class="orders-section">
      <h2>订单列表</h2>
      <div v-if="orders.length === 0" class="empty-state">
        <p>暂无订单数据</p>
      </div>
      
      <div v-else class="orders-list">
        <div 
          v-for="order in orders" 
          :key="order.id" 
          class="order-card"
          :class="`status-${order.status}`"
        >
          <div class="order-header">
            <h3>台号: {{ order.hallNumber }}</h3>
            <span class="order-status">{{ getStatusText(order.status) }}</span>
          </div>
          
          <div class="order-details">
            <div class="detail-row">
              <span class="label">人数:</span>
              <span class="value">{{ order.peopleCount }}</span>
            </div>
            <div class="detail-row">
              <span class="label">桌数:</span>
              <span class="value">{{ order.tableCount }}</span>
            </div>
            <div class="detail-row">
              <span class="label">创建时间:</span>
              <span class="value">{{ formatDate(order.createdAt) }}</span>
            </div>
            <div v-if="order.mealTime" class="detail-row">
              <span class="label">用餐时间:</span>
              <span class="value">{{ order.mealTime }}</span>
            </div>
          </div>

          <!-- 菜品信息 -->
          <div v-if="order.items && order.items.length > 0" class="order-items">
            <h4>菜品列表:</h4>
            <div class="items-list">
              <div 
                v-for="item in order.items" 
                :key="item.id"
                class="item-row"
              >
                <span class="item-name">{{ item.dish?.name || '未知菜品' }}</span>
                <span class="item-quantity">×{{ item.quantity }}</span>
                <span class="item-status">{{ getItemStatusText(item.status) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- API响应详情 -->
    <div class="debug-section">
      <h2>API响应详情</h2>
      <pre class="response-json">{{ JSON.stringify(orders, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { OrderService } from '@/services';

const orders = ref([]);
const loading = ref(false);
const error = ref(null);

// 计算属性
const pendingCount = computed(() => {
  return orders.value.filter(order => order.status === 'created').length;
});

const servingCount = computed(() => {
  return orders.value.filter(order => order.status === 'serving').length;
});

const doneCount = computed(() => {
  return orders.value.filter(order => order.status === 'done').length;
});

// 方法
const testLoadOrders = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    console.log('开始加载订单数据...');
    const orderList = await OrderService.getOrders();
    console.log('获取到的订单数据:', orderList);
    
    orders.value = orderList;
  } catch (err) {
    console.error('加载订单失败:', err);
    error.value = err.message || '加载订单数据失败';
  } finally {
    loading.value = false;
  }
};

const testCreateOrder = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const testData = {
      hallNumber: `TEST${Math.floor(Math.random() * 100)}`,
      peopleCount: Math.floor(Math.random() * 8) + 1,
      tableCount: 1,
      mealTime: new Date().toISOString()
    };
    
    console.log('创建测试订单:', testData);
    const result = await OrderService.createOrder(testData);
    console.log('创建结果:', result);
    
    if (result.success) {
      // 创建成功后重新加载订单列表
      await testLoadOrders();
    } else {
      error.value = result.message;
    }
  } catch (err) {
    console.error('创建订单失败:', err);
    error.value = err.message || '创建订单失败';
  } finally {
    loading.value = false;
  }
};

const getStatusText = (status) => {
  const statusMap = {
    'created': '已创建',
    'started': '已起菜',
    'serving': '制作中',
    'done': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

const getItemStatusText = (status) => {
  const statusMap = {
    'pending': '待制作',
    'preparing': '制作中',
    'ready': '已备好',
    'served': '已上菜'
  };
  return statusMap[status] || status;
};

const formatDate = (dateString) => {
  if (!dateString) return '未知';
  return new Date(dateString).toLocaleString('zh-CN');
};

// 组件挂载时自动加载数据
testLoadOrders();
</script>

<style scoped>
.order-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}

.test-header h1 {
  margin: 0;
  color: #333;
}

.test-controls {
  display: flex;
  gap: 12px;
}

.test-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.test-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.test-btn.secondary {
  background: #6b7280;
}

.test-btn.secondary:hover:not(:disabled) {
  background: #4b5563;
}

.error-banner {
  background: #fee2e2;
  color: #dc2626;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid #fecaca;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-section h2 {
  margin: 0 0 16px 0;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #3b82f6;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 16px;
  color: #666;
}

.orders-section h2 {
  margin: 0 0 16px 0;
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  margin: 0;
  color: #666;
  font-size: 18px;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e0e0e0;
}

.order-card.status-created {
  border-left-color: #3b82f6;
}

.order-card.status-started {
  border-left-color: #f59e0b;
}

.order-card.status-serving {
  border-left-color: #10b981;
}

.order-card.status-done {
  border-left-color: #8b5cf6;
}

.order-card.status-cancelled {
  border-left-color: #ef4444;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.order-header h3 {
  margin: 0;
  color: #333;
}

.order-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: #f3f4f6;
  color: #374151;
}

.order-details {
  margin-bottom: 16px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
}

.order-items {
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
}

.order-items h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.item-name {
  font-weight: 500;
  color: #333;
}

.item-quantity {
  color: #666;
}

.item-status {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  background: #e5e7eb;
  color: #374151;
}

.debug-section {
  margin-top: 32px;
}

.debug-section h2 {
  margin: 0 0 16px 0;
  color: #333;
}

.response-json {
  background: #1f2937;
  color: #f9fafb;
  padding: 20px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  max-height: 400px;
  overflow-y: auto;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .test-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .test-controls {
    justify-content: center;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .order-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>