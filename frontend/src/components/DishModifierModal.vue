<template>
   <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" @click.stop>
         <div class="p-4 border-b sticky top-0 bg-white rounded-t-xl z-10">
            <div class="flex items-center justify-between">
               <h3 class="text-xl font-bold text-gray-800">修改菜品</h3>
               <button @click="handleCancel" class="text-gray-400 hover:text-gray-600">
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
               <button @click="loadDishes" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                  重试
               </button>
            </div>

            <!-- 菜品选择器 -->
            <div v-else>
               <DishSelector
                  ref="dishSelectorRef"
                  :dishes="availableDishes"
                  :selected-dishes="localSelectedItems"
                  :served-dish-ids="servedDishIds"
                  mode="edit"
                  title="菜品库"
                  :show-add-button="false"
                  :show-weight-input="true"
                  :readonly="false"
                  @update:selected-dishes="handleLocalSelectedItemsChange"
                  @dish-click="handleDishClick"
                  @dish-edit="handleDishEdit"
               />
            </div>
         </div>

         <div class="p-4 border-t bg-gray-50 flex gap-3 sticky bottom-0">
            <button
               @click="handleCancel"
               class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
               取消
            </button>
            <button
               @click="handleSubmit"
               :disabled="isLoading"
               :class="[
                  'flex-1 py-3 rounded-lg text-white font-medium transition-all duration-200',
                  isLoading ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-500 hover:bg-purple-600 hover:-translate-y-0.5',
               ]"
            >
               {{ isLoading ? "保存中..." : "保存修改" }}
            </button>
         </div>
      </div>
   </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import DishSelector from "@/components/DishSelector.vue";
import { useDishModifier } from "@/composables/useDishModifier";
import { useDishLoader } from "@/composables/useDishLoader";

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

// 使用菜品加载 Composable
const { dishes: availableDishes, loading: loadingDishes, error: loadDishesError, loadDishes, resetDishes } = useDishLoader();

// 使用菜品修改器 Composable
const dishModifier = useDishModifier({
   onSuccess: ({ orderId }) => {
      emit("success", { orderId });
   },
   onError: (error) => {
      emit("error", { error });
   },
});

// 解构状态和方法
const {
   showModifyModalVisible,
   isModifying,
   selectedOrderItems,
   originalOrderItems,
   showModifyModal,
   hideModifyModal,
   handleSelectedDishesChange,
   confirmModifyDishes,
} = dishModifier;

// 本地副本
const localSelectedItems = ref([]);
const isLoading = ref(false);
const dishSelectorRef = ref(null);

// 计算已上菜的菜品 ID 列表（用于禁用这些菜品）
const servedDishIds = computed(() => {
   if (!props.orderDetail?.items) return [];
   return props.orderDetail.items.filter((item) => item.status === "served").map((item) => item.dishId);
});

// 监听弹窗显示状态
watch(
   () => props.modelValue,
   async (newValue) => {
      if (newValue && props.orderDetail) {
         await initializeModal();
      }
   },
   { immediate: true },
);

// 同步内部状态到外部
watch(showModifyModalVisible, (val) => {
   emit("update:modelValue", val);
});

// 初始化弹窗
const initializeModal = async () => {
   if (props.orderDetail) {
      showModifyModal(props.orderDetail);

      // 加载菜品数据
      await loadDishes();

      // 等待下一个 tick，确保 DishSelector 组件已经渲染
      await nextTick();

      // 同步到本地副本
      localSelectedItems.value = JSON.parse(JSON.stringify(selectedOrderItems.value));

      // 保存原始快照
      dishModifier.saveOriginalSnapshot();
   }
};

// 处理本地选中菜品的变化
const handleLocalSelectedItemsChange = (newSelectedDishes) => {
   localSelectedItems.value = newSelectedDishes;
   handleSelectedDishesChange(newSelectedDishes);
};

// 处理菜品点击
const handleDishClick = (dish) => {
   console.log("点击菜品:", dish);
};

// 处理菜品编辑
const handleDishEdit = (dish) => {
   console.log("编辑菜品:", dish);
};

// 处理取消
const handleCancel = () => {
   hideModifyModal();
   resetDishes();
};

// 处理提交
const handleSubmit = async () => {
   if (!props.orderDetail) return;

   isLoading.value = true;
   try {
      await confirmModifyDishes(props.orderDetail);
   } finally {
      isLoading.value = false;
   }
};
</script>
