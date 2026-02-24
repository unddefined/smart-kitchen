<template>
  <div class="serving-overview">
    <!-- 顶部控制栏 -->
    <div class="control-bar">
      <div class="date-selector">
        <a-date-picker v-model:value="selectedDate" @change="onDateChange" />
        <a-select v-model:value="mealPeriod" @change="onMealPeriodChange" style="width: 120px; margin-left: 10px;">
          <a-select-option value="午餐">午餐</a-select-option>
          <a-select-option value="晚餐">晚餐</a-select-option>
        </a-select>
      </div>
      
      <div class="action-buttons">
        <a-button type="primary" @click="showCreateOrderModal">录入订单</a-button>
        <a-button @click="urgeDish">催菜</a-button>
        <a-button @click="addDish">加菜</a-button>
        <a-button @click="delayDish">暂缓</a-button>
        <a-button @click="cancelDish">退菜</a-button>
      </div>
    </div>

    <!-- 订单列表区域 -->
    <div class="orders-container">
      <!-- 总览卡片 -->
      <div class="overview-section">
        <h3>总览</h3>
        <div class="dish-cards-container">
          <div 
            v-for="dish in mergedDishes" 
            :key="`${dish.name}-${dish.priority}`"
            class="dish-card"
            :class="getCardClass(dish)"
            @click="handleDishClick(dish)"
            @dblclick="openRecipe(dish)"
            @contextmenu.prevent="showDishContextMenu(dish, $event)"
          >
            <div class="dish-name">{{ truncateDishName(dish.name) }}×{{ dish.totalQuantity }}</div>
            <div class="dish-details">
              <div v-for="detail in dish.details" :key="detail.key" class="detail-line">
                {{ detail.text }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 各订单详情 -->
      <div v-for="order in orders" :key="order.orderId" class="order-section">
        <div class="order-header" @click="selectOrder(order)">
          <span class="hall-number">{{ order.hallNumber }}</span>
          <span class="order-info">{{ order.peopleCount }}人 {{ order.tableCount }}桌</span>
          <span class="order-time">{{ formatTime(order.createdAt) }}</span>
        </div>
        
        <div v-if="selectedOrderId === order.orderId" class="order-details">
          <!-- 已出菜品 -->
          <div class="served-section">
            <h4>已出</h4>
            <div class="served-cards">
              <div 
                v-for="item in getServedItems(order)" 
                :key="item.itemId"
                class="served-card"
                @dblclick="openRecipe(item)"
              >
                {{ item.dishName }}
                <span class="served-time">{{ formatTime(item.servedAt) }}</span>
              </div>
            </div>
          </div>

          <!-- 待上菜品 -->
          <div class="pending-section">
            <h4>待上</h4>
            <div class="pending-cards">
              <div 
                v-for="item in getPendingItems(order)" 
                :key="item.itemId"
                class="pending-card"
                :class="getItemClass(item)"
                @click="handleItemClick(item)"
                @dblclick="openRecipe(item)"
              >
                <div class="item-main">{{ item.dishName }}</div>
                <div class="item-quantity">×{{ item.quantity }}</div>
                <div v-if="item.remark" class="item-remark">{{ item.remark }}</div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="order-actions">
            <a-button @click="addRemark">添加备注</a-button>
            <a-button @click="editOrder">编辑订单信息</a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 菜品操作上下文菜单 -->
    <div 
      v-show="contextMenu.visible" 
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div class="menu-item" @click="adjustQuantity">增减数量</div>
      <div class="menu-item" @click="adjustPriority">调整优先级</div>
      <div class="menu-item" @click="markAsReady">标记完成</div>
      <div class="menu-item" @click="serveDish">上菜</div>
    </div>

    <!-- 录入订单模态框 -->
    <a-modal 
      v-model:visible="createOrderVisible" 
      title="录入订单" 
      width="800px"
      @ok="handleCreateOrder"
      @cancel="createOrderVisible = false"
    >
      <OrderEntryForm ref="orderForm" />
    </a-modal>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import OrderEntryForm from '@/components/OrderEntryForm.vue';
import { useServingStore } from '@/stores/serving';

export default {
  name: 'ServingOverview',
  components: {
    OrderEntryForm
  },
  setup() {
    const servingStore = useServingStore();
    const selectedDate = ref(new Date());
    const mealPeriod = ref('午餐');
    const selectedOrderId = ref(null);
    const createOrderVisible = ref(false);
    const contextMenu = ref({
      visible: false,
      x: 0,
      y: 0,
      dish: null
    });

    // 计算属性
    const orders = computed(() => servingStore.orders);
    const mergedDishes = computed(() => {
      // 自动合并同名同优先级的菜品
      const dishMap = new Map();
      
      orders.value.forEach(order => {
        order.items?.forEach(item => {
          if (item.status !== 'served') { // 只处理未出的菜品
            const key = `${item.dishName}-${item.currentPriority}`;
            if (!dishMap.has(key)) {
              dishMap.set(key, {
                name: item.dishName,
                priority: item.currentPriority,
                totalQuantity: 0,
                details: [],
                items: []
              });
            }
            
            const dishGroup = dishMap.get(key);
            dishGroup.totalQuantity += item.quantity;
            dishGroup.items.push(item);
            
            // 收集详细信息
            if (item.weight) {
              dishGroup.details.push({
                key: `weight-${item.itemId}`,
                text: `${item.weight}·${item.quantity}份`
              });
            }
            if (item.remark) {
              dishGroup.details.push({
                key: `remark-${item.itemId}`,
                text: `${item.remark}·${item.quantity}份`
              });
            }
          }
        });
      });

      return Array.from(dishMap.values()).sort((a, b) => {
        // 按优先级降序排列
        return b.priority - a.priority;
      });
    });

    // 方法
    const onDateChange = (date) => {
      selectedDate.value = date;
      loadOrders();
    };

    const onMealPeriodChange = (period) => {
      mealPeriod.value = period;
      loadOrders();
    };

    const loadOrders = async () => {
      try {
        await servingStore.loadOrders({
          date: selectedDate.value,
          mealPeriod: mealPeriod.value
        });
      } catch (error) {
        message.error('加载订单失败: ' + error.message);
      }
    };

    const selectOrder = (order) => {
      selectedOrderId.value = selectedOrderId.value === order.orderId ? null : order.orderId;
    };

    const getServedItems = (order) => {
      return order.items?.filter(item => item.status === 'served') || [];
    };

    const getPendingItems = (order) => {
      return order.items?.filter(item => item.status !== 'served') || [];
    };

    const getCardClass = (dish) => {
      // 根据优先级返回对应的CSS类
      switch (dish.priority) {
        case 3: return 'card-red';    // 红色：催菜
        case 2: return 'card-yellow'; // 黄色：等一下
        case 1: return 'card-green';  // 绿色：不急
        case 0: return 'card-gray';   // 灰色：未起菜
        case -1: return 'card-gray';  // 灰色：已出
        default: return 'card-gray';
      }
    };

    const getItemClass = (item) => {
      // 根据状态和优先级返回对应的CSS类
      if (item.status === 'served') return 'item-served';
      if (item.status === 'pending') return 'item-pending';
      if (item.status === 'prep') {
        switch (item.priority) {
          case 3: return 'item-prep-high';
          case 2: return 'item-prep-medium';
          case 1: return 'item-prep-low';
          default: return 'item-prep';
        }
      }
      if (item.status === 'ready') return 'item-ready';
      return '';
    };

    const truncateDishName = (name) => {
      // 菜品名称超出则省略中间的字，需展示最后一个字
      if (name.length <= 8) return name;
      const start = name.substring(0, 3);
      const end = name.substring(name.length - 3);
      return `${start}...${end}`;
    };

    const handleDishClick = (dish) => {
      // 点击卡片出菜或完成切配与处理
      console.log('处理菜品:', dish.name);
    };

    const openRecipe = (item) => {
      // 双击打开菜谱
      message.info(`打开菜谱: ${item.dishName}`);
    };

    const showDishContextMenu = (dish, event) => {
      contextMenu.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        dish: dish
      };
    };

    const hideContextMenu = () => {
      contextMenu.value.visible = false;
    };

    const adjustQuantity = () => {
      // 调整数量逻辑
      message.info('调整数量功能');
      hideContextMenu();
    };

    const adjustPriority = () => {
      // 调整优先级逻辑
      message.info('调整优先级功能');
      hideContextMenu();
    };

    const markAsReady = async () => {
      try {
        await servingStore.completePreparation(contextMenu.value.dish.items[0].itemId);
        message.success('标记完成成功');
        await loadOrders();
      } catch (error) {
        message.error('标记完成失败: ' + error.message);
      }
      hideContextMenu();
    };

    const serveDish = async () => {
      try {
        await servingStore.serveDish(contextMenu.value.dish.items[0].itemId);
        message.success('上菜成功');
        await loadOrders();
      } catch (error) {
        message.error('上菜失败: ' + error.message);
      }
      hideContextMenu();
    };

    const showCreateOrderModal = () => {
      createOrderVisible.value = true;
    };

    const handleCreateOrder = () => {
      // 处理订单创建
      message.success('订单创建成功');
      createOrderVisible.value = false;
      loadOrders();
    };

    const urgeDish = () => {
      message.info('催菜功能');
    };

    const addDish = () => {
      message.info('加菜功能');
    };

    const delayDish = () => {
      message.info('暂缓功能');
    };

    const cancelDish = () => {
      message.info('退菜功能');
    };

    const addRemark = () => {
      message.info('添加备注功能');
    };

    const editOrder = () => {
      message.info('编辑订单信息功能');
    };

    const formatTime = (timeString) => {
      if (!timeString) return '';
      const date = new Date(timeString);
      return date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    };

    const handleClickOutside = (event) => {
      if (contextMenu.value.visible) {
        const contextMenuEl = document.querySelector('.context-menu');
        if (contextMenuEl && !contextMenuEl.contains(event.target)) {
          hideContextMenu();
        }
      }
    };

    // 生命周期
    onMounted(() => {
      loadOrders();
      document.addEventListener('click', handleClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    return {
      selectedDate,
      mealPeriod,
      selectedOrderId,
      createOrderVisible,
      contextMenu,
      orders,
      mergedDishes,
      onDateChange,
      onMealPeriodChange,
      selectOrder,
      getServedItems,
      getPendingItems,
      getCardClass,
      getItemClass,
      truncateDishName,
      handleDishClick,
      openRecipe,
      showDishContextMenu,
      adjustQuantity,
      adjustPriority,
      markAsReady,
      serveDish,
      showCreateOrderModal,
      handleCreateOrder,
      urgeDish,
      addDish,
      delayDish,
      cancelDish,
      addRemark,
      editOrder,
      formatTime
    };
  }
};
</script>

<style scoped>
.serving-overview {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.control-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.action-buttons {
  display: flex;
  gap: 10px;
}

.orders-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.overview-section h3 {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: bold;
}

.dish-cards-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.dish-card {
  padding: 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.dish-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.card-red {
  background: #ff4d4f;
  color: white;
}

.card-yellow {
  background: #faad14;
  color: white;
}

.card-green {
  background: #52c41a;
  color: white;
}

.card-gray {
  background: #d9d9d9;
  color: #666;
}

.dish-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 8px;
  text-align: center;
}

.dish-details {
  font-size: 14px;
  text-align: center;
}

.detail-line {
  margin: 2px 0;
}

.order-section {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.order-header {
  padding: 15px;
  background: #fafafa;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hall-number {
  font-size: 18px;
  font-weight: bold;
  color: #1890ff;
}

.order-info {
  color: #666;
}

.order-time {
  color: #999;
  font-size: 14px;
}

.order-details {
  padding: 20px;
}

.served-section, .pending-section {
  margin-bottom: 20px;
}

.served-section h4, .pending-section h4 {
  margin-bottom: 10px;
  color: #333;
}

.served-cards, .pending-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.served-card {
  padding: 10px 15px;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 14px;
  position: relative;
  cursor: pointer;
}

.served-time {
  position: absolute;
  right: 5px;
  bottom: 2px;
  font-size: 12px;
  color: #999;
}

.pending-card {
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 120px;
  position: relative;
}

.pending-card:hover {
  transform: scale(1.05);
}

.item-served {
  background: #f0f0f0;
  color: #999;
}

.item-pending {
  background: #d9d9d9;
  color: #666;
}

.item-prep-high {
  background: #ff4d4f;
  color: white;
}

.item-prep-medium {
  background: #faad14;
  color: white;
}

.item-prep-low {
  background: #52c41a;
  color: white;
}

.item-ready {
  background: #1890ff;
  color: white;
}

.item-main {
  font-weight: bold;
  margin-bottom: 4px;
}

.item-quantity {
  font-size: 12px;
  opacity: 0.8;
}

.item-remark {
  font-size: 12px;
  color: #ff4d4f;
  margin-top: 4px;
}

.order-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  z-index: 1000;
}

.menu-item {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
}

.menu-item:hover {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .dish-cards-container {
    grid-template-columns: 1fr;
  }
  
  .control-bar {
    flex-direction: column;
    gap: 10px;
  }
  
  .action-buttons {
    width: 100%;
    justify-content: center;
  }
}
</style>