<template>
  <div class="dish-selector">
    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-4">
      <div class="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-gray-500 mt-2">加载菜品中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="text-center py-4">
      <p class="text-red-500">{{ error }}</p>
      <button @click="$emit('retry')" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">重试</button>
    </div>

    <!-- 菜品选择区域 -->
    <div v-else>
      <!-- 头部操作栏 -->
      <div v-if="showAddButton" class="flex items-center justify-between mb-3">
        <label class="block text-lg font-medium text-gray-700">{{ title }}</label>
        <div class="flex items-center gap-2">
          <button v-if="showAddButton" @click="$emit('add-new')" class="text-blue-500 hover:text-blue-700 text-lg font-medium transition-colors">
            + 新增菜品
          </button>
        </div>
      </div>

      <!-- 无菜品提示 -->
      <div v-if="dishes.length === 0" class="text-center py-4">
        <p class="text-gray-500">暂无菜品</p>
      </div>

      <!-- 菜品按钮网格 -->
      <div class="flex flex-wrap gap-1">
        <button
          v-for="dish in sortedDishes"
          :key="dish.id"
          @click="handleDishClick(dish)"
          :class="['p-1 rounded-lg border-2 text-xl font-medium transition-all relative', getDishClasses(dish)]">
          {{ dish.name }}
          <!-- 数量徽章 -->
          <span
            v-if="getSelectedQuantity(dish.id) > 0"
            :class="['absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold', getBadgeClass(dish)]">
            {{ getSelectedQuantity(dish.id) }}
          </span>
        </button>
      </div>
    </div>

    <!-- 菜品编辑弹窗（组件内部管理） -->
    <div
      v-if="showLocalEditModal && currentDish"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeEditModal">
      <div class="bg-white rounded-xl w-full max-w-md" @click.stop>
        <div class="p-4 border-b">
          <h3 class="text-lg font-bold text-gray-900">编辑菜品</h3>
        </div>

        <div class="p-4 space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-gray-900 font-medium text-xl">
              {{ currentDish?.name }}
            </div>
            <button
              @click="handleDeleteDish"
              class="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors flex items-center space-x-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              <span>删除</span>
            </button>
          </div>

          <!-- 份量调整 -->
          <div class="flex justify-between items-start items-center">
            <label class=" text-xl font-medium text-gray-700 mb-2">份量</label>
            <div class="flex items-center space-x-3">
              <button
                @click="resetQuantity"
                class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors">
                清零
              </button>
              <button
                @click="decreaseQuantity"
                class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                </svg>
              </button>
              <span class="text-base font-bold w-12 text-center">{{ currentDish?.quantity || 1 }}</span>
              <button
                @click="increaseQuantity"
                class="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- 重量输入 -->
          <div v-if="showWeightInput && currentDish" class="flex justify-between items-start items-center">
            <label class=" text-xl font-medium text-gray-700 mb-2 whitespace-nowrap mr-3">重量</label>
            <WeightInput class="w-full" ref="weightInputRef" v-model="currentDish.weightValue" v-model:unit="currentDish.weightUnit" />
          </div>

          <!-- 备注输入 -->
          <div v-if="currentDish">
            <label class="block text-base font-medium text-gray-700 mb-2">备注</label>
            <textarea
              v-model="currentDish.remark"
              rows="3"
              placeholder="大份，少辣，去葱等备注信息"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>

        <div class="p-4 border-t bg-gray-50 flex space-x-3">
          <button @click="closeEditModal" class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors">
            取消
          </button>
          <button @click="confirmEdit" class="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
            确认
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import WeightInput from "@/components/WeightInput.vue";

// Props
const props = defineProps({
  // 外部传入的菜品列表（必填）- 已按上菜顺序排序
  dishes: {
    type: Array,
    required: true,
  },
  // 已选中的菜品列表
  selectedDishes: {
    type: Array,
    default: () => [],
  },
  // 使用模式：'add' 加菜 | 'remove' 退菜 | 'edit' 编辑 | 'select' 选择
  mode: {
    type: String,
    default: "select",
    validator: (value) => ["add", "remove", "edit", "select"].includes(value),
  },
  // 标题
  title: {
    type: String,
    default: "菜品选择",
  },
  // 是否显示新增按钮
  showAddButton: {
    type: Boolean,
    default: false,
  },
  // 是否显示重量输入
  showWeightInput: {
    type: Boolean,
    default: true,
  },
  // 只读模式（仅展示，不可交互）
  readonly: {
    type: Boolean,
    default: false,
  },
  // 加载状态
  loading: {
    type: Boolean,
    default: false,
  },
  // 错误信息
  error: {
    type: String,
    default: null,
  },
  // 已上菜的菜品 ID 列表（用于禁用这些菜品）
  servedDishIds: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits([
  "update:selectedDishes",
  "dish-click",
  "dish-edit",
  "add-new",
  "retry",
  "delete-dish", // 删除菜品事件
]);

// 暴露 selectedDishes 给父组件访问
defineExpose({
  selectedDishes: computed(() => props.selectedDishes),
});

// 本地状态
const currentDish = ref(null);
const weightInputRef = ref(null);
const showLocalEditModal = ref(false); // 本地管理编辑弹窗状态


// 计算属性 - 按分类排序后内部再按字母排序
const sortedDishes = computed(() => {
  if (!props.dishes || props.dishes.length === 0) {
    return [];
  }
  
  // 创建副本进行排序
  return [...props.dishes].sort((a, b) => {
    // 首先按分类的 displayOrder 排序
    // 注意：数据可能包含 category.displayOrder 或 categoryDisplayOrder 字段
    const categoryOrderA = a.category?.displayOrder ?? a.categoryDisplayOrder ?? Number.MAX_SAFE_INTEGER;
    const categoryOrderB = b.category?.displayOrder ?? b.categoryDisplayOrder ?? Number.MAX_SAFE_INTEGER;
    
    if (categoryOrderA !== categoryOrderB) {
      return categoryOrderA - categoryOrderB;
    }
    
    // 同一分类内按菜名字母顺序排序
    return (a.name || '').localeCompare(b.name || '', 'zh-CN');
  });
});

// 获取菜品样式类
const getDishClasses = (dish) => {
  // 检查是否为已上菜的菜品
  const isServed = props.servedDishIds.includes(dish.id);
  
  if (props.readonly || isServed) {
    return "border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed";
  }

  const isSelected = getSelectedQuantity(dish.id) > 0;

  switch (props.mode) {
    case "add":
    case "select":
      return isSelected
        ? "border-blue-500 bg-blue-50 text-blue-700 hover:border-blue-600"
        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300";

    case "remove":
      return isSelected
        ? "border-red-500 bg-red-50 text-red-700 hover:border-red-600"
        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300";

    case "edit":
      return isSelected
        ? "border-green-500 bg-green-50 text-green-700 hover:border-green-600"
        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300";

    default:
      return isSelected ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700";
  }
};

// 获取徽章样式类
const getBadgeClass = (dish) => {
  if (props.mode === "remove") {
    return "bg-red-500 text-white";
  }
  if (props.mode === "edit") {
    return "bg-green-500 text-white";
  }
  return "bg-blue-500 text-white";
};

// 获取选中数量
const getSelectedQuantity = (dishId) => {
  const selected = props.selectedDishes.find((d) => d.id === dishId);
  return selected ? selected.quantity : 0;
};

// 处理菜品点击
const handleDishClick = (dish) => {
  if (props.readonly) return;
  
  // 检查是否为已上菜的菜品，如果是则禁止点击
  const isServed = props.servedDishIds.includes(dish.id);
  if (isServed) {
    return; // 已上菜的菜品不可点击
  }

  const selected = props.selectedDishes.find((d) => d.id === dish.id);

  if (selected) {
    // 已选中，设置当前编辑的菜品并通知父组件打开编辑弹窗
    currentDish.value = {
      ...selected,
      quantity: selected.quantity || 1, // 确保 quantity 有默认值
      weightUnit: selected.weightUnit || "两", // 确保 weightUnit 有效
    };
    
    // 根据模式决定触发哪个事件
    if (props.mode === "edit" || props.mode === "select") {
      // 编辑模式和选择模式下都触发 dish-edit 事件打开编辑弹窗
      emit("dish-edit", currentDish.value);
      // 同时显示本地编辑弹窗
      showLocalEditModal.value = true;
    } else {
      // 其他模式下触发 dish-click 事件
      emit("dish-click", dish);
    }
  } else {
    // 未选中，添加到选中列表（但不打开弹窗）
    const newSelectedDish = {
      ...dish,
      quantity: 1,
      weightValue: null,
      weightUnit: "两", // 使用有效的默认单位
      remark: "",
    };
    emit("update:selectedDishes", [...props.selectedDishes, newSelectedDish]);
    // 注意：这里不触发 dish-click 事件，避免父组件打开弹窗
  }
};

// 增加数量
const increaseQuantity = () => {
  if (!currentDish.value) return;
  currentDish.value.quantity = Number(currentDish.value.quantity) || 1;
  currentDish.value.quantity++;
};

// 减少数量
const decreaseQuantity = () => {
  if (!currentDish.value) return;
  currentDish.value.quantity = Number(currentDish.value.quantity) || 1;
  if (currentDish.value.quantity > 1) {
    currentDish.value.quantity--;
  } else {
    // 数量为 0 时移除
    removeSelectedDish(currentDish.value.id);
    closeEditModal();
  }
};

// 重置数量（移除）
const resetQuantity = () => {
  if (!currentDish.value) return;
  removeSelectedDish(currentDish.value.id);
  closeEditModal();
};

// 删除菜品
const handleDeleteDish = () => {
  if (!currentDish.value) return;

  // 显示确认对话框
  if (confirm(`确定要从数据库中删除菜品"${currentDish.value.name}"吗？此操作不可恢复！`)) {
    // 通知父组件删除菜品
    emit("delete-dish", currentDish.value.id);
  }
};

// 移除选中的菜品
const removeSelectedDish = (dishId) => {
  const index = props.selectedDishes.findIndex((d) => d.id === dishId);
  if (index >= 0) {
    const newSelected = [...props.selectedDishes];
    newSelected.splice(index, 1);
    emit("update:selectedDishes", newSelected);
  }
};

// 关闭编辑弹窗
const closeEditModal = () => {
  showLocalEditModal.value = false;
  // 注意：不设置 currentDish.value = null，保留当前编辑的菜品信息
};

// 确认编辑
const confirmEdit = () => {
  if (!currentDish.value) return;

  console.log('=== confirmEdit 被调用 ===');
  console.log('currentDish.value:', currentDish.value);
  
  const index = props.selectedDishes.findIndex((d) => d.id === currentDish.value.id);
  console.log('找到的索引:', index);
  
  if (index >= 0) {
    const newSelected = [...props.selectedDishes];
    
    // 使用组件暴露的 weightString 计算属性
    const weightString = weightInputRef.value?.weightString || "";
    
    console.log('原始数据:', newSelected[index]);
    console.log('要更新的字段:', {
      quantity: currentDish.value.quantity,
      remark: currentDish.value.remark || '',
      weightValue: currentDish.value.weightValue,
      weightUnit: currentDish.value.weightUnit,
      weight: weightString,
    });

    // 更新当前菜品信息 - 优先使用编辑后的值，同时保留原始对象中的其他字段
    newSelected[index] = {
      ...newSelected[index], // 保留原有字段（包括 orderItemId 等）
      quantity: currentDish.value.quantity,
      remark: currentDish.value.remark || '',
      weightValue: currentDish.value.weightValue,
      weightUnit: currentDish.value.weightUnit,
      weight: weightString,
    };

    console.log('更新后的数据:', newSelected[index]);
    console.log('触发 update:selectedDishes 事件，发送', newSelected.length, '个菜品');
    
    // 触发更新事件，让父组件同步状态
    emit("update:selectedDishes", newSelected);
  }

  closeEditModal();
};
</script>

<style scoped>
.dish-selector {
  width: 100%;
}

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
