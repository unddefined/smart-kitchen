<template>
  <div class="flex flex-col h-full bg-gray-100 p-3 overflow-y-auto">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex flex-col items-center justify-center h-full p-5">
      <div class="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4"></div>
      <p class="text-gray-600 text-base">正在加载订单详情...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="flex flex-col items-center justify-center h-full p-5 text-center">
      <div class="text-5xl mb-4">⚠️</div>
      <p class="text-gray-600 text-base mb-5">{{ error }}</p>
      <button
        @click="loadOrderDetail"
        class="px-6 py-3 bg-blue-500 text-white rounded-lg text-base cursor-pointer transition-all duration-200 hover:bg-blue-600 hover:-translate-y-0.5">
        重新加载
      </button>
    </div>

    <!-- 订单详情内容 -->
    <div v-else-if="orderDetail" class="h-full">
      <!-- 订单信息表格 -->
      <div class="bg-white rounded-xl p-3 mb-5 shadow-md">
        <h3 class="text-lg font-medium text-gray-800 mb-4">订单信息</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- 将人数和桌数放在同一行 -->
          <div class="flex gap-4 w-full">
            <div class="flex-1 min-w-0">
              <div class="flex justify-between">
                <span class="text-gray-600 text-base">人数:</span>
                <span class="text-gray-800 font-medium text-base">{{ orderDetail.peopleCount }}</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between">
                <span class="text-gray-600 text-base">桌数:</span>
                <span class="text-gray-800 font-medium text-base">{{ orderDetail.tableCount }}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 text-base">台号:</span>
            <span class="text-gray-800 font-medium text-base">{{ orderDetail.hallNumber }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 text-base">状态:</span>
            <span class="text-gray-800 font-medium text-base">{{ getOrderStatusText(orderDetail.status) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 text-base">创建时间:</span>
            <span class="text-gray-800 font-medium text-base">{{ formatDate(orderDetail.createdAt) }}</span>
          </div>
          <div v-if="orderDetail.mealTime" class="flex justify-between">
            <span class="text-gray-600 text-base">用餐时间:</span>
            <span class="text-gray-800 font-medium text-base">{{ formatDate(orderDetail.mealTime) }}</span>
          </div>
          <div v-if="orderDetail.remark" class="flex justify-between">
            <span class="text-gray-600 text-base">备注:</span>
            <span class="text-gray-800 font-medium text-base">{{ orderDetail.remark }}</span>
          </div>
          <div v-if="orderDetail.startTime" class="flex justify-between">
            <span class="text-gray-600 text-base">起菜时间:</span>
            <span class="text-gray-800 font-medium text-base">{{ orderDetail.startTime }}</span>
          </div>
        </div>
      </div>

      <!-- 已出菜品 -->
      <div class="bg-white rounded-xl p-3 mb-5 shadow-md">
        <h3 class="text-lg font-medium text-gray-800 mb-2">已出菜品</h3>
        <div class="flex flex-col gap-3">
          <div
            v-for="dish in servedDishes"
            :key="dish.id"
            class="p-3 rounded-lg border border-gray-300 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer">
            <div class="flex justify-between font-medium text-gray-800">
              <span class="dish-name">{{ dish.dish?.name || "未知菜品" }}</span>
              <span class="dish-quantity">×{{ dish.quantity }}</span>
            </div>
            <div v-if="dish.remark" class="text-lg text-gray-600 mt-2 p-2 bg-gray-100 rounded">
              {{ dish.remark }}
            </div>
          </div>
        </div>
      </div>

      <!-- 待上菜品 -->
      <div class="bg-white rounded-xl p-3 shadow-md">
        <h3 class="text-lg font-medium text-gray-800 mb-2">待上菜品</h3>
        <div class="flex flex-col gap-3">
          <div
            v-for="dish in pendingDishes"
            :key="dish.id"
            :class="[
              'p-3 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
              getDishPriorityClass(dish.priority || 0),
            ]"
            @click="handleDishClick(dish)">
            <div class="flex justify-between font-medium text-gray-800">
              <span class="text-xl">
                <span>{{ dish.dish?.name || "未知菜品" }}</span>
                <span>×{{ dish.quantity }}</span>
              </span>
              <span class="bg-gray-200 px-2 py-0.5 rounded-full text-sm">{{ getOrderItemStatusText(dish.status) }}</span>
            </div>
            <div v-if="dish.remark" class="text-lg text-gray-600 mt-2 p-2 bg-gray-100 rounded">
              {{ dish.remark }}
            </div>
            <div class="dish-meta"></div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3 mt-5 justify-between w-full">
        <button
          class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 whitespace-nowrap">
          添加备注
        </button>
        <button
          class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 whitespace-nowrap">
          编辑订单信息
        </button>
        <button
          @click="showCancelConfirm"
          :disabled="isCancelButtonDisabled"
          :class="[
            'flex-1 py-3 px-4 border rounded-lg text-base cursor-pointer transition-all duration-200 whitespace-nowrap',
            isCancelButtonDisabled 
              ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400'
          ]">
          取消订单
        </button>
      </div>
      <div class="h-16"></div>
    </div>

    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center h-full p-10 text-center bg-white rounded-xl shadow-md">
      <div class="text-5xl mb-4">📋</div>
      <p class="text-gray-600 text-lg">未找到订单详情</p>
    </div>

    <!-- 取消订单确认弹窗 -->
    <div v-if="showCancelModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <div class="text-5xl mb-4">⚠️</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">确认取消订单</h3>
          <p class="text-gray-600">
            确定要取消订单 #{{ orderDetail?.id }} 吗？此操作不可撤销。
          </p>
          <div class="mt-4 p-3 bg-red-50 rounded-lg">
            <p class="text-red-700 text-sm">
              注意：已开始制作的菜品可能无法退款
            </p>
          </div>
        </div>
        
        <div class="flex gap-3">
          <button
            @click="hideCancelConfirm"
            class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50">
            取消
          </button>
          <button
            @click="confirmCancelOrder"
            :disabled="isCancelling"
            :class="[
              'flex-1 py-3 px-4 rounded-lg text-white text-base cursor-pointer transition-all duration-200',
              isCancelling 
                ? 'bg-red-300 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 hover:-translate-y-0.5'
            ]">
            {{ isCancelling ? '取消中...' : '确认取消' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import OrderService from "@/services";

// Props
const props = defineProps({
  orderId: {
    type: [String, Number],
    required: true,
  },
});

// Emits
const emit = defineEmits(["back", "orderCancelled"]);

// 响应式数据
const orderDetail = ref(null);
const loading = ref(false);
const error = ref(null);
const showCancelModal = ref(false);
const isCancelling = ref(false);

// 计算属性 - 判断取消按钮是否禁用
const isCancelButtonDisabled = computed(() => {
  if (!orderDetail.value) return true;
  // 已完成或已取消的订单不能再次取消
  return orderDetail.value.status === 'done' || orderDetail.value.status === 'cancelled';
});

// 获取菜品优先级对应的CSS类
const getDishPriorityClass = (priority) => {
  const classes = {
    3: "border-red-500 bg-gradient-to-br from-red-50 to-red-100", // 红色 - 催菜
    2: "border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100", // 黄色 - 等一下
    1: "border-green-500 bg-gradient-to-br from-green-50 to-green-100", // 绿色 - 不急
    0: "border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100", // 灰色 - 未起
    "-1": "border-gray-500 bg-gradient-to-br from-gray-50 to-gray-100 opacity-80", // 灰色 - 已出
  };
  return classes[priority] || "border-gray-300 bg-white";
};

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

// 取消订单相关方法
const showCancelConfirm = () => {
  if (isCancelButtonDisabled.value) return;
  showCancelModal.value = true;
};

const hideCancelConfirm = () => {
  showCancelModal.value = false;
};

const confirmCancelOrder = async () => {
  if (isCancelling.value) return;
  
  try {
    isCancelling.value = true;
    
    // 确保orderId是数字类型
    const orderId = parseInt(props.orderId);
    if (isNaN(orderId)) {
      throw new Error("无效的订单ID");
    }

    const result = await OrderService.cancelOrder(orderId);
    
    if (result.success) {
      // 更新本地订单状态
      if (orderDetail.value) {
        orderDetail.value.status = 'cancelled';
      }
      
      // 隐藏确认弹窗
      hideCancelConfirm();
      
      // 通知父组件订单已取消
      emit('orderCancelled', orderId);
      
      // 显示成功提示（这里可以添加全局提示组件）
      alert('订单取消成功');
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('取消订单失败:', error);
    alert('取消订单失败: ' + (error.message || '未知错误'));
  } finally {
    isCancelling.value = false;
  }
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