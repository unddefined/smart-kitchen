<!-- eslint-disable prettier/prettier -->
<template>
  <Teleport to="#modal-container">
    <!-- Toast 提示 -->
    <Toast v-model:visible="toast.visible" :message="toast.message" :type="toast.type" :duration="toast.duration" />
    
    <!-- 主订单录入弹窗 -->
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-2000" @click.self="closeModal">
      <div class="bg-white w-full rounded-t-2xl max-h-[90vh] flex flex-col min-h-[400px]">
        <!-- 头部 -->
        <div class="p-4 border-b flex items-center justify-between">
          <h2 class="text-xl font-bold text-gray-900">订单录入</h2>
          <button @click="closeModal" class="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- 输入区域 -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- 用餐信息输入（全部同一行） -->
          <div class="flex space-x-4">
            <div class="flex items-center space-x-3 flex-1">
              <label class="text-xl whitespace-nowrap">人数</label>
              <input
                v-model.number="personCount"
                type="number"
                min="1"
                placeholder="人数"
                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <label class="text-xl whitespace-nowrap">桌数</label>
              <input
                v-model.number="tableCount"
                type="number"
                min="1"
                placeholder="桌数"
                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <!-- 台号输入 -->
          <div class="flex space-x-4 items-center">
            <label class="text-xl font-medium text-gray-700 whitespace-nowrap">台号</label>
            <input
              v-model="hallNumber"
              type="text"
              placeholder="请输入台号"
              class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <!-- 用餐时间 -->
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

          <!-- 菜品选择区域 -->
          <!-- 使用新的 DishSelector 组件 -->
          <DishSelector
            :dishes="allDishes"
            :selected-dishes="selectedDishes"
            mode="select"
            title="菜品"
            :show-add-button="true"
            :loading="dishesLoading"
            :error="dishesError"
            @update:selected-dishes="selectedDishes = $event"
            @add-new="showAddDishModal = true"
            @retry="loadDishes"
            @delete-dish="handleDeleteDishFromDb" />
        </div>

        <!-- 底部按钮区域 -->
        <div class="p-4 border-t bg-gray-50">
          <div class="flex space-x-3">
            <button
              @click="handleCancelOrClear"
              :class="[
                'flex-1 py-3 rounded-lg font-medium transition-colors',
                hasSelectedDishes ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-200 text-black hover:bg-gray-300',
              ]">
              {{ hasSelectedDishes ? "清空已选" : "取消" }}
            </button>
            <button
              @click="submit"
              :disabled="!canSubmit"
              :class="[
                'flex-1 py-3 rounded-lg font-medium transition-colors',
                canSubmit ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed',
              ]">
              完成
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 新增菜品弹窗 -->
    <div v-if="showAddDishModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-2000 p-4">
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
              class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div v-if="loadingOptions" class="text-center py-2">
            <div class="inline-block w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs text-gray-500 mt-1">加载选项中...</p>
          </div>

          <template v-else>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">分类 *</label>
                <select
                  v-model.number="newDish.categoryId"
                  @change="handleCategoryChange"
                  class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option :value="null" disabled>请选择分类</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">工位（自动匹配）</label>
                <input
                  type="text"
                  :value="getStationName(newDish.stationId)"
                  readonly
                  class="w-full p-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">份量</label>
                <input
                  v-model.number="newDish.quantity"
                  type="number"
                  min="1"
                  placeholder="请输入份量"
                  class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                class="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
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
          </template>
        </div>

        <div class="p-4 border-t bg-gray-50 flex space-x-3">
          <button @click="closeAddDishModal" class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors">
            取消
          </button>
          <button
            @click="confirmAddDish"
            :disabled="!newDish.name || !newDish.stationId || !newDish.categoryId"
            :class="[
              'flex-1 py-3 rounded-lg font-medium transition-colors',
              newDish.name && newDish.stationId && newDish.categoryId
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed',
            ]">
            确认
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { DishService, OrderService } from "@/services";
import WeightInput from "@/components/WeightInput.vue";
import DishSelector from "@/components/DishSelector.vue";
import Toast from "@/components/Toast.vue";
import { useToast } from "@/composables/useToast";
import { useDishLoader } from "@/composables/useDishLoader";

// 使用 toast 组合式函数
const { toast, showToast, showSuccess, showError, showInfo } = useToast();

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  // 添加prevSelectedDishes prop，用于保持已选菜品状态
  prevSelectedDishes: {
    type: Array,
    default: () => [],
  },
});

// Emits
const emit = defineEmits(["update:visible", "submit", "close"]);

// 根据当前时间获取用餐时间
const getDefaultMealTime = () => {
  const now = new Date();
  const hour = now.getHours();

  // 9:00-15:00 为午餐时段
  if (hour >= 9 && hour < 15) {
    return "午餐";
  }
  // 15:00-24:00 为晚餐时段
  else if (hour >= 15 && hour < 24) {
    return "晚餐";
  }
  // 0:00-9:00 默认返回午餐（第二天早餐时段）
  else {
    return "午餐";
  }
};

// 状态
const personCount = ref(1);
const tableCount = ref(1); // 桌数字段
const hallNumber = ref("");
const mealDate = ref(new Date().toISOString().split("T")[0]);
const mealTime = ref(getDefaultMealTime());
const selectedDishes = ref([]);

// 弹窗状态
const showDishDetailModal = ref(false);
const showAddDishModal = ref(false);

// WeightInput 组件引用
const dishWeightInputRef = ref(null);
const newDishWeightInputRef = ref(null);

// 新增菜品表单
const newDish = ref({
  name: "",
  quantity: 1,
  weight: "",
  remark: "",
  countable: false,
  categoryId: null,
  stationId: null,
});

// 工位和分类数据
const stations = ref([]);
const categories = ref([]);
const loadingOptions = ref(false); // 加载选项状态

// 使用菜品加载 Composable
const { 
  dishes: allDishes,
  loading: dishesLoading,
  error: dishesError,
  loadDishes,
} = useDishLoader();

// 计算属性
const canSubmit = computed(() => {
  // 基础表单验证 - 更严格的检查
  const basicFormValid =
    personCount.value &&
    personCount.value > 0 &&
    tableCount.value &&
    tableCount.value > 0 &&
    hallNumber.value &&
    hallNumber.value.trim() !== "" &&
    selectedDishes.value.length > 0;

  // 如果没有选中菜品，直接返回 false
  if (!basicFormValid) return false;

  // 验证每个菜品的重量是否已填写
  // const allDishesHaveWeight = selectedDishes.value.every(dish => dish.weight);

  return basicFormValid;
});

// 计算是否有选中菜品
const hasSelectedDishes = computed(() => {
  return selectedDishes.value.length > 0;
});

// 方法
const closeModal = () => {
  emit("update:visible", false);
  emit("close");
};

const closeAddDishModal = () => {
  showAddDishModal.value = false;
  resetNewDishForm();
};

const confirmAddDish = async () => {
  if (!newDish.value.name) {
    console.error("请输入菜品名称");
    return;
  }

  // 验证分类是否已选择（工位会自动匹配）
  if (!newDish.value.categoryId) {
    console.error("请选择分类");
    return;
  }

  // 验证工位是否已自动匹配
  if (!newDish.value.stationId) {
    console.error("无法自动匹配工位，请检查分类是否正确");
    return;
  }

  try {
    // 使用组件暴露的 weightString 计算属性
    const weightString = newDishWeightInputRef.value?.weightString || "";

    // 创建新菜品 - 包含所有字段（份量、重量、备注都是选填）
    const result = await DishService.createDish({
      name: newDish.value.name,
      stationId: Number(newDish.value.stationId),
      categoryId: Number(newDish.value.categoryId),
      countable: newDish.value.countable,
      defaultQuantity: newDish.value.quantity || 1, // 默认份量
      defaultWeight: weightString || null, // 默认重量（可选）
      defaultRemark: newDish.value.remark || "", // 默认备注（可选）
    });

    if (result.success) {
      // 添加到菜品列表
      const newDishItem = {
        id: result.data.id,
        name: newDish.value.name,
        quantity: newDish.value.quantity,
        weight: weightString, // 添加组合后的重量字符串
        remark: newDish.value.remark,
        countable: newDish.value.countable,
      };

      selectedDishes.value.push(newDishItem);

      // 刷新菜品列表，确保显示最新数据
      await loadDishes();

      closeAddDishModal();
    }
  } catch (error) {
    console.error("创建菜品失败:", error);
  }
};

const resetNewDishForm = () => {
  newDish.value = {
    name: "",
    quantity: 1,
    weight: "",
    remark: "",
    countable: false,
    categoryId: null,
    stationId: null,
  };
};

// 分类到工位的映射关系
const categoryToStationMap = {
  凉菜: "凉菜",
  前菜: "热菜",
  中菜: "热菜",
  后菜: "热菜",
  尾菜: "热菜",
  点心: "点心",
  蒸菜: "蒸煮",
};

// 根据分类自动选择工位
const handleCategoryChange = () => {
  const selectedCategory = categories.value.find((c) => c.id === newDish.value.categoryId);
  if (selectedCategory) {
    const stationName = categoryToStationMap[selectedCategory.name];
    if (stationName) {
      const station = stations.value.find((s) => s.name === stationName);
      if (station) {
        newDish.value.stationId = station.id;
      }
    }
  }
};

// 获取工位名称
const getStationName = (stationId) => {
  if (!stationId) return "请先选择分类";
  const station = stations.value.find((s) => s.id === stationId);
  return station ? station.name : "";
};

const cancel = () => {
  console.log("取消按钮被点击");
};

// 从数据库删除菜品
const handleDeleteDishFromDb = async (dishId) => {
  try {
    const result = await DishService.deleteDish(dishId);
    
    if (result.success) {
      // 从选中列表中移除该菜品
      selectedDishes.value = selectedDishes.value.filter(d => d.id !== dishId);
      
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

// 处理取消或清空按钮点击
const handleCancelOrClear = () => {
  console.log("按钮点击，hasSelectedDishes:", hasSelectedDishes.value);
  if (hasSelectedDishes.value) {
    clearSelectedDishes();
  } else {
    cancel();
  }
};

// 清空已选菜品
const clearSelectedDishes = () => {
  console.log("清空已选菜品，当前数量:", selectedDishes.value.length);
  selectedDishes.value = [];
  console.log("已选菜品已清空");
};

const submit = async () => {
  if (!canSubmit.value) return;

  try {
    // 打印调试信息
    console.log("=== 订单提交调试信息 ===");
    console.log("hallNumber:", hallNumber.value, "trimmed:", hallNumber.value?.trim());
    console.log("personCount:", personCount.value);
    console.log("tableCount:", tableCount.value);
    console.log("selectedDishes count:", selectedDishes.value.length);

    // 更严格的验证
    if (!hallNumber.value || !hallNumber.value.trim()) {
      alert("台号不能为空");
      return;
    }
    if (!personCount.value || personCount.value < 1) {
      alert("人数必须大于 0");
      return;
    }
    if (!tableCount.value || tableCount.value < 1) {
      alert("桌数必须大于 0");
      return;
    }
    if (selectedDishes.value.length === 0) {
      alert("请选择至少一个菜品");
      return;
    }

    // 创建订单
    const orderData = {
      hallNumber: hallNumber.value.trim(),
      peopleCount: personCount.value,
      tableCount: tableCount.value, // 使用桌数字段
      // 根据餐型设置默认用餐时间：午餐 12 点，晚餐 18 点
      mealTime:
        mealTime.value === "午餐" ? new Date(`${mealDate.value}T12:00:00`).toISOString() : new Date(`${mealDate.value}T18:00:00`).toISOString(),
      mealType: mealTime.value === "午餐" ? "lunch" : "dinner", // 餐型：lunch/dinner
    };

    console.log("准备发送到后端的订单数据:", orderData);

    const orderResult = await OrderService.createOrder(orderData);

    if (orderResult.success) {
      // 添加菜品到订单
      const dishPromises = selectedDishes.value.map((dish) =>
        OrderService.addDishToOrder(orderResult.data.id, {
          dishId: dish.id,
          quantity: dish.quantity,
          weight: dish.weight || null,
          remark: dish.remark || null,
          countable: dish.countable || false,
        }),
      );

      await Promise.all(dishPromises);

      // 发送提交事件
      emit("submit", {
        orderId: orderResult.data.id,
        personCount: personCount.value,
        tableCount: tableCount.value,
        hallNumber: hallNumber.value,
        mealDate: mealDate.value,
        mealTime: mealTime.value,
        mealType: mealTime.value === "午餐" ? "lunch" : "dinner", // 添加餐型字段用于筛选
        dishes: selectedDishes.value,
        selectedDishIds: selectedDishes.value.map((d) => d.id), // 传递已选菜品 ID 用于保持状态
      });

      resetForm();
      closeModal();
    }
  } catch (error) {
    console.error("提交订单失败:", error);
  }
};

const resetForm = () => {
  personCount.value = 1;
  tableCount.value = 1;
  hallNumber.value = "";
  mealDate.value = new Date().toISOString().split("T")[0];
  mealTime.value = getDefaultMealTime();
  // 注意：不重置 selectedDishes，以保持已选菜品状态用于下一张订单
};

// 监听 visible 变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      loadDishes();
      loadOptions(); // 加载工位和分类选项
      // 设置已选菜品状态（仅清除备注和重量，保留其他信息）
      if (props.prevSelectedDishes.length > 0) {
        selectedDishes.value = props.prevSelectedDishes.map((dish) => ({
          ...dish,
          remark: "", // 清除备注
          weight: "", // 清除重量
        }));
      }
    }
    // 移除 else 分支，不重置 selectedDishes，以保持状态
  },
);

// 加载工位和分类选项
const loadOptions = async () => {
  loadingOptions.value = true;
  try {
    const [stationsData, categoriesData] = await Promise.all([
      import("@/services/api.js").then(({ api }) => api.stations.list()),
      import("@/services/api.js").then(({ api }) => api.categories.list()),
    ]);

    stations.value = stationsData || [];
    categories.value = categoriesData || [];

    // 自动选择第一个工位和分类（如果有数据）
    if (stations.value.length > 0 && !newDish.value.stationId) {
      newDish.value.stationId = stations.value[0].id;
    }
    if (categories.value.length > 0 && !newDish.value.categoryId) {
      newDish.value.categoryId = categories.value[0].id;
    }
  } catch (error) {
    console.error("加载选项失败:", error);
  } finally {
    loadingOptions.value = false;
  }
};
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
