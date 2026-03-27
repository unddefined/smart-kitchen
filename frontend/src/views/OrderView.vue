<template>
   <div class="flex flex-col h-full bg-gray-100 p-3 overflow-y-auto">
      <!-- 加载状态 -->
      <LoadingSpinner v-if="loading" message="正在加载订单详情..." size="lg" />

      <!-- 错误状态 -->
      <div v-else-if="error" class="flex flex-col items-center justify-center h-full p-5 text-center">
         <div class="text-5xl mb-4">⚠️</div>
         <p class="text-gray-600 text-base mb-5">{{ error }}</p>
         <button
            @click="loadOrderDetail"
            class="px-6 py-3 bg-blue-500 text-white rounded-lg text-base cursor-pointer transition-all duration-200 hover:bg-blue-600 hover:-translate-y-0.5"
         >
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
            <div class="flex justify-between items-center cursor-pointer select-none" @click="isServedCollapsed = !isServedCollapsed">
               <h3 class="text-lg font-medium text-gray-800">已出菜品</h3>
               <span class="text-sm text-gray-600">
                  {{ isServedCollapsed ? "展开" : "收起" }}
               </span>
            </div>
            <div class="gap-3 sm:columns-2 md:columns-3 lg:columns-4">
               <DishCard v-show="!isServedCollapsed" v-for="dish in servedDishes" :key="dish.id" :dish="dish" @click="handleDishClick" />
            </div>
         </div>

         <!-- 待上菜品 -->
         <div class="bg-white rounded-xl p-3 shadow-md">
            <h3 class="text-lg font-medium text-gray-800 mb-2">待上菜品</h3>
            <div class="gap-3 sm:columns-2 md:columns-3 lg:columns-4">
               <DishCard
                  v-for="dish in pendingDishes"
                  :key="dish.id"
                  :dish="dish"
                  :priority-class="getDishPriorityClass(dish.priority || 0)"
                  :status-text="getOrderItemStatusText(dish.status)"
                  @click="handleDishClick"
               />
            </div>
         </div>

         <!-- 操作按钮 -->
         <div class="flex gap-2 mt-5 justify-between w-full">
            <button
               @click="showEditRemarkModal"
               class="flex-1 py-2 px-3 border border-green-300 rounded-lg bg-green-50 text-green-700 text-base cursor-pointer transition-all duration-200 hover:bg-green-100 hover:border-green-400 whitespace-nowrap"
            >
               编辑备注
            </button>
            <button
               @click="showModifyDishesModal"
               class="flex-1 py-2 px-3 border border-purple-300 rounded-lg bg-purple-50 text-purple-700 text-base cursor-pointer transition-all duration-200 hover:bg-purple-100 hover:border-purple-400 whitespace-nowrap"
            >
               修改菜品
            </button>
         </div>
         <div class="flex gap-2 mt-3 justify-between w-full">
            <button
               @click="showEditModal"
               class="flex-1 py-2 px-3 border border-blue-300 rounded-lg bg-blue-50 text-blue-700 text-base cursor-pointer transition-all duration-200 hover:bg-blue-100 hover:border-blue-400 whitespace-nowrap"
            >
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
            ]"
         >
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
            ]"
         >
            取消订单
         </button>
         <!-- 删除按钮 - 仅对已取消的订单显示 -->
         <button
            @click="showDeleteConfirm"
            v-if="orderDetail?.status === 'cancelled'"
            class="flex-1 py-2 px-3 mt-3 w-full border border-red-300 bg-red-50 text-red-700 rounded-lg text-base cursor-pointer transition-all duration-200 hover:bg-red-100 hover:border-red-400 whitespace-nowrap"
         >
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
         @confirm="confirmCancelOrder"
      />

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
         @confirm="confirmCompleteOrder"
      />

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
         @confirm="confirmDeleteOrder"
      />
      <!-- 编辑订单信息弹窗 - 使用独立组件 -->
      <OrderEditorModal v-model="showEditModalVisible" :order-detail="orderDetail" @success="handleEditSuccess" @error="handleEditError" />

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
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  ></textarea>
               </div>
            </div>

            <div class="flex gap-3 mt-6">
               <button
                  @click="hideEditRemarkModal"
                  class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50"
               >
                  取消
               </button>
               <button
                  @click="confirmEditRemark"
                  :disabled="isEditingRemark"
                  :class="[
                     'flex-1 py-3 px-4 rounded-lg text-white text-base cursor-pointer transition-all duration-200',
                     isEditingRemark ? 'bg-green-300 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600 hover:-translate-y-0.5',
                  ]"
               >
                  {{ isEditingRemark ? "保存中..." : "保存备注" }}
               </button>
            </div>
         </div>
      </div>

      <!-- 修改菜品弹窗 - 使用独立组件 -->
      <DishModifierModal v-model="showModifyModalVisible" :order-detail="orderDetail" @success="handleModifySuccess" @error="handleModifyError" />
   </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { OrderService } from "@/services";
import ConfirmModal from "@/components/ConfirmModal.vue";
import DishCard from "@/components/DishCard.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import { useToast } from "@/composables/useToast";
import { useDishModifier } from "@/composables/useDishModifier";
import { useDishManager } from "@/composables/useDishManager";
import { useOrderEditor } from "@/composables/useOrderEditor";
import OrderEditorModal from "@/components/OrderEditorModal.vue";
import DishModifierModal from "@/components/DishModifierModal.vue";
import { getPriorityClass } from "@/constants/priority";
import { useWebSocket } from "@/utils/websocket";

// 使用 toast 组合式函数（使用全局注入）
const { showSuccess, showError, showInfo } = useToast();

// WebSocket 监听
const ws = useWebSocket();
let orderUpdatedUnsubscribe = null;
let itemUpdatedUnsubscribe = null;
let itemDeletedUnsubscribe = null;

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
const isEditingRemark = ref(false);
const isServedCollapsed = ref(false); // 已出菜品折叠状态

// DishSelector 组件引用 - 已移除，现在由 DishModifierModal 内部管理

// 使用订单编辑器 Composable
const { showEditModalVisible, showEditModal } = useOrderEditor({
   onSuccess: (orderId) => {
      emit("orderCancelled", orderId);
   },
});

// 使用菜品修改器 Composable
const dishModifier = useDishModifier({
   onSuccess: ({ orderId }) => {
      emit("orderCancelled", orderId);
   },
});

// 解构出需要的状态
const { showModifyModalVisible, showModifyModal } = dishModifier;

// 编辑备注表单
const editRemarkForm = ref({
   remark: "",
});

// 编辑备注弹窗状态
const showEditRemarkModalVisible = ref(false);

// 编辑订单信息回调函数
const handleEditSuccess = (orderId) => {
   console.log("✅ 编辑订单成功:", orderId);
   loadOrderDetail();
};

const handleEditError = (error) => {
   console.error("❌ 编辑订单错误:", error);
};

// 计算属性 - 判断取消按钮是否禁用
const isCancelButtonDisabled = computed(() => {
   if (!orderDetail.value) return true;
   // 已完成或已取消的订单不能再次取消
   return orderDetail.value.status === "done" || orderDetail.value.status === "cancelled";
});

// 计算属性 - 判断是否可以完成订单，只有出餐中或催菜状态的订单才能完成
const canCompleteOrder = computed(() => {
   if (!orderDetail.value) return false;
   return orderDetail.value.status === "serving" || orderDetail.value.status === "urged";
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
      if (b.priority !== a.priority) return b.priority - a.priority;

      return (a.dish?.name || "").localeCompare(b.dish?.name || "");
   });
});

// 方法
const loadOrderDetail = async () => {
   try {
      loading.value = true;
      error.value = null;

      // 确保 orderId 是数字类型
      const orderId = parseInt(props.orderId);
      if (isNaN(orderId)) throw new Error("无效的订单 ID");

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

   // 根据 MVP 文档，优先级为 0 的菜品（未起）不能直接上菜
   if (dish.priority === 0 && dish.status === "ready") {
      showError(`还未起菜，无法上菜。`);
      return;
   }

   // 使用 useDishManager 提供的通用方法处理菜品状态变更
   const dishManager = useDishManager({
      onStatusChange: (dish, newStatus, newPriority) => {
         console.log("状态变更:", dish.name, newStatus, newPriority);
         loadOrderDetail();
      },
      onPriorityAdjust: (dish, quantity, priority) => {
         console.log("优先级调整:", dish.name, quantity, priority);
      },
   });

   const { handleDishClick: handleDishClickBase } = dishManager;
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
      if (isNaN(orderId)) throw new Error("无效的订单 ID");

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
      if (isNaN(orderId)) throw new Error("无效的订单 ID");

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
      if (isNaN(orderId)) throw new Error("无效的订单 ID");

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

// 获取菜品优先级样式类名
const getDishPriorityClass = (priority) => {
   return getPriorityClass(priority);
};

// 监听 orderId 变化，重新加载数据
watch(
   () => props.orderId,
   (newId, oldId) => {
      console.log(`🔍 orderId 变化：${oldId} → ${newId}`);
      if (newId) loadOrderDetail();
   },
   { immediate: true },
);

// WebSocket 事件监听 - 监听当前订单的所有更新
const setupWebSocketListeners = () => {
   const currentOrderId = parseInt(props.orderId);

   // 监听订单更新事件（起菜、催菜、暂停等）
   orderUpdatedUnsubscribe = ws.listen("order-updated", (data) => {
      const orderId = data?.id || data?.data?.id;
      if (orderId === currentOrderId) {
         loadOrderDetail();
      }
   });

   // 监听订单项更新事件（修改菜品）
   itemUpdatedUnsubscribe = ws.listen("item-updated", (data) => {
      if (data && data.orderId === currentOrderId) {
         loadOrderDetail();
      }
   });

   // 监听订单项删除事件
   itemDeletedUnsubscribe = ws.listen("item-deleted", (data) => {
      if (data && data.orderId === currentOrderId) {
         loadOrderDetail();
      }
   });
};

// 清理 WebSocket 监听器
const cleanupWebSocketListeners = () => {
   if (orderUpdatedUnsubscribe) {
      orderUpdatedUnsubscribe();
      orderUpdatedUnsubscribe = null;
   }
   if (itemUpdatedUnsubscribe) {
      itemUpdatedUnsubscribe();
      itemUpdatedUnsubscribe = null;
   }
   if (itemDeletedUnsubscribe) {
      itemDeletedUnsubscribe();
      itemDeletedUnsubscribe = null;
   }
};

// 组件挂载时设置 WebSocket 监听
watch(
   () => props.orderId,
   (newId) => {
      // 清理旧的监听
      cleanupWebSocketListeners();
      // 设置新的监听
      if (newId) {
         setupWebSocketListeners();
      }
   },
   { immediate: true },
);

// 处理修改菜品错误
const handleModifyError = ({ error }) => {
   console.error("❌ 修改菜品错误:", error);
};

// 编辑备注相关方法
const showEditRemarkModal = () => {
   if (!orderDetail.value) {
      console.error("❌ [调试] orderDetail 为空！");
      return;
   }

   // 初始化备注表单
   editRemarkForm.value = {
      remark: orderDetail.value.remark || "",
   };

   showEditRemarkModalVisible.value = true;
};

// 显示修改菜品弹窗
const showModifyDishesModal = () => {
   if (!orderDetail.value) {
      console.error("❌ [调试] orderDetail 为空！");
      return;
   }

   showModifyModal(orderDetail.value);
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
