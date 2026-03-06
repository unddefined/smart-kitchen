<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
    <div class="bg-white w-full rounded-t-2xl max-h-[90vh] flex flex-col">
      <!-- 头部 -->
      <div class="p-4 border-b flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">
          {{ mode === "add" ? "加菜" : "退菜" }}
        </h2>
        <button @click="closeModal" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
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
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
              ]">
              {{ order.hallNumber }}
            </button>
          </div>
        </div>

        <!-- 已选订单信息 -->
        <div v-if="selectedOrder" class="bg-blue-50 rounded-lg p-4">
          <h3 class="font-medium text-blue-900 mb-2">当前订单信息</h3>
          <div class="grid grid-cols-2 gap-2 text-base">
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

        <!-- 菜品选择区域 - 使用新的 DishSelector 组件 -->
        <div v-if="selectedOrder">
          <!-- 加菜模式 -->
          <DishSelector
            v-if="mode === 'add'"
            :dishes="availableDishesList"
            :selectedDishes="availableSelectedDishes"
            mode="add"
            title="选择要添加的菜品"
            :showAddButton="true"
            :loading="dishesLoading"
            :error="dishesError"
            :showEditModal="showEditDishModal"
            :editingDish="currentEditingDish"
            @update:selectedDishes="availableSelectedDishes = $event"
            @dish-click="handleDishClick"
            @add-new="showAddNewDish = true"
            @update:showEditModal="showEditDishModal = $event"
            @delete-dish="handleDeleteDishFromDb" />

          <!-- 退菜模式 -->
          <DishSelector
            v-else
            :dishes="orderedDishesList"
            :selectedDishes="orderedSelectedDishes"
            mode="remove"
            title="选择要退的菜品"
            :loading="dishesLoading"
            :error="dishesError"
            :showEditModal="showEditDishModal"
            :editingDish="currentEditingDish"
            @update:selectedDishes="orderedSelectedDishes = $event"
            @dish-click="handleDishClick"
            @update:showEditModal="showEditDishModal = $event"
            @delete-dish="handleDeleteDishFromDb" />
        </div>
      </div>

      <!-- 底部按钮区域 -->
      <div class="p-4 border-t bg-gray-50">
        <div class="flex space-x-3">
          <button
            @click="cancel"
            class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors">
            取消
          </button>
          <button
            @click="submit"
            :disabled="!canSubmit"
            :class="[
              'flex-1 py-3 rounded-lg font-medium transition-colors',
              canSubmit
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed',
            ]">
            确认{{ mode === "add" ? "加菜" : "退菜" }}
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
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">份量</label>
            <input
              v-model.number="newDish.quantity"
              type="number"
              min="1"
              placeholder="请输入份量"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">重量</label>
            <WeightInput ref="newDishWeightInputRef" v-model="newDish.weightValue" v-model:unit="newDish.weightUnit" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
          <textarea
            v-model="newDish.remark"
            rows="3"
            placeholder="特殊要求..."
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">是否按人头计数 *</label>
          <div class="flex space-x-4">
            <label class="flex items-center">
              <input v-model="newDish.countable" type="radio" :value="true" class="mr-2" />
              是
            </label>
            <label class="flex items-center">
              <input v-model="newDish.countable" type="radio" :value="false" class="mr-2" />
              否
            </label>
          </div>
        </div>
      </div>

      <div class="p-4 border-t bg-gray-50 flex space-x-3">
        <button
          @click="closeAddNewDish"
          class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors">
          取消
        </button>
        <button
          @click="confirmAddNewDish"
          :disabled="!newDish.name"
          :class="[
            'flex-1 py-3 rounded-lg font-medium transition-colors',
            newDish.name
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed',
          ]">
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { DishService, OrderService } from "@/services";
import DishSelector from "@/components/DishSelector.vue";
import WeightInput from "@/components/WeightInput.vue";
import { useToast } from "@/composables/useToast";

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: "add", // 'add' 或 'remove'
    validator: (value) => ["add", "remove"].includes(value),
  },
  orders: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits(["update:visible", "submit", "close"]);

// 状态
const selectedOrder = ref(null);
const orderedSelectedDishes = ref([]); // 已点菜品的选择状态
const availableSelectedDishes = ref([]); // 菜品库的选择状态
const dishesLoading = ref(false); // 菜品加载状态
const dishesError = ref(null); // 菜品加载错误

// 编辑弹窗状态
const showEditDishModal = ref(false);
const currentEditingDish = ref(null);

// 弹窗状态
const showAddNewDish = ref(false);

// Toast 提示（使用全局注入）
const { showSuccess, showError } = useToast();

// 新增菜品表单
const newDish = ref({
  name: "",
  quantity: 1,
  weightValue: null,
  weightUnit: "g",
  remark: "",
  countable: false,
});

// 新增菜品表单重量输入 ref
const newDishWeightInputRef = ref(null);

// 数据
const allDishes = ref([]);

// 计算属性 - 已点菜品列表
const orderedDishesList = computed(() => {
  if (!selectedOrder.value) return [];
  // 这里应该从订单中获取已点的菜品
  // 暂时返回模拟数据
  return selectedOrder.value.items || [];
});

// 计算属性 - 可选菜品列表（排除已点的）
const availableDishesList = computed(() => {
  const orderedIds = orderedDishesList.value.map((d) => d.id);
  return allDishes.value.filter((dish) => !orderedIds.includes(dish.id));
});

const canSubmit = computed(() => {
  return (
    selectedOrder.value &&
    (orderedSelectedDishes.value.length > 0 ||
      availableSelectedDishes.value.length > 0)
  );
});

// 方法
const closeModal = () => {
  emit("update:visible", false);
  emit("close");
};

const selectOrder = (order) => {
  selectedOrder.value = order;
  // 重置选择状态
  orderedSelectedDishes.value = [];
  availableSelectedDishes.value = [];
};

const closeAddNewDish = () => {
  showAddNewDish.value = false;
  newDish.value = { 
    name: "", 
    quantity: 1,
    weightValue: null,
    weightUnit: "g",
    remark: "",
    countable: false,
  };
};

const confirmAddNewDish = async () => {
  if (!newDish.value.name) return;

  try {
    // 使用组件暴露的 weightString 计算属性
    const weightString = newDishWeightInputRef.value?.weightString || "";

    // 创建新菜品 - 包含所有字段（份量、重量、备注都是选填）
    const result = await DishService.createDish({
      name: newDish.value.name,
      stationId: 1,
      categoryId: 1,
      countable: newDish.value.countable,
      defaultQuantity: newDish.value.quantity || 1,
      defaultWeight: weightString || null,
      defaultRemark: newDish.value.remark || "",
    });

    if (result.success) {
      // 添加到菜品库
      allDishes.value.push(result.data);
      closeAddNewDish();
    }
  } catch (error) {
    console.error("创建菜品失败:", error);
  }
};

const cancel = () => {
  resetForm();
  closeModal();
};

// 处理菜品点击，打开编辑弹窗
const handleDishClick = (dish) => {
  currentEditingDish.value = dish;
  showEditDishModal.value = true;
};

// 从数据库删除菜品
const handleDeleteDishFromDb = async (dishId) => {
  try {
    const result = await DishService.deleteDish(dishId);
    
    if (result.success) {
      // 根据当前模式从对应的列表中移除该菜品
      if (mode === "add") {
        availableSelectedDishes.value = availableSelectedDishes.value.filter(d => d.id !== dishId);
      } else {
        orderedSelectedDishes.value = orderedSelectedDishes.value.filter(d => d.id !== dishId);
      }
      
      // 刷新菜品列表
      await loadDishes();
      
      // 关闭编辑弹窗
      showEditDishModal.value = false;
      
      showSuccess("菜品已删除");
    } else {
      showError("删除失败：" + result.message);
    }
  } catch (error) {
    console.error("删除菜品失败:", error);
    showError("删除菜品时发生错误");
  }
};

const submit = async () => {
  if (!canSubmit.value) return;

  try {
    const changes = [];

    // 处理选中的菜品（使用 selectedDishes）
    selectedDishes.value.forEach((dish) => {
      if (props.mode === "add") {
        changes.push({
          action: "add",
          dishId: dish.id,
          quantity: dish.quantity,
          orderId: selectedOrder.value.id,
        });
      } else {
        changes.push({
          action: "remove",
          dishId: dish.id,
          quantity: dish.quantity,
          orderId: selectedOrder.value.id,
        });
      }
    });

    // 执行变更
    for (const change of changes) {
      if (change.action === "add") {
        await OrderService.addDishToOrder(change.orderId, {
          dishId: change.dishId,
          quantity: change.quantity,
        });
      } else {
        // 退菜逻辑 - 这里需要根据实际 API 调整
        await OrderService.removeDishFromOrder(change.orderId, change.dishId);
      }
    }

    emit("submit", {
      orderId: selectedOrder.value.id,
      changes,
      mode: props.mode,
    });

    resetForm();
    closeModal();
  } catch (error) {
    console.error("操作失败:", error);
  }
};

const resetForm = () => {
  selectedOrder.value = null;
  orderedSelectedDishes.value = [];
  availableSelectedDishes.value = [];
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString("zh-CN");
};

// 初始化加载菜品数据
const loadDishes = async () => {
  dishesLoading.value = true;
  dishesError.value = null;
  try {
    allDishes.value = await DishService.getAllDishesInServingOrder();
  } catch (error) {
    console.error("加载菜品数据失败:", error);
    dishesError.value = "加载菜品失败，请稍后重试";
    // 回退到字母排序
    try {
      allDishes.value = await DishService.getAllDishes();
    } catch (fallbackError) {
      allDishes.value = [];
    }
  } finally {
    dishesLoading.value = false;
  }
};

// 监听 visible 变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      loadDishes();
    } else {
      resetForm();
    }
  },
);
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
