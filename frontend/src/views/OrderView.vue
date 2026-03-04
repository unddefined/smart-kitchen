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
            <!-- 催菜提示 - 当订单状态为 urged 时显示 -->
            <div v-if="orderDetail?.status === 'urged'" class="text-red-600 font-medium mt-2 p-2 bg-red-50 rounded text-lg">
              {{ orderDetail.hallNumber }}催菜
            </div>
            <!-- 普通备注 -->
            <div v-else-if="dish.remark" class="text-lg text-gray-600 mt-2 p-2 bg-gray-100 rounded">
              {{ dish.remark }}
            </div>
            <div class="dish-meta"></div>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-2 mt-5 justify-between w-full">
        <button
          class="flex-1 py-2 px-3 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400 whitespace-nowrap">
          添加备注
        </button>
        <button
          @click="showEditModal"
          class="flex-1 py-2 px-3 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 text-base cursor-pointer transition-all duration-200 hover:bg-blue-100 hover:border-blue-400 whitespace-nowrap">
          编辑订单信息
        </button>
      </div>
      <!-- 完成订单按钮 - 当所有菜品上完后显示 -->
      <button
        @click="showCompleteConfirm"
        v-if="canCompleteOrder"
        :class="[
          'flex-1 py-2 px-3 mt-3 w-full border rounded-lg text-base cursor-pointer transition-all duration-200 whitespace-nowrap',
          'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400',
        ]">
        完成订单
      </button>
      <!-- 取消订单按钮 -->
      <button
        @click="showCancelConfirm"
        :disabled="isCancelButtonDisabled"
        :class="[
          'flex-1 py-2 px-3 mt-3 w-full border rounded-lg text-base cursor-pointer transition-all duration-200 whitespace-nowrap',
          isCancelButtonDisabled
            ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-400',
        ]">
        取消订单
      </button>
      <!-- 删除按钮 - 仅对已取消的订单显示 -->
      <button
        @click="showDeleteConfirm"
        v-if="orderDetail?.status === 'cancelled'"
        class="flex-1 py-2 px-3 mt-3 w-full border border-red-300 bg-red-50 text-red-700 rounded-lg text-base cursor-pointer transition-all duration-200 hover:bg-red-100 hover:border-red-400 whitespace-nowrap">
        删除订单
      </button>
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
          <p class="text-gray-600">确定要取消订单 #{{ orderDetail?.id }} 吗？此操作不可撤销。</p>
          <div class="mt-4 p-3 bg-red-50 rounded-lg">
            <p class="text-red-700 text-sm">注意：已开始制作的菜品可能无法退款</p>
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
              isCancelling ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 hover:-translate-y-0.5',
            ]">
            {{ isCancelling ? "取消中..." : "确认取消" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 完成订单确认弹窗 -->
    <div v-if="showCompleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <div class="text-5xl mb-4">✓</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">确认完成订单</h3>
          <p class="text-gray-600">确定要完成订单 #{{ orderDetail?.id }} 吗？</p>
          <div class="mt-4 p-3 bg-green-50 rounded-lg">
            <p class="text-green-700 text-sm font-medium">所有菜品已上完，订单完成后将无法修改</p>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="hideCompleteConfirm"
            class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50">
            取消
          </button>
          <button
            @click="confirmCompleteOrder"
            :disabled="isCompleting"
            :class="[
              'flex-1 py-3 px-4 rounded-lg text-white text-base cursor-pointer transition-all duration-200',
              isCompleting ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 hover:-translate-y-0.5',
            ]">
            {{ isCompleting ? "完成中..." : "确认完成" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除订单确认弹窗 -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <div class="text-5xl mb-4">🗑️</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">确认删除订单</h3>
          <p class="text-gray-600">确定要删除订单 #{{ orderDetail?.id }} 吗？此操作将永久删除订单数据，不可恢复。</p>
          <div class="mt-4 p-3 bg-red-50 rounded-lg">
            <p class="text-red-700 text-sm font-medium">警告：此操作将删除所有相关菜品记录</p>
          </div>
        </div>

        <div class="flex gap-3">
          <button
            @click="hideDeleteConfirm"
            class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50">
            取消
          </button>
          <button
            @click="confirmDeleteOrder"
            :disabled="isDeleting"
            :class="[
              'flex-1 py-3 px-4 rounded-lg text-white text-base cursor-pointer transition-all duration-200',
              isDeleting ? 'bg-red-300 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600 hover:-translate-y-0.5',
            ]">
            {{ isDeleting ? "删除中..." : "确认删除" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑订单信息弹窗 -->
    <div v-if="showEditModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <div class="text-5xl mb-4">✏️</div>
          <h3 class="text-xl font-bold text-gray-800 mb-2">编辑订单信息</h3>
          <p class="text-gray-600">修改订单 #{{ orderDetail?.id }} 的信息</p>
        </div>

        <div class="space-y-4">
          <!-- 台号输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">台号</label>
            <input
              v-model="editForm.hallNumber"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="请输入台号" />
          </div>

          <!-- 人数和桌数在同一行 -->
          <div class="flex gap-4">
            <!-- 人数输入 -->
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">人数</label>
              <select
                v-model="editForm.peopleCount"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="1">1 人</option>
                <option value="2">2 人</option>
                <option value="3">3 人</option>
                <option value="4">4 人</option>
                <option value="5">5 人</option>
                <option value="6">6 人</option>
                <option value="7">7 人</option>
                <option value="8">8 人</option>
                <option value="9">9 人</option>
                <option value="10">10 人</option>
                <option value="11">11 人</option>
                <option value="12">12 人</option>
                <option value="13">13 人</option>
                <option value="14">14 人</option>
                <option value="15">15 人</option>
                <option value="16">16 人</option>
                <option value="17">17 人</option>
                <option value="18">18 人</option>
                <option value="19">19 人</option>
                <option value="20">20 人</option>
                <option value="21">21 人</option>
                <option value="22">22 人</option>
              </select>
            </div>

            <!-- 桌数输入 -->
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-2">桌数</label>
              <input
                v-model.number="editForm.tableCount"
                type="number"
                min="1"
                max="10"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="桌数" />
            </div>
          </div>

          <!-- 用餐时间输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">用餐时间</label>
            <input
              v-model="editForm.mealTimeDisplay"
              type="datetime-local"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <!-- 状态选择 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">订单状态</label>
            <select
              v-model="editForm.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="created">已创建</option>
              <option value="started">待起菜</option>
              <option value="serving">出餐中</option>
              <option value="urged">已催菜</option>
              <option value="done">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="hideEditModal"
            class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50">
            取消
          </button>
          <button
            @click="confirmEditOrder"
            :disabled="isEditing"
            :class="[
              'flex-1 py-3 px-4 rounded-lg text-white text-base cursor-pointer transition-all duration-200',
              isEditing ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5',
            ]">
            {{ isEditing ? "保存中..." : "保存修改" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast 提示组件 -->
    <div
      v-if="toastMessage"
      class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300"
      :class="{
        'bg-green-500': toastType === 'success',
        'bg-red-500': toastType === 'error',
        'bg-blue-500': toastType === 'info',
      }">
      <div class="px-6 py-3 rounded-lg shadow-lg text-white text-base flex items-center gap-2">
        <span class="text-xl">
          {{ toastType === 'success' ? '✓' : toastType === 'error' ? '✗' : 'ℹ' }}
        </span>
        <span>{{ toastMessage }}</span>
      </div>
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
const emit = defineEmits(["back", "orderCancelled", "orderDeleted"]);

// 响应式数据
const orderDetail = ref(null);
const loading = ref(false);
const error = ref(null);
const showCancelModal = ref(false);
const showDeleteModal = ref(false);
const showCompleteModal = ref(false);
const showEditModalVisible = ref(false);
const isCancelling = ref(false);
const isDeleting = ref(false);
const isCompleting = ref(false);
const isEditing = ref(false);
const editForm = ref({
  hallNumber: "",
  peopleCount: 1,
  tableCount: 1,
  mealTimeDisplay: "",
  status: "created",
});

// Toast 提示相关
const toastMessage = ref(null);
const toastType = ref("success");

// 显示 Toast 函数
const showToast = (message, type = "success", duration = 3000) => {
  toastMessage.value = message;
  toastType.value = type;

  // 自动消失
  setTimeout(() => {
    toastMessage.value = null;
  }, duration);
};

// 计算属性 - 判断取消按钮是否禁用
const isCancelButtonDisabled = computed(() => {
  if (!orderDetail.value) return true;
  // 已完成或已取消的订单不能再次取消
  return orderDetail.value.status === "done" || orderDetail.value.status === "cancelled";
});

// 计算属性 - 判断是否可以完成订单
const canCompleteOrder = computed(() => {
  if (!orderDetail.value) return false;
  // 只有出餐中或催菜状态的订单，且所有菜品都已上完才能完成
  const isServingStatus = orderDetail.value.status === "serving" || orderDetail.value.status === "urged";
  const allItemsServed = pendingDishes.value.length === 0;
  return isServingStatus && allItemsServed;
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

    // 确保 orderId 是数字类型
    const orderId = parseInt(props.orderId);
    if (isNaN(orderId)) {
      throw new Error("无效的订单 ID");
    }

    const result = await OrderService.cancelOrder(orderId);

    if (result.success) {
      // 更新本地订单状态
      if (orderDetail.value) {
        orderDetail.value.status = "cancelled";
      }

      // 隐藏确认弹窗
      hideCancelConfirm();

      // 通知父组件订单已取消
      emit("orderCancelled", orderId);

      // 显示成功提示（这里可以添加全局提示组件）
      alert("订单取消成功");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("取消订单失败:", error);
    alert("取消订单失败：" + (error.message || "未知错误"));
  } finally {
    isCancelling.value = false;
  }
};

// 完成订单相关方法
const showCompleteConfirm = () => {
  if (!canCompleteOrder.value) return;
  showCompleteModal.value = true;
};

const hideCompleteConfirm = () => {
  showCompleteModal.value = false;
};

const confirmCompleteOrder = async () => {
  if (isCompleting.value) return;

  try {
    isCompleting.value = true;

    // 确保 orderId 是数字类型
    const orderId = parseInt(props.orderId);
    if (isNaN(orderId)) {
      throw new Error("无效的订单 ID");
    }

    const result = await OrderService.completeOrder(orderId);

    if (result.success) {
      // 更新本地订单状态
      if (orderDetail.value) {
        orderDetail.value.status = "done";
      }

      // 隐藏确认弹窗
      hideCompleteConfirm();

      // 通知父组件订单已完成
      emit("orderCancelled", orderId);

      // 显示成功提示
      alert("订单完成成功");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("完成订单失败:", error);
    alert("完成订单失败：" + (error.message || "未知错误"));
  } finally {
    isCompleting.value = false;
  }
};

// 删除订单相关方法
const showDeleteConfirm = () => {
  showDeleteModal.value = true;
};

const hideDeleteConfirm = () => {
  showDeleteModal.value = false;
};

const confirmDeleteOrder = async () => {
  if (isDeleting.value) return;

  try {
    isDeleting.value = true;

    // 确保 orderId 是数字类型
    const orderId = parseInt(props.orderId);
    if (isNaN(orderId)) {
      throw new Error("无效的订单 ID");
    }

    const result = await OrderService.deleteOrder(orderId);

    if (result.success) {
      // 清空当前订单详情
      orderDetail.value = null;

      // 隐藏确认弹窗
      hideDeleteConfirm();

      // 通知父组件订单已删除，需要刷新列表并返回总览
      emit("orderDeleted", orderId);
      emit("back");

      // 显示成功提示
      alert("订单删除成功");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("删除订单失败:", error);
    alert("删除订单失败：" + (error.message || "未知错误"));
  } finally {
    isDeleting.value = false;
  }
};

// 监听 orderId 变化，重新加载数据
watch(
  () => props.orderId,
  (newId) => {
    if (newId) {
      loadOrderDetail();
    }
  },
  { immediate: true },
);

// 编辑订单相关方法
const showEditModal = () => {
  if (!orderDetail.value) return;
  
  // 初始化表单数据
  editForm.value = {
    hallNumber: orderDetail.value.hallNumber || "",
    peopleCount: orderDetail.value.peopleCount || 1,
    tableCount: orderDetail.value.tableCount || 1,
    mealTimeDisplay: formatDateTimeLocal(orderDetail.value.mealTime),
    status: orderDetail.value.status || "created",
  };
  
  showEditModalVisible.value = true;
};

const hideEditModal = () => {
  showEditModalVisible.value = false;
};

// 格式化日期时间为 datetime-local 格式
const formatDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// 将 datetime-local 字符串转换为后端格式
const parseDateTimeLocal = (dateTimeString) => {
  if (!dateTimeString) return null;
  return new Date(dateTimeString).toISOString();
};

const confirmEditOrder = async () => {
  if (isEditing.value) return;

  try {
    isEditing.value = true;

    // 确保 orderId 是数字类型
    const orderId = parseInt(props.orderId);
    if (isNaN(orderId)) {
      throw new Error("无效的订单 ID");
    }

    // 准备更新数据
    const updateData = {
      hallNumber: editForm.value.hallNumber,
      peopleCount: parseInt(editForm.value.peopleCount),
      tableCount: parseInt(editForm.value.tableCount),
      mealTime: parseDateTimeLocal(editForm.value.mealTimeDisplay),
      status: editForm.value.status,
    };

    // 验证数据
    if (!updateData.hallNumber) {
      throw new Error("台号不能为空");
    }

    if (updateData.peopleCount < 1 || updateData.peopleCount > 22) {
      throw new Error("人数必须在 1-22 之间");
    }

    if (updateData.tableCount < 1 || updateData.tableCount > 10) {
      throw new Error("桌数必须在 1-10 之间");
    }

    const result = await OrderService.updateOrder(orderId, updateData);

    if (result.success) {
      // 更新本地订单详情
      orderDetail.value = {
        ...orderDetail.value,
        ...result.data,
      };

      // 隐藏弹窗
      hideEditModal();

      // 通知父组件订单已更新（可选）
      emit("orderCancelled", orderId);

      // 显示成功提示
      showToast("订单信息更新成功", "success");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("更新订单失败:", error);
    showToast("更新订单失败：" + (error.message || "未知错误"), "error");
  } finally {
    isEditing.value = false;
  }
};
</script>
