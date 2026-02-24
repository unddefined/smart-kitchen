<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
    <div class="bg-white w-full rounded-t-2xl max-h-[90vh] flex flex-col">
      <!-- 头部 -->
      <div class="p-4 border-b flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">{{ mode === 'add' ? '加菜' : '退菜' }}</h2>
        <button 
          @click="closeModal"
          class="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- 台号选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">选择台号</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="order in orders"
              :key="order.id"
              @click="selectOrder(order)"
              :class="[
                'p-3 rounded-lg border-2 text-sm font-medium transition-all',
                selectedOrder?.id === order.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              ]"
            >
              {{ order.hallNumber }}
            </button>
          </div>
        </div>

        <!-- 已选订单信息 -->
        <div v-if="selectedOrder" class="bg-blue-50 rounded-lg p-4">
          <h3 class="font-medium text-blue-900 mb-2">当前订单信息</h3>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span class="text-gray-600">桌号:</span>
              <span class="ml-2 font-medium">{{ selectedOrder.tableNumber }}</span>
            </div>
            <div>
              <span class="text-gray-600">人数:</span>
              <span class="ml-2 font-medium">{{ selectedOrder.peopleCount }}人</span>
            </div>
            <div>
              <span class="text-gray-600">创建时间:</span>
              <span class="ml-2 font-medium">{{ formatDate(selectedOrder.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- 菜品选择区域 -->
        <div v-if="selectedOrder">
          <div class="flex items-center justify-between mb-3">
            <label class="block text-sm font-medium text-gray-700">菜品选择</label>
            <button 
              @click="showAddNewDish = true"
              class="text-blue-500 hover:text-blue-700 text-sm font-medium"
            >
              + 新增菜品
            </button>
          </div>
          
          <!-- 菜品按钮网格（按订单中的菜品排序） -->
          <div class="space-y-3">
            <!-- 已点菜品 -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-2">已点菜品</h4>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="dish in orderedDishes"
                  :key="`ordered-${dish.id}`"
                  @click="toggleOrderedDish(dish)"
                  :class="[
                    'p-3 rounded-lg border-2 text-sm font-medium transition-all relative',
                    isOrderedSelected(dish.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  ]"
                >
                  {{ dish.name }}
                  <span v-if="isOrderedSelected(dish.id)" class="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {{ getOrderedDishQuantity(dish.id) }}
                  </span>
                </button>
              </div>
            </div>

            <!-- 菜品库 -->
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-2">菜品库</h4>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="dish in availableDishes"
                  :key="`available-${dish.id}`"
                  @click="toggleAvailableDish(dish)"
                  :class="[
                    'p-3 rounded-lg border-2 text-sm font-medium transition-all relative',
                    isAvailableSelected(dish.id)
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  ]"
                >
                  {{ dish.name }}
                  <span v-if="isAvailableSelected(dish.id)" class="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                    {{ getAvailableDishQuantity(dish.id) }}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部按钮区域 -->
      <div class="p-4 border-t bg-gray-50">
        <div class="flex space-x-3">
          <button 
            @click="cancel"
            class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button 
            @click="submit"
            :disabled="!canSubmit"
            :class="[
              'flex-1 py-3 rounded-lg font-medium transition-colors',
              canSubmit
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            ]"
          >
            确认{{ mode === 'add' ? '加菜' : '退菜' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 新增菜品弹窗 -->
  <div v-if="showAddNewDish" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-xl w-full max-w-md">
      <div class="p-4 border-b">
        <h3 class="text-lg font-bold text-gray-900">新增菜品</h3>
      </div>
      
      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">菜品名称 *</label>
          <input
            v-model="newDish.name"
            type="text"
            placeholder="请输入菜品名称"
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">是否按人头计数 *</label>
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input 
                v-model="newDish.countable" 
                type="radio" 
                :value="true"
                class="mr-2"
              >
              是
            </label>
            <label class="flex items-center">
              <input 
                v-model="newDish.countable" 
                type="radio" 
                :value="false"
                class="mr-2"
              >
              否
            </label>
          </div>
        </div>
      </div>
      
      <div class="p-4 border-t bg-gray-50 flex space-x-3">
        <button 
          @click="closeAddNewDish"
          class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          取消
        </button>
        <button 
          @click="confirmAddNewDish"
          :disabled="!newDish.name"
          :class="[
            'flex-1 py-3 rounded-lg font-medium transition-colors',
            newDish.name
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { DishService, OrderService } from '@/services'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'add', // 'add' 或 'remove'
    validator: (value) => ['add', 'remove'].includes(value)
  },
  orders: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:visible', 'submit', 'close'])

// 状态
const selectedOrder = ref(null)
const orderedSelectedDishes = ref([]) // 已点菜品的选择状态
const availableSelectedDishes = ref([]) // 菜品库的选择状态

// 弹窗状态
const showAddNewDish = ref(false)

// 新增菜品表单
const newDish = ref({
  name: '',
  countable: false
})

// 数据
const allDishes = ref([])

// 计算属性
const orderedDishes = computed(() => {
  if (!selectedOrder.value) return []
  // 这里应该从订单中获取已点的菜品
  // 暂时返回模拟数据
  return selectedOrder.value.items || []
})

const availableDishes = computed(() => {
  // 排除已点的菜品
  const orderedIds = orderedDishes.value.map(d => d.id)
  return allDishes.value.filter(dish => !orderedIds.includes(dish.id))
})

const canSubmit = computed(() => {
  return selectedOrder.value && 
         (orderedSelectedDishes.value.length > 0 || availableSelectedDishes.value.length > 0)
})

// 方法
const closeModal = () => {
  emit('update:visible', false)
  emit('close')
}

const selectOrder = (order) => {
  selectedOrder.value = order
  // 重置选择状态
  orderedSelectedDishes.value = []
  availableSelectedDishes.value = []
}

const toggleOrderedDish = (dish) => {
  const index = orderedSelectedDishes.value.findIndex(d => d.id === dish.id)
  if (index >= 0) {
    orderedSelectedDishes.value.splice(index, 1)
  } else {
    orderedSelectedDishes.value.push({ ...dish, quantity: 1 })
  }
}

const toggleAvailableDish = (dish) => {
  const index = availableSelectedDishes.value.findIndex(d => d.id === dish.id)
  if (index >= 0) {
    availableSelectedDishes.value.splice(index, 1)
  } else {
    availableSelectedDishes.value.push({ ...dish, quantity: 1 })
  }
}

const isOrderedSelected = (dishId) => {
  return orderedSelectedDishes.value.some(d => d.id === dishId)
}

const isAvailableSelected = (dishId) => {
  return availableSelectedDishes.value.some(d => d.id === dishId)
}

const getOrderedDishQuantity = (dishId) => {
  const dish = orderedSelectedDishes.value.find(d => d.id === dishId)
  return dish ? dish.quantity : 0
}

const getAvailableDishQuantity = (dishId) => {
  const dish = availableSelectedDishes.value.find(d => d.id === dishId)
  return dish ? dish.quantity : 0
}

const closeAddNewDish = () => {
  showAddNewDish.value = false
  newDish.value = { name: '', countable: false }
}

const confirmAddNewDish = async () => {
  if (!newDish.value.name) return
  
  try {
    // 创建新菜品
    const result = await DishService.createDish({
      name: newDish.value.name,
      stationId: 1,
      categoryId: 1,
      countable: newDish.value.countable
    })
    
    if (result.success) {
      // 添加到菜品库
      allDishes.value.push(result.data)
      closeAddNewDish()
    }
  } catch (error) {
    console.error('创建菜品失败:', error)
  }
}

const cancel = () => {
  resetForm()
  closeModal()
}

const submit = async () => {
  if (!canSubmit.value) return
  
  try {
    const changes = []
    
    // 处理已点菜品的变化
    orderedSelectedDishes.value.forEach(dish => {
      if (props.mode === 'add') {
        changes.push({
          action: 'add',
          dishId: dish.id,
          quantity: dish.quantity,
          orderId: selectedOrder.value.id
        })
      } else {
        changes.push({
          action: 'remove',
          dishId: dish.id,
          quantity: dish.quantity,
          orderId: selectedOrder.value.id
        })
      }
    })
    
    // 处理新增菜品
    availableSelectedDishes.value.forEach(dish => {
      changes.push({
        action: 'add',
        dishId: dish.id,
        quantity: dish.quantity,
        orderId: selectedOrder.value.id
      })
    })
    
    // 执行变更
    for (const change of changes) {
      if (change.action === 'add') {
        await OrderService.addDishToOrder(change.orderId, {
          dishId: change.dishId,
          quantity: change.quantity
        })
      } else {
        // 退菜逻辑 - 这里需要根据实际API调整
        await OrderService.removeDishFromOrder(change.orderId, change.dishId)
      }
    }
    
    emit('submit', {
      orderId: selectedOrder.value.id,
      changes,
      mode: props.mode
    })
    
    resetForm()
    closeModal()
  } catch (error) {
    console.error('操作失败:', error)
  }
}

const resetForm = () => {
  selectedOrder.value = null
  orderedSelectedDishes.value = []
  availableSelectedDishes.value = []
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 初始化加载菜品数据
const loadDishes = async () => {
  try {
    allDishes.value = await DishService.getAllDishes()
  } catch (error) {
    console.error('加载菜品数据失败:', error)
  }
}

// 监听visible变化
watch(() => props.visible, (newVal) => {
  if (newVal) {
    loadDishes()
  } else {
    resetForm()
  }
})
</script>

<style scoped>
/* 滚动条样式 */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e0 #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f7fafc;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #cbd5e0;
  border-radius: 3px;
}
</style>
```