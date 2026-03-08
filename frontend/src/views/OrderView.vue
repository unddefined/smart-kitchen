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
                <span class="text-gray-600 text-xl">人数:</span>
                <span class="text-gray-800 font-medium text-base">{{ orderDetail.peopleCount }}</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between">
                <span class="text-gray-600 text-xl">桌数:</span>
                <span class="text-gray-800 font-medium text-base">{{ orderDetail.tableCount }}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 text-xl">台号:</span>
            <span class="text-gray-800 font-medium text-xl">{{ orderDetail.hallNumber }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 text-xl">状态:</span>
            <span class="text-gray-800 font-medium text-xl">{{ getOrderStatusText(orderDetail.status) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600 text-xl">创建时间:</span>
            <span class="text-gray-800 font-medium text-xl">{{ formatDate(orderDetail.createdAt) }}</span>
          </div>
          <div v-if="orderDetail.mealTime" class="flex justify-between">
            <span class="text-gray-600 text-xl">用餐时间:</span>
            <span class="text-gray-800 font-medium text-xl">{{ formatMealTime(orderDetail.mealTime, orderDetail.mealType) }}</span>
          </div>
          <div v-if="orderDetail.startTime" class="flex justify-between">
            <span class="text-gray-600 text-xl">起菜时间:</span>
            <span class="text-gray-800 font-medium text-xl">{{ formatDateTime(orderDetail.startTime) }}</span>
          </div>
          <div v-if="orderDetail.remark" class="flex justify-between items-start">
            <span class="text-gray-600 text-xl">订单备注:</span>
            <span class="text-gray-800 font-medium text-xl text-right break-all">{{ orderDetail.remark }}</span>
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
          @click="showEditRemarkModal"
          class="flex-1 py-2 px-3 border border-green-300 rounded-lg bg-green-50 text-green-700 text-base cursor-pointer transition-all duration-200 hover:bg-green-100 hover:border-green-400 whitespace-nowrap">
          编辑备注
        </button>
        <button
          @click="showModifyDishesModal"
          class="flex-1 py-2 px-3 border border-purple-300 rounded-lg bg-purple-50 text-purple-700 text-base cursor-pointer transition-all duration-200 hover:bg-purple-100 hover:border-purple-400 whitespace-nowrap">
          修改菜品
        </button>
      </div>
      <div class="flex gap-2 mt-3 justify-between w-full">
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
    <ConfirmModal
      v-model:visible="showCancelModal"
      type="warning"
      title="确认取消订单"
      :message="'确定要取消订单 #' + orderDetail?.id + ' 吗？此操作不可撤销。'"
      warning-text="注意：已开始制作的菜品可能无法退款"
      :loading="isCancelling"
      loading-text="取消中..."
      confirm-text="确认取消"
      @confirm="confirmCancelOrder" />

    <!-- 完成订单确认弹窗 -->
    <ConfirmModal
      v-model:visible="showCompleteModal"
      type="success"
      title="确认完成订单"
      :message="'确定要完成订单 #' + orderDetail?.id + ' 吗？'"
      warning-text="所有菜品已上完，订单完成后将无法修改"
      :loading="isCompleting"
      loading-text="完成中..."
      confirm-text="确认完成"
      @confirm="confirmCompleteOrder" />

    <!-- 删除订单确认弹窗 -->
    <ConfirmModal
      v-model:visible="showDeleteModal"
      type="delete"
      title="确认删除订单"
      :message="'确定要删除订单 #' + orderDetail?.id + ' 吗？此操作将永久删除订单数据，不可恢复。'"
      warning-text="警告：此操作将删除所有相关菜品记录"
      :loading="isDeleting"
      loading-text="删除中..."
      confirm-text="确认删除"
      @confirm="confirmDeleteOrder" />
    <!-- 编辑订单信息弹窗 -->
    <div v-if="showEditModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <h3 class="text-xl font-bold text-gray-800 mb-2">编辑订单信息</h3>
        </div>

        <div class="space-y-4">
          <!-- 台号输入 -->
          <div class="flex space-x-4 items-center">
            <label class="text-xl font-medium text-gray-700 whitespace-nowrap">台号</label>
            <input
              v-model="editForm.hallNumber"
              type="text"
              placeholder="请输入台号"
              class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <!-- 人数和桌数在同一行 -->
          <div class="flex space-x-4">
            <div class="flex items-center space-x-3 flex-1">
              <label class="text-xl whitespace-nowrap">人数</label>
              <input
                v-model.number="editForm.peopleCount"
                type="number"
                min="1"
                placeholder="人数"
                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <label class="text-xl whitespace-nowrap">桌数</label>
              <input
                v-model.number="editForm.tableCount"
                type="number"
                min="1"
                placeholder="桌数"
                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- 用餐时间输入 -->
          <div class="flex space-x-4 items-center">
            <label class="text-xl font-medium text-gray-700 whitespace-nowrap">用餐时间</label>
            <div class="flex space-x-2 items-center flex-nowrap">
              <input
                v-model="mealDate"
                type="date"
                class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]" />
              <span class="flex rounded overflow-hidden">
                <button
                  :class="[
                    'px-3 py-1 border-r border-gray-300 text-xl cursor-pointer transition-all duration-200',
                    mealTime === '午餐' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100',
                  ]"
                  @click="mealTime = '午餐'">
                  午
                </button>
                <button
                  :class="[
                    'px-3 py-1 border-gray-300 text-xl cursor-pointer transition-all duration-200',
                    mealTime === '晚餐' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100',
                  ]"
                  @click="mealTime = '晚餐'">
                  晚
                </button>
              </span>
            </div>
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

    <!-- 编辑订单备注弹窗 -->
    <div v-if="showEditRemarkModalVisible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <div class="text-center mb-6">
          <h3 class="text-xl font-bold text-gray-800 mb-2">编辑订单备注</h3>
          <p class="text-sm text-gray-600 mt-2">台号：{{ orderDetail?.hallNumber }}</p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">订单备注</label>
            <textarea
              v-model="editRemarkForm.remark"
              rows="4"
              placeholder="请输入订单备注（如：大份、不要葱蒜）..."
              class="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"></textarea>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="hideEditRemarkModal"
            class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50">
            取消
          </button>
          <button
            @click="confirmEditRemark"
            :disabled="isEditingRemark"
            :class="[
              'flex-1 py-3 px-4 rounded-lg text-white text-base cursor-pointer transition-all duration-200',
              isEditingRemark ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 hover:-translate-y-0.5',
            ]">
            {{ isEditingRemark ? "保存中..." : "保存备注" }}
          </button>
        </div>
      </div>
    </div>

    <!-- 修改菜品弹窗 -->
    <div v-if="showModifyModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" @click.stop>
        <div class="p-4 border-b sticky top-0 bg-white rounded-t-xl z-10">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold text-gray-800">修改菜品</h3>
            <button @click="hideModifyModal" class="text-gray-400 hover:text-gray-600">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p class="text-sm text-gray-600 mt-2">灰色为已上菜（不可点击），其他为未上菜（可退选）</p>
        </div>

        <div class="p-4">
          <!-- 加载状态 -->
          <div v-if="loadingDishes" class="text-center py-8">
            <div class="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-gray-500 mt-2">加载菜品中...</p>
          </div>

          <!-- 错误状态 -->
          <div v-else-if="loadDishesError" class="text-center py-8">
            <p class="text-red-500">{{ loadDishesError }}</p>
            <button @click="loadDishes" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">重试</button>
          </div>

          <!-- 菜品选择器 -->
          <div v-else>
            <DishSelector
              ref="dishSelectorRef"
              :dishes="availableDishes"
              :selected-dishes="selectedOrderItems"
              :served-dish-ids="servedDishIds"
              mode="edit"
              title="菜品库"
              :show-add-button="false"
              :show-weight-input="true"
              :readonly="false"
              @update:selected-dishes="handleSelectedDishesChange"
              @dish-click="handleDishSelectorClick"
              @dish-edit="handleDishEdit" />
          </div>
        </div>

        <div class="p-4 border-t bg-gray-50 flex gap-3 sticky bottom-0">
          <button @click="hideModifyModal" class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors">
            取消
          </button>
          <button
            @click="confirmModifyDishes"
            :disabled="isModifying"
            :class="[
              'flex-1 py-3 rounded-lg text-white font-medium transition-all duration-200',
              isModifying ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600 hover:-translate-y-0.5',
            ]">
            {{ isModifying ? "保存中..." : "保存修改" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import { useOrderAutoRefresh } from "@/composables/useOrderAutoRefresh";
import { OrderService } from "@/services";
import ConfirmModal from "@/components/ConfirmModal.vue";
import { useToast } from "@/composables/useToast";
import { api } from "@/services/api";
import DishSelector from "@/components/DishSelector.vue";
import { useDishLoader } from "@/composables/useDishLoader";
import { useDishManager } from "@/composables/useDishManager";

// 使用 toast 组合式函数（使用全局注入）
const { showToast, showSuccess, showError, showInfo } = useToast();

// Props
const props = defineProps({
  orderId: {
    type: [String, Number],
    required: true,
  },
});

// Emits
const emit = defineEmits(["back", "orderCancelled", "orderDeleted", "dish-action"]);

// 响应式数据
const orderDetail = ref(null);
const loading = ref(false);
const error = ref(null);
const showCancelModal = ref(false);
const showDeleteModal = ref(false);
const showCompleteModal = ref(false);
const isCancelling = ref(false);
const isDeleting = ref(false);
const isCompleting = ref(false);
const isEditing = ref(false);
const isEditingRemark = ref(false); // 编辑备注状态
const showModifyModal = ref(false); // 修改菜品弹窗状态
const isModifying = ref(false); // 修改菜品加载状态
const originalOrderItems = ref([]); // 原始菜品快照

// DishSelector 组件引用
const dishSelectorRef = ref(null);

// 获取本地日期字符串（避免时区问题）
const getLocalDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const mealDate = ref(getLocalDateString(new Date()));
const mealTime = ref("午餐");
const editForm = ref({
  hallNumber: "",
  peopleCount: 1,
  tableCount: 1,
  status: "created",
});

// 编辑备注表单
const editRemarkForm = ref({
  remark: "",
});

// 编辑订单弹窗状态
const showEditModalVisible = ref(false);

// 编辑备注弹窗状态
const showEditRemarkModalVisible = ref(false);

// 使用菜品加载 Composable
const { dishes: availableDishes, loading: loadingDishes, error: loadDishesError, loadDishes, resetDishes } = useDishLoader();

// 订单中的菜品（未上菜的）
const selectedOrderItems = ref([]);

// 使用菜品管理 Composable - 专注于交互逻辑
const dishManager = useDishManager({
  onStatusChange: (dish, newStatus, newPriority) => {
    // 兼容两种数据结构
    const dishName = dish.name || dish.dish?.name || "未知菜品";
    console.log("状态变更:", dishName, newStatus, newPriority);
    // 详情页不需要手动重新加载，WebSocket 会自动刷新
    // loadOrderDetail();
  },
  onPriorityAdjust: (dish, quantity, priority) => {
    // 兼容两种数据结构
    const dishName = dish.name || dish.dish?.name || "未知菜品";
    console.log("优先级调整:", dishName, quantity, priority);
    // 这里可以调用后端 API 更新优先级
  },
});

// 解构常用方法
const { getPriorityClass: getDishPriorityClass, handleDishClick: handleDishClickBase } = dishManager;

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

// 计算已上菜的菜品 ID 列表（用于禁用这些菜品）
const servedDishIds = computed(() => {
  if (!orderDetail.value?.items) return [];
  return orderDetail.value.items.filter((item) => item.status === "served").map((item) => item.dishId);
});

// 计算属性
const servedDishes = computed(() => {
  if (!orderDetail.value?.items) return [];
  return orderDetail.value.items.filter((item) => item.status === "served");
});

const pendingDishes = computed(() => {
  if (!orderDetail.value?.items) return [];
  const pending = orderDetail.value.items.filter((item) => item.status !== "served");
  // 待上菜品按优先级降序排列：3(催菜) > 2(等一下) > 1(不急) > 0(未起)
  return pending.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return (a.dish?.name || "").localeCompare(b.dish?.name || "");
  });
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

    // 确保 orderId 是数字类型
    const orderId = parseInt(props.orderId);
    if (isNaN(orderId)) {
      throw new Error("无效的订单 ID");
    }

    console.log(`🔄 加载订单详情 #${orderId}...`);
    
    const detail = await OrderService.getOrderDetail(orderId);
    
    if (detail) {
      console.log(`✅ 订单 #${orderId} 加载成功:`, detail.status);
      orderDetail.value = detail;
    } else {
      console.warn(`⚠️ 订单 #${orderId} 不存在`);
      error.value = "未找到该订单";
      orderDetail.value = null; // 明确设置为 null
    }
  } catch (err) {
    console.error(`❌ 加载订单详情失败 #${props.orderId}:`, err);
    error.value = "加载订单详情失败：" + (err.message || "未知错误");
    // 保留之前的订单详情，避免闪烁
    // orderDetail.value = null;
  } finally {
    loading.value = false;
  }
};

const handleDishClick = async (dish) => {
  console.log("点击菜品:", dish);

  // 根据 MVP文档，优先级为 0 的菜品（未起）不能直接上菜
  if (dish.priority === 0 && dish.status === "ready") {
    showError(`还未起菜，无法上菜。`);
    return;
  }

  // 调用 composable 提供的通用方法，传入必要的回调函数
  // 传入 emit 函数以通知父组件状态变更
  await handleDishClickBase(dish, { showSuccess, showError, showInfo }, loadOrderDetail, emit);
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

// 格式化用餐时间：日期 + 餐型（不显示时分）
const formatMealTime = (dateString, mealType) => {
  if (!dateString) return "";

  // 获取日期部分（YYYY-MM-DD）
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // 根据 mealType 转换为中文
  let typeStr = "";
  if (mealType === "lunch") {
    typeStr = "午餐";
  } else if (mealType === "dinner") {
    typeStr = "晚餐";
  } else if (mealType === "breakfast") {
    typeStr = "早餐";
  } else {
    typeStr = "其他";
  }

  return `${dateStr} ${typeStr}`;
};

// 格式化完整日期时间（包含时分）
const formatDateTime = (dateString) => {
  if (!dateString) return "未知";
  return new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 取消订单相关方法
const showCancelConfirm = () => {
  if (isCancelButtonDisabled.value) return;
  showCancelModal.value = true;
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

      // 通知父组件订单已取消
      emit("orderCancelled", orderId);

      // 显示成功提示
      showSuccess("订单取消成功");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("取消订单失败:", error);
    showError("取消订单失败：" + (error.message || "未知错误"));
  } finally {
    isCancelling.value = false;
  }
};

// 完成订单相关方法
const showCompleteConfirm = () => {
  if (!canCompleteOrder.value) return;
  showCompleteModal.value = true;
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

      // 通知父组件订单已完成
      emit("orderCancelled", orderId);

      // 显示成功提示
      showSuccess("订单完成成功");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("完成订单失败:", error);
    showError("完成订单失败：" + (error.message || "未知错误"));
  } finally {
    isCompleting.value = false;
  }
};

// 删除订单相关方法
const showDeleteConfirm = () => {
  showDeleteModal.value = true;
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

      // 通知父组件订单已删除，需要刷新列表并返回总览
      emit("orderDeleted", orderId);
      emit("back");

      // 显示成功提示
      showSuccess("订单删除成功");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("删除订单失败:", error);
    showError("删除订单失败：" + (error.message || "未知错误"));
  } finally {
    isDeleting.value = false;
  }
};

// 监听 orderId 变化，重新加载数据
watch(
  () => props.orderId,
  (newId, oldId) => {
    console.log(`🔍 orderId 变化：${oldId} → ${newId}`);
    if (newId) {
      loadOrderDetail();
    }
  },
  { immediate: true },
);

// 监听 orderDetail 值的变化，调试用
watch(
  () => orderDetail.value,
  (newValue, oldValue) => {
    if (newValue === null && oldValue !== null) {
      console.warn('⚠️ orderDetail 被设置为 null！');
      console.warn('之前的订单:', oldValue?.id, '当前状态:', oldValue?.status);
    } else if (newValue) {
      console.log('✅ orderDetail 更新:', newValue.id, '状态:', newValue.status);
    }
  },
  { deep: true }
);

// 编辑订单相关方法
const showEditModal = () => {
  if (!orderDetail.value) return;

  // 从后端返回的 mealTime 和 mealType 解析出日期和餐型
  let parsedDate = new Date().toISOString().split("T")[0];
  let parsedMealType = "午餐";

  // 优先使用 mealType 字段
  if (orderDetail.value.mealType) {
    if (orderDetail.value.mealType === "lunch") {
      parsedMealType = "午餐";
    } else if (orderDetail.value.mealType === "dinner") {
      parsedMealType = "晚餐";
    }
  }

  // 如果有 mealTime，使用其日期部分
  if (orderDetail.value.mealTime) {
    const dateObj = new Date(orderDetail.value.mealTime);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    parsedDate = `${year}-${month}-${day}`;

    // 如果 mealType 为空，尝试根据小时数推断餐型
    if (!orderDetail.value.mealType) {
      const hours = dateObj.getHours();
      if (hours >= 9 && hours < 15) {
        parsedMealType = "午餐"; // 9:00-15:00 视为午餐
      } else if (hours >= 15 && hours < 21) {
        parsedMealType = "晚餐"; // 15:00-21:00 视为晚餐
      }
    }
  }

  // 初始化表单数据
  editForm.value = {
    hallNumber: orderDetail.value.hallNumber || "",
    peopleCount: orderDetail.value.peopleCount || 1,
    tableCount: orderDetail.value.tableCount || 1,
    status: orderDetail.value.status || "created",
  };

  // 设置用餐时间
  mealDate.value = parsedDate;
  mealTime.value = parsedMealType;

  showEditModalVisible.value = true;
};

const hideEditModal = () => {
  showEditModalVisible.value = false;
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

    // 获取原始状态
    const originalStatus = orderDetail.value?.status || "created";
    const newStatus = editForm.value.status;

    // 如果状态发生变化，使用专用的状态更新 API
    if (originalStatus !== newStatus) {
      // 根据不同的状态转换调用不同的专用 API
      let result;

      switch (newStatus) {
        case "serving":
          // 起菜 - 调用专用 API（会初始化菜品优先级）
          result = await OrderService.startOrder(orderId);
          break;

        case "urged":
          // 催菜 - 调用专用 API
          result = await OrderService.urgeOrder(orderId);
          break;

        case "done":
          // 完成订单 - 调用专用 API
          result = await OrderService.completeOrder(orderId);
          break;

        case "cancelled":
          // 取消订单 - 调用专用 API
          result = await OrderService.cancelOrder(orderId);
          break;

        case "started":
          // 待起菜/暂停 - 都使用通用 update API
          result = await OrderService.updateOrder(orderId, { status: newStatus });
          break;

        default:
          // 其他状态（如 created）使用通用 update API
          result = await OrderService.updateOrder(orderId, { status: newStatus });
          break;
      }

      if (result.success) {
        // 隐藏弹窗
        hideEditModal();

        // 通知父组件订单已更新（但不刷新列表，由 WebSocket 自动处理）
        emit("orderCancelled", orderId);

        // 显示成功提示
        showSuccess("订单信息更新成功");
        
        // 不立即调用 loadOrderDetail，等待 WebSocket 触发自动刷新
      } else {
        throw new Error(result.message);
      }
    } else {
      // 状态未变化，只更新其他字段
      const updateData = {};

      // 只有当其他字段有变化时才更新
      if (editForm.value.hallNumber !== orderDetail.value.hallNumber) {
        updateData.hallNumber = editForm.value.hallNumber;
      }

      if (editForm.value.peopleCount !== orderDetail.value.peopleCount) {
        updateData.peopleCount = parseInt(editForm.value.peopleCount);
      }

      if (editForm.value.tableCount !== orderDetail.value.tableCount) {
        updateData.tableCount = parseInt(editForm.value.tableCount);
      }

      // 如果没有需要更新的字段，直接关闭弹窗
      if (Object.keys(updateData).length === 0) {
        hideEditModal();
        showInfo("没有需要更新的字段");
        return;
      }

      const result = await OrderService.updateOrder(orderId, updateData);

      if (result.success) {
        // 隐藏弹窗
        hideEditModal();

        // 通知父组件订单已更新
        emit("orderCancelled", orderId);

        // 显示成功提示
        showSuccess("订单信息更新成功");
      } else {
        throw new Error(result.message);
      }
    }
  } catch (error) {
    console.error("更新订单失败:", error);
    showError("更新订单失败：" + (error.message || "未知错误"));
  } finally {
    isEditing.value = false;
  }
};

// 使用订单自动刷新 Composable（详情页模式）
useOrderAutoRefresh({
  refreshFn: loadOrderDetail,
  mode: "detail",
  orderId: props.orderId,
});

// 隐藏修改菜品弹窗
const hideModifyModal = () => {
  showModifyModal.value = false;
  selectedOrderItems.value = [];
  originalOrderItems.value = []; // 清空快照
  resetDishes(); // 使用 useDishLoader 提供的 resetDishes 方法
};

// ========== 修改菜品相关方法 ==========

// 显示修改菜品弹窗
const showModifyDishesModal = async () => {
  if (!orderDetail.value) return;

  showModifyModal.value = true;
  await loadDishes(); // 使用 useDishLoader 提供的 loadDishes 方法
  initializeSelectedOrderItems(); // 初始化已选中的订单菜品

  // 等待下一个 tick，确保 DishSelector 组件已经渲染并接收了 selectedOrderItems
  await nextTick();

  // 保存原始菜品快照，用于后续比较哪些被删除了
  // 直接从 DishSelector 组件获取初始状态
  const initialSelectedDishes = dishSelectorRef.value?.selectedDishes || selectedOrderItems.value;
  originalOrderItems.value = JSON.parse(JSON.stringify(initialSelectedDishes));

  console.log("=== 打开修改菜品弹窗 ===");
  console.log(
    "原始菜品快照:",
    originalOrderItems.value.map((i) => ({ id: i.orderItemId, name: i.name })),
  );
};

// 初始化已选中的订单菜品
const initializeSelectedOrderItems = () => {
  if (!orderDetail.value?.items) return;

  selectedOrderItems.value = orderDetail.value.items.map((item) => ({
    id: item.dishId,
    orderItemId: item.id,
    status: item.status,
    priority: item.priority,
    name: item.dish?.name || "未知菜品",
    quantity: item.quantity || 1,
    remark: item.remark || "",
    weight: item.weight || null, // 添加 weight 字段
    weightValue: extractWeightValue(item.weight) || null,
    weightUnit: extractWeightUnit(item.weight) || "两",
    dish: item.dish,
  }));

  console.log(
    "=== 初始化已选中的订单菜品 ===",
    selectedOrderItems.value.map((i) => ({
      id: i.id,
      name: i.name,
      weight: i.weight,
      weightValue: i.weightValue,
      weightUnit: i.weightUnit,
    })),
  );
};

// 从 weight 字符串中提取数值部分（如 "2 两" -> 2）
const extractWeightValue = (weight) => {
  if (!weight) return null;
  const match = weight.match(/^(\d+)/);
  return match ? parseInt(match[1]) : null;
};

// 从 weight 字符串中提取单位部分（如 "2 两" -> "两"）
const extractWeightUnit = (weight) => {
  if (!weight) return "两";
  const match = weight.match(/[\u4e00-\u9fa5]+$/);
  return match ? match[0] : "两";
};

// 处理选中菜品的变化
const handleSelectedDishesChange = (newSelectedDishes) => {
  console.log("=== handleSelectedDishesChange 被调用 ===");
  console.log(
    "传入的新数据:",
    newSelectedDishes.map((i) => ({
      id: i.id,
      orderItemId: i.orderItemId,
      name: i.name,
      quantity: i.quantity,
      weight: i.weight,
      weightValue: i.weightValue,
      weightUnit: i.weightUnit,
      remark: i.remark,
    })),
  );

  // 直接赋值，不需要恢复逻辑
  // 因为 DishSelector 组件会保留 orderItemId 字段
  selectedOrderItems.value = newSelectedDishes;
  
  console.log("选中的菜品:", selectedOrderItems.value);
};

// 处理菜品选择器中的菜品点击
const handleDishSelectorClick = (dish) => {
  console.log("点击菜品选择器中的菜品:", dish);
  // DishSelector 组件会自动处理选中/取消选中逻辑
};

// 处理菜品编辑事件（DishSelector 内部会自动打开编辑弹窗）
const handleDishEdit = (dish) => {
  console.log("编辑菜品:", dish);
  // 无需任何操作，DishSelector 组件内部会处理编辑弹窗的显示
};

// 确认修改菜品
const confirmModifyDishes = async () => {
  if (isModifying.value) return;

  try {
    isModifying.value = true;

    // 调试信息
    console.log("=== 开始确认修改菜品 ===");
    console.log(
      "原始菜品快照 (originalOrderItems):",
      originalOrderItems.value.map((i) => ({ id: i.id, orderItemId: i.orderItemId, name: i.name, quantity: i.quantity })),
    );
    console.log(
      "当前选中的菜品 (selectedOrderItems):",
      selectedOrderItems.value.map((i) => ({ id: i.id, orderItemId: i.orderItemId, name: i.name, quantity: i.quantity })),
    );

    // 简化的 diff 算法：基于 orderItemId 唯一标识
    const originalMap = new Map(originalOrderItems.value.map(i => [i.orderItemId, i]));
    const currentMap = new Map(selectedOrderItems.value.filter(i => i.orderItemId).map(i => [i.orderItemId, i]));

    // 删除的菜品：原来有但现在没有（通过 orderItemId 判断）
    const removedItems = originalOrderItems.value.filter(item => !currentMap.has(item.orderItemId));
    
    // 更新的菜品：orderItemId 存在但内容有变化
    const modifiedItems = selectedOrderItems.value
      .filter(i => i.orderItemId)
      .filter(i => {
        const original = originalMap.get(i.orderItemId);
        return original && (
          original.quantity !== i.quantity ||
          original.remark !== i.remark ||
          original.weight !== i.weight
        );
      });
    
    // 新增的菜品：orderItemId 为 null
    const addedItems = selectedOrderItems.value.filter(item => !item.orderItemId);

    console.log("需要删除的菜品:", removedItems.map(i => ({ id: i.id, orderItemId: i.orderItemId, name: i.name })));
    console.log("需要更新的菜品:", modifiedItems.map(i => ({ id: i.id, orderItemId: i.orderItemId, name: i.name })));
    console.log("需要新增的菜品:", addedItems.map(i => ({ id: i.id, name: i.name })));

    // 使用 orderDetail.value.id 获取当前订单 ID
    const orderId = orderDetail.value?.id;
    if (!orderId) {
      throw new Error("订单信息未加载");
    }

    let hasChanges = false;

    // 并行批量删除被移除的菜品
    if (removedItems.length > 0) {
      await Promise.all(
        removedItems.map(item => api.orderItems.delete(item.orderItemId, orderId))
      );
      showSuccess(`成功删除 ${removedItems.length} 个菜品`);
      hasChanges = true;
    }

    // 并行批量更新已修改的菜品
    if (modifiedItems.length > 0) {
      await Promise.all(
        modifiedItems.map(item => api.orderItems.update(item.orderItemId, orderId, {
          quantity: item.quantity,
          remark: item.remark || "",
          weight: item.weight || null,
        }))
      );
      showSuccess(`成功更新 ${modifiedItems.length} 个菜品`);
      hasChanges = true;
    }

    // 并行批量添加新选中的菜品
    if (addedItems.length > 0) {
      console.log("需要添加的菜品详情:", addedItems.map(i => ({ dishId: i.id, name: i.name, quantity: i.quantity, weight: i.weight })));

      await Promise.all(
        addedItems.map(item => api.orderItems.create(orderId, {
          dishId: item.id,
          quantity: item.quantity,
          remark: item.remark || "",
          weight: item.weight || null,
        }))
      );

      if (removedItems.length === 0 && modifiedItems.length === 0) {
        showSuccess(`成功添加 ${addedItems.length} 个菜品`);
      } else {
        showSuccess(`已删除 ${removedItems.length} 个菜品，已更新 ${modifiedItems.length} 个菜品，已添加 ${addedItems.length} 个菜品`);
      }
      hasChanges = true;
    }

    if (!hasChanges) {
      showInfo("没有菜品变更");
    }

    // 隐藏弹窗
    hideModifyModal();

    // 通知父组件订单已更新，由 WebSocket 触发自动刷新
    emit("orderCancelled", props.orderId);
    
    // 不立即调用 loadOrderDetail，等待 WebSocket 触发自动刷新
  } catch (error) {
    console.error("修改菜品失败:", error);
    showError("修改菜品失败：" + (error.message || "操作失败"));
  } finally {
    isModifying.value = false;
  }
};

// 编辑备注相关方法
const showEditRemarkModal = () => {
  console.log("🔍 [调试] 点击编辑备注按钮");
  console.log("🔍 [调试] orderDetail:", orderDetail.value);

  if (!orderDetail.value) {
    console.error("❌ [调试] orderDetail 为空！");
    return;
  }

  // 初始化备注表单
  editRemarkForm.value = {
    remark: orderDetail.value.remark || "",
  };

  console.log("🔍 [调试] editRemarkForm:", editRemarkForm.value);
  console.log("🔍 [调试] 准备打开弹窗，当前 showEditRemarkModalVisible:", showEditRemarkModalVisible.value);

  showEditRemarkModalVisible.value = true;

  console.log("🔍 [调试] 弹窗状态已更新:", showEditRemarkModalVisible.value);
};

const hideEditRemarkModal = () => {
  showEditRemarkModalVisible.value = false;
};

const confirmEditRemark = async () => {
  if (isEditingRemark.value) return;

  try {
    isEditingRemark.value = true;

    // 确保 orderId 是数字类型
    const orderId = parseInt(props.orderId);
    if (isNaN(orderId)) {
      throw new Error("无效的订单 ID");
    }

    // 准备更新数据
    const updateData = {
      remark: editRemarkForm.value.remark?.trim() || null,
    };

    const result = await OrderService.updateOrder(orderId, updateData);

    if (result.success) {
      // 隐藏弹窗
      hideEditRemarkModal();

      // 通知父组件订单已更新（可选）
      emit("orderCancelled", orderId);

      // 显示成功提示
      showSuccess("订单备注更新成功");
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("更新订单备注失败:", error);
    showError("更新订单备注失败：" + (error.message || "未知错误"));
  } finally {
    isEditingRemark.value = false;
  }
};
</script>
