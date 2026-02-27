// API服务使用示例

// 1. 在Vue组件中使用API服务的基本示例

/*
<script setup>
import { ref, onMounted } from 'vue'
import { OrderService, DishService, ServingService, PRIORITY_LEVELS } from '@/services'

// 响应式数据
const orders = ref([])
const dishes = ref([])
const pendingItems = ref([])
const loading = ref(false)

// 获取订单列表
const loadOrders = async () => {
  loading.value = true
  try {
    orders.value = await OrderService.getOrders({ status: 'created' })
  } catch (error) {
    console.error('加载订单失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取菜品列表
const loadDishes = async () => {
  try {
    dishes.value = await DishService.getAllDishes()
  } catch (error) {
    console.error('加载菜品失败:', error)
  }
}

// 获取待处理菜品
const loadPendingItems = async () => {
  try {
    pendingItems.value = await ServingService.getPendingItems()
  } catch (error) {
    console.error('加载待处理菜品失败:', error)
  }
}

// 创建新订单
const createNewOrder = async (orderData) => {
  const result = await OrderService.createOrder(orderData)
  if (result.success) {
    console.log('订单创建成功:', result.data)
    // 重新加载订单列表
    await loadOrders()
  } else {
    console.error('订单创建失败:', result.message)
  }
}

// 添加菜品到订单
const addDishToOrder = async (orderId, dishData) => {
  const result = await OrderService.addDishToOrder(orderId, dishData)
  if (result.success) {
    console.log('菜品添加成功:', result.data)
  } else {
    console.error('菜品添加失败:', result.message)
  }
}

// 催菜操作
const urgeDish = async (itemId) => {
  const result = await ServingService.urgeDish(itemId, '客户要求加快')
  if (result.success) {
    console.log('催菜成功')
    // 重新加载待处理菜品
    await loadPendingItems()
  } else {
    console.error('催菜失败:', result.message)
  }
}

// 标记已出菜
const markAsServed = async (itemId) => {
  const result = await ServingService.markAsServed(itemId)
  if (result.success) {
    console.log('标记已出菜成功')
    // 重新加载相关数据
    await Promise.all([loadPendingItems(), loadOrders()])
  } else {
    console.error('标记失败:', result.message)
  }
}

// 组件挂载时加载数据
onMounted(async () => {
  await Promise.all([
    loadOrders(),
    loadDishes(),
    loadPendingItems()
  ])
})
</script>
*/

// 2. 在Store中使用API服务的示例

/*
// stores/kitchen.js
import { defineStore } from 'pinia'
import { OrderService, DishService, ServingService } from '@/services'

export const useKitchenStore = defineStore('kitchen', {
  state: () => ({
    orders: [],
    dishes: [],
    pendingItems: [],
    servedItems: [],
    loading: false
  }),

  getters: {
    // 获取催菜订单
    urgentOrders: (state) => {
      return state.pendingItems.filter(item => item.priority === 3)
    },
    
    // 按工位分组的待处理菜品
    pendingItemsByStation: (state) => {
      return state.pendingItems.reduce((groups, item) => {
        const station = item.dish?.station?.name || '未知工位'
        if (!groups[station]) {
          groups[station] = []
        }
        groups[station].push(item)
        return groups
      }, {})
    }
  },

  actions: {
    // 加载所有厨房数据
    async loadKitchenData() {
      this.loading = true
      try {
        const [orders, dishes, pendingItems, servedItems] = await Promise.all([
          OrderService.getOrders(),
          DishService.getAllDishes(),
          ServingService.getPendingItems(),
          ServingService.getServedItems()
        ])
        
        this.orders = orders
        this.dishes = dishes
        this.pendingItems = pendingItems
        this.servedItems = servedItems
      } catch (error) {
        console.error('加载厨房数据失败:', error)
      } finally {
        this.loading = false
      }
    },

    // 处理订单状态变更
    async updateOrderStatus(orderId, status) {
      const result = await OrderService.updateOrderStatus(orderId, status)
      if (result.success) {
        // 更新本地状态
        const order = this.orders.find(o => o.id === orderId)
        if (order) {
          order.status = status
        }
      }
      return result
    },

    // 处理菜品优先级调整
    async adjustDishPriority(itemId, priority, reason) {
      let result
      switch (priority) {
        case 3: // 催菜
          result = await ServingService.urgeDish(itemId, reason)
          break
        case 2: // 暂缓
          result = await ServingService.delayDish(itemId, reason)
          break
        default:
          result = { success: false, message: '不支持的优先级' }
      }
      
      if (result.success) {
        // 更新本地状态
        const item = this.pendingItems.find(i => i.id === itemId)
        if (item) {
          item.priority = priority
        }
      }
      
      return result
    }
  }
})
*/

// 3. 工具函数示例

// 格式化显示优先级
export const formatPriority = (priority) => {
  const priorityMap = {
    3: { label: "催菜", color: "red", class: "priority-urgent" },
    2: { label: "等一下", color: "yellow", class: "priority-wait" },
    1: { label: "不急", color: "green", class: "priority-normal" },
    0: { label: "未起菜", color: "gray", class: "priority-pending" },
    "-1": { label: "已出", color: "gray", class: "priority-served" },
  };

  return (
    priorityMap[priority] || {
      label: "未知",
      color: "gray",
      class: "priority-unknown",
    }
  );
};

// 计算预计完成时间
export const estimateCompletionTime = (items, preparationTimePerItem = 300) => {
  // 简单的时间估算逻辑
  const urgentItems = items.filter((item) => item.priority === 3).length;
  const normalItems = items.filter((item) => item.priority <= 2).length;

  // 紧急菜品优先处理
  const totalTime =
    urgentItems * preparationTimePerItem * 0.8 +
    normalItems * preparationTimePerItem;

  return Math.ceil(totalTime / 60); // 返回分钟数
};

// 验证数据完整性的工具函数
export const validateKitchenData = (data) => {
  const errors = [];

  if (!data.orders || !Array.isArray(data.orders)) {
    errors.push("订单数据格式错误");
  }

  if (!data.dishes || !Array.isArray(data.dishes)) {
    errors.push("菜品数据格式错误");
  }

  if (!data.pendingItems || !Array.isArray(data.pendingItems)) {
    errors.push("待处理菜品数据格式错误");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
