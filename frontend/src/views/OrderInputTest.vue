<template>
  <div class="order-input-test p-4 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6 text-gray-900">订单录入功能测试</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- 订单录入测试 -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">订单录入测试</h2>
        <button 
          @click="showOrderModal = true"
          class="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-md mb-4"
        >
          打开订单录入
        </button>
        
        <div class="text-sm text-gray-600">
          <p class="mb-2">✨ 新功能特性：</p>
          <ul class="list-disc list-inside space-y-1 text-gray-500">
            <li>网格布局菜品选择</li>
            <li>点击菜品弹出详情编辑</li>
            <li>支持份量增减和备注</li>
            <li>新增菜品功能</li>
            <li>完整的订单信息收集</li>
          </ul>
        </div>
      </div>

      <!-- 加菜退菜测试 -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">加菜/退菜测试</h2>
        <div class="space-y-3">
          <button 
            @click="showAddDishModal = true"
            class="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all font-medium shadow-md"
          >
            加菜功能
          </button>
          
          <button 
            @click="showRemoveDishModal = true"
            class="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-md"
          >
            退菜功能
          </button>
        </div>
        
        <div class="text-sm text-gray-600 mt-4">
          <p class="mb-2">✨ 功能特点：</p>
          <ul class="list-disc list-inside space-y-1 text-gray-500">
            <li>台号选择</li>
            <li>已点菜品管理</li>
            <li>菜品库浏览</li>
            <li>批量操作支持</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 提交结果显示 -->
    <div v-if="lastSubmission" class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-8 shadow-sm">
      <div class="flex items-center mb-4">
        <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-green-800">操作成功</h2>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <h3 class="font-semibold text-green-700 mb-3">订单信息</h3>
          <div class="space-y-2 text-green-700">
            <div class="flex justify-between">
              <span class="font-medium">操作类型:</span>
              <span>{{ lastSubmission.type }}</span>
            </div>
            <div v-if="lastSubmission.data.orderId" class="flex justify-between">
              <span class="font-medium">订单编号:</span>
              <span class="font-mono">{{ lastSubmission.data.orderId }}</span>
            </div>
            <div v-if="lastSubmission.data.tableNumber" class="flex justify-between">
              <span class="font-medium">桌号:</span>
              <span>{{ lastSubmission.data.tableNumber }}</span>
            </div>
            <div v-if="lastSubmission.data.hallNumber" class="flex justify-between">
              <span class="font-medium">台号:</span>
              <span>{{ lastSubmission.data.hallNumber }}</span>
            </div>
            <div v-if="lastSubmission.data.peopleCount" class="flex justify-between">
              <span class="font-medium">用餐人数:</span>
              <span>{{ lastSubmission.data.peopleCount }} 人</span>
            </div>
          </div>
        </div>
        
        <div v-if="lastSubmission.data.dishes && lastSubmission.data.dishes.length > 0">
          <h3 class="font-semibold text-green-700 mb-3">菜品明细</h3>
          <div class="space-y-2">
            <div 
              v-for="(dish, index) in lastSubmission.data.dishes" 
              :key="index"
              class="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100"
            >
              <div class="flex items-center">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <span class="text-green-700 font-medium text-sm">{{ index + 1 }}</span>
                </div>
                <div>
                  <div class="font-medium text-green-800">{{ dish.name }}</div>
                  <div class="text-sm text-green-600">{{ dish.remark || '无备注' }}</div>
                </div>
              </div>
              <div class="text-green-700 font-medium">
                ×{{ dish.quantity }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单录入弹窗 -->
    <OrderInputModal 
      v-model:visible="showOrderModal"
      @submit="handleOrderSubmit"
      @close="handleModalClose"
    />

    <!-- 加菜弹窗 -->
    <AddDishModal 
      v-model:visible="showAddDishModal"
      mode="add"
      :orders="mockOrders"
      @submit="handleAddDishSubmit"
      @close="handleModalClose"
    />

    <!-- 退菜弹窗 -->
    <AddDishModal 
      v-model:visible="showRemoveDishModal"
      mode="remove"
      :orders="mockOrders"
      @submit="handleRemoveDishSubmit"
      @close="handleModalClose"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import OrderInputModal from '@/components/OrderInputModal.vue'
import AddDishModal from '@/components/AddDishModal.vue'

// 状态管理
const showOrderModal = ref(false)
const showAddDishModal = ref(false)
const showRemoveDishModal = ref(false)
const lastSubmission = ref(null)

// 模拟订单数据
const mockOrders = ref([
  {
    id: 1,
    hallNumber: 'A01',
    tableNumber: 'T01',
    peopleCount: 4,
    createdAt: new Date().toISOString(),
    items: [
      { id: 1, name: '宫保鸡丁', quantity: 1 },
      { id: 2, name: '麻婆豆腐', quantity: 1 }
    ]
  },
  {
    id: 2,
    hallNumber: 'A02',
    tableNumber: 'T02',
    peopleCount: 2,
    createdAt: new Date().toISOString(),
    items: [
      { id: 3, name: '红烧肉', quantity: 1 }
    ]
  }
])

// 处理函数
const handleOrderSubmit = (orderData) => {
  console.log('订单提交:', orderData)
  lastSubmission.value = {
    type: '订单录入',
    data: orderData
  }
}

const handleAddDishSubmit = (data) => {
  console.log('加菜提交:', data)
  lastSubmission.value = {
    type: '加菜操作',
    data: data
  }
}

const handleRemoveDishSubmit = (data) => {
  console.log('退菜提交:', data)
  lastSubmission.value = {
    type: '退菜操作',
    data: data
  }
}

const handleModalClose = () => {
  showOrderModal.value = false
  showAddDishModal.value = false
  showRemoveDishModal.value = false
}
</script>

<style scoped>
.order-input-test {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>
```