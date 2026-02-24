<template>
  <div class="order-container">
    <div class="order-header">
      <button class="back-button" @click="$emit('back')">
        ← 返回
      </button>
      <h2 class="order-title">订单详情</h2>
    </div>
    
    <div class="order-content">
      <!-- 订单信息表格 -->
      <div class="order-info-section">
        <h3 class="section-subtitle">订单信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">人数:</span>
            <span class="value">{{ order.peopleCount }}</span>
          </div>
          <div class="info-item">
            <span class="label">桌数:</span>
            <span class="value">{{ order.tableCount }}</span>
          </div>
          <div class="info-item">
            <span class="label">厅号:</span>
            <span class="value">{{ order.hallNumber }}</span>
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
              <span class="dish-quantity">×</span>
              <span class="dish-quantity">{{ dish.quantity }}</span>
            </div>
            <div class="dish-status">
              已出
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
            :class="['dish-item', `priority-${dish.priority}`]"
            @click="handleDishClick(dish)"
          >
            <div class="dish-info">
              <span class="dish-name">{{ dish.name }}</span>
              <span class="dish-quantity">×</span>
              <span class="dish-quantity">{{ dish.quantity }}</span>
            </div>
            <div class="dish-actions">
              <button 
                v-if="dish.status === 'pending'"
                class="action-btn start"
                @click.stop="startDish(dish)"
              >
                起菜
              </button>
              <button 
                v-else-if="dish.status === 'prep'"
                class="action-btn finish"
                @click.stop="finishDish(dish)"
              >
                完成
              </button>
              <button 
                v-else-if="dish.status === 'ready'"
                class="action-btn serve"
                @click.stop="serveDish(dish)"
              >
                上菜
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button class="secondary-btn" @click="addRemark">
          添加备注
        </button>
        <button class="secondary-btn" @click="editOrder">
          编辑订单信息
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Props
const props = defineProps({
  orderId: {
    type: [String, Number],
    required: true
  }
})

// Emits
const emit = defineEmits(['back'])

// 模拟订单数据
const order = ref({
  id: props.orderId,
  peopleCount: 4,
  tableCount: 1,
  hallNumber: 'A01',
  startTime: '18:30',
  lastInterval: 180
})

const servedDishes = ref([
  {
    id: 1,
    name: '糖醋里脊',
    quantity: 1,
    status: 'served'
  }
])

const pendingDishes = ref([
  {
    id: 2,
    name: '宫保鸡丁',
    quantity: 2,
    status: 'pending',
    priority: 3
  },
  {
    id: 3,
    name: '麻婆豆腐',
    quantity: 1,
    status: 'prep',
    priority: 2
  },
  {
    id: 4,
    name: '水煮鱼',
    quantity: 1,
    status: 'ready',
    priority: 1
  }
])

// 方法
const handleDishClick = (dish) => {
  console.log('点击菜品:', dish)
}

const startDish = (dish) => {
  dish.status = 'prep'
  console.log('起菜:', dish.name)
}

const finishDish = (dish) => {
  dish.status = 'ready'
  console.log('完成:', dish.name)
}

const serveDish = (dish) => {
  dish.status = 'served'
  // 移动到已出菜品列表
  const index = pendingDishes.value.findIndex(d => d.id === dish.id)
  if (index > -1) {
    const servedDish = pendingDishes.value.splice(index, 1)[0]
    servedDishes.value.push(servedDish)
  }
  console.log('上菜:', dish.name)
}

const addRemark = () => {
  console.log('添加备注')
}

const editOrder = () => {
  console.log('编辑订单信息')
}
</script>

<style scoped>
.order-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.order-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.back-button {
  background: none;
  border: none;
  font-size: 16px;
  color: #3B82F6;
  cursor: pointer;
  padding: 8px 12px;
  margin-right: 12px;
}

.order-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #333;
  flex: 1;
  text-align: center;
}

.order-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
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
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.served-section, .pending-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.dish-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dish-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.dish-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.dish-item.priority-3 {
  border-color: #EF4444;
  background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%);
}

.dish-item.priority-2 {
  border-color: #F59E0B;
  background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%);
}

.dish-item.priority-1 {
  border-color: #10B981;
  background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%);
}

.dish-info {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.dish-name {
  margin-right: 8px;
}

.dish-quantity {
  font-weight: 600;
}

.dish-status {
  font-size: 14px;
  color: #666;
  padding: 4px 12px;
  border-radius: 16px;
  background: #f0f0f0;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.secondary-btn {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.secondary-btn:hover {
  background: #f5f5f5;
  border-color: #999;
}

.action-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.action-btn.start {
  background: #3B82F6;
  color: white;
}

.action-btn.finish {
  background: #8B5CF6;
  color: white;
}

.action-btn.serve {
  background: #10B981;
  color: white;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>