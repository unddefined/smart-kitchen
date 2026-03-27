<template>
   <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4" @click.stop>
         <div class="text-center mb-6">
            <h3 class="text-xl font-bold text-gray-800 mb-2">编辑订单信息</h3>
            <p v-if="orderDetail" class="text-sm text-gray-600">台号：{{ orderDetail.hallNumber }}</p>
         </div>

         <div class="space-y-4">
            <!-- 台号输入 -->
            <div class="flex space-x-4 items-center">
               <label class="text-xl font-medium text-gray-700 whitespace-nowrap">台号</label>
               <input
                  v-model="localEditForm.hallNumber"
                  type="text"
                  placeholder="请输入台号"
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
            </div>

            <!-- 人数和桌数在同一行 -->
            <div class="flex space-x-4">
               <div class="flex items-center space-x-3 flex-1">
                  <label class="text-xl whitespace-nowrap">人数</label>
                  <input
                     v-model.number="localEditForm.peopleCount"
                     type="number"
                     min="1"
                     placeholder="人数"
                     class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label class="text-xl whitespace-nowrap">桌数</label>
                  <input
                     v-model.number="localEditForm.tableCount"
                     type="number"
                     min="1"
                     placeholder="桌数"
                     class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
               </div>
            </div>

            <!-- 用餐时间输入 -->
            <div class="flex space-x-1 items-center">
               <label class="text-xl font-medium text-gray-700 whitespace-nowrap">用餐时间</label>
               <div class="flex space-x-2 items-center flex-nowrap">
                  <input
                     v-model="localMealDate"
                     type="date"
                     class="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[160px]"
                  />
                  <span class="flex rounded overflow-hidden">
                     <button
                        :class="[
                           'px-3 py-1 border-r border-gray-300 text-xl cursor-pointer transition-all duration-200',
                           localMealTime === '午餐' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100',
                        ]"
                        @click="localMealTime = '午餐'"
                     >
                        午
                     </button>
                     <button
                        :class="[
                           'px-3 py-1 border-gray-300 text-xl cursor-pointer transition-all duration-200',
                           localMealTime === '晚餐' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100',
                        ]"
                        @click="localMealTime = '晚餐'"
                     >
                        晚
                     </button>
                  </span>
               </div>
            </div>

            <!-- 状态选择 -->
            <div>
               <label class="block text-sm font-medium text-gray-700 mb-2">订单状态</label>
               <select
                  v-model="localEditForm.status"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
               >
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
               @click="handleCancel"
               class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50"
            >
               取消
            </button>
            <button
               @click="handleSubmit"
               :disabled="isLoading"
               :class="[
                  'flex-1 py-3 px-4 rounded-lg text-white text-base cursor-pointer transition-all duration-200',
                  isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5',
               ]"
            >
               {{ isLoading ? "保存中..." : "保存修改" }}
            </button>
         </div>
      </div>
   </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from "vue";
import { useOrderEditor } from "@/composables/useOrderEditor";

// Props
const props = defineProps({
   modelValue: {
      type: Boolean,
      required: true,
   },
   orderDetail: {
      type: Object,
      default: null,
   },
});

// Emits
const emit = defineEmits(["update:modelValue", "success", "error"]);

// 使用订单编辑器 Composable
const { showEditModalVisible, isEditing, editForm, mealDate, mealTime, showEditModal, hideEditModal, confirmEditOrder, resetForm } = useOrderEditor({
   onSuccess: (orderId) => {
      emit("success", { orderId });
   },
   onError: (error) => {
      emit("error", { error });
   },
});

// 本地副本
const localEditForm = reactive({ ...editForm });
const localMealDate = ref("");
const localMealTime = ref("");
const isLoading = ref(false);

// 监听弹窗显示状态
watch(
   () => props.modelValue,
   (newValue) => {
      if (newValue && props.orderDetail) {
         initializeForm();
      }
   },
   { immediate: true },
);

// 同步内部状态到外部
watch(showEditModalVisible, (val) => {
   emit("update:modelValue", val);
});

// 初始化表单
const initializeForm = () => {
   if (props.orderDetail) {
      showEditModal(props.orderDetail);

      // 同步到本地副本
      localEditForm.hallNumber = editForm.hallNumber;
      localEditForm.peopleCount = editForm.peopleCount;
      localEditForm.tableCount = editForm.tableCount;
      localEditForm.status = editForm.status;
      localMealDate.value = mealDate.value;
      localMealTime.value = mealTime.value;
   }
};

// 处理取消
const handleCancel = () => {
   hideEditModal();
   resetForm();
};

// 处理提交
const handleSubmit = async () => {
   if (!props.orderDetail?.id) return;

   isLoading.value = true;
   try {
      await confirmEditOrder(props.orderDetail.id, props.orderDetail);
   } finally {
      isLoading.value = false;
   }
};
</script>
