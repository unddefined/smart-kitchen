<!-- eslint-disable prettier/prettier -->
<template>
  <Teleport to="#modal-container">
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
              <label class="text-xl text-gray-500 whitespace-nowrap">人数</label>
              <input
                v-model.number="personCount"
                type="number"
                min="1"
                placeholder="人数"
                class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <label class="text-xl text-gray-500 whitespace-nowrap">桌数</label>
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
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="block text-xl font-medium text-gray-700">菜品</label>
              <button @click="showAddDishModal = true" class="text-blue-500 hover:text-blue-700 text-xl font-medium">+ 新增菜品</button>
            </div>

            <!-- 加载状态 -->
            <div v-if="dishesLoading" class="text-center py-4">
              <div class="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p class="text-gray-500 mt-2">加载菜品中...</p>
            </div>

            <!-- 错误状态 -->
            <div v-else-if="dishesError" class="text-center py-4">
              <p class="text-red-500">{{ dishesError }}</p>
              <button @click="loadDishes" class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">重试</button>
            </div>

            <!-- 菜品按钮网格 -->
            <div v-else class="flex flex-wrap gap-1">
              <button
                v-for="dish in allDishes"
                :key="dish.id"
                @click="toggleDishSelection(dish)"
                :class="[
                  'p-1 rounded-lg border-2 text-xl font-medium transition-all',
                  isSelected(dish.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300',
                ]">
                {{ dish.name }}
              </button>
            </div>

            <!-- 无菜品提示 -->
            <div v-if="!dishesLoading && !dishesError && allDishes.length === 0" class="text-center py-4">
              <p class="text-gray-500">暂无菜品，请先添加菜品</p>
            </div>
          </div>
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

    <!-- 菜品详情编辑弹窗 -->
    <div v-if="showDishDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-2000 p-4">
      <div class="bg-white rounded-xl w-full max-w-md">
        <div class="p-4 border-b">
          <h3 class="text-lg font-bold text-gray-900">编辑菜品</h3>
        </div>

        <div class="p-4 space-y-4">
          <div class="text-gray-900 font-medium text-xl">
            {{ currentDish?.name }}
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">份量</label>
            <div class="flex items-center space-x-3">
              <button
                @click="resetQuantity"
                class="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium transition-colors">
                清零
              </button>
              <button @click="decreaseQuantity" class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                </svg>
              </button>
              <span class="text-xl font-bold w-12 text-center">{{ currentDish?.quantity }}</span>
              <button
                @click="increaseQuantity"
                class="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </button>
              <button
                @click="addHalfQuantity"
                class="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium transition-colors">
                +0.5
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">重量</label>
            <select
              v-model="currentDish.weight"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option :value="null" disabled>请选择重量</option>
              <option v-for="option in WEIGHT_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 mb-2">备注</label>
            <textarea
              v-model="currentDish.remark"
              rows="3"
              placeholder="特殊要求..."
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
        </div>

        <div class="p-4 border-t bg-gray-50 flex space-x-3">
          <button @click="closeDishDetailModal" class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors">
            取消
          </button>
          <button @click="confirmDishEdit" class="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
            确认
          </button>
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
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                  class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
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
                  class="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed" />
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
                  class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">重量</label>
                <select
                  v-model="newDish.weight"
                  class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option :value="null" disabled>请选择重量</option>
                  <option v-for="option in WEIGHT_OPTIONS" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
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

// 重量选项常量 - 在两个弹窗中复用
const WEIGHT_OPTIONS = [
  { value: "1 两", label: "1 两" },
  { value: "2 两", label: "2 两" },
  { value: "3 两", label: "3 两" },
  { value: "4 两", label: "4 两" },
  { value: "5 两", label: "5 两" },
  { value: "6 两", label: "6 两" },
  { value: "7 两", label: "7 两" },
  { value: "8 两", label: "8 两" },
  { value: "9 两", label: "9 两" },
  { value: "1 斤", label: "1 斤" },
  { value: "1 斤 1 两", label: "1 斤 1 两" },
  { value: "1 斤 2 两", label: "1 斤 2 两" },
  { value: "1 斤 3 两", label: "1 斤 3 两" },
  { value: "1 斤 4 两", label: "1 斤 4 两" },
  { value: "1 斤 5 两", label: "1 斤 5 两" },
  { value: "1 斤 6 两", label: "1 斤 6 两" },
  { value: "1 斤 7 两", label: "1 斤 7 两" },
  { value: "1 斤 8 两", label: "1 斤 8 两" },
  { value: "1 斤 9 两", label: "1 斤 9 两" },
  { value: "2 斤", label: "2 斤" },
];

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

// 当前编辑的菜品
const currentDish = ref(null);

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

// 菜品数据
const allDishes = ref([]);
const dishesLoading = ref(false); // 添加加载状态
const dishesError = ref(null); // 添加错误状态

// 计算属性
const canSubmit = computed(() => {
  // 基础表单验证
  const basicFormValid =
    personCount.value > 0 &&
    tableCount.value > 0 && // 桌数验证
    hallNumber.value &&
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

const toggleDishSelection = (dish) => {
  const index = selectedDishes.value.findIndex((d) => d.id === dish.id);
  if (index >= 0) {
    // 如果已选中，打开编辑弹窗
    currentDish.value = { ...selectedDishes.value[index] };
    showDishDetailModal.value = true;
  } else {
    // 如果未选中，添加到选中列表（不打开弹窗）
    const newSelectedDish = {
      ...dish,
      quantity: 1,
      weight: "",
      remark: "",
    };
    selectedDishes.value.push(newSelectedDish);
  }
};

const isSelected = (dishId) => {
  return selectedDishes.value.some((d) => d.id === dishId);
};

const decreaseQuantity = () => {
  if (currentDish.value.quantity > 1) {
    currentDish.value.quantity--;
  } else {
    // 数量为0时删除菜品并关闭弹窗
    const index = selectedDishes.value.findIndex((d) => d.id === currentDish.value.id);
    if (index >= 0) {
      selectedDishes.value.splice(index, 1);
    }
    closeDishDetailModal();
  }
};

const increaseQuantity = () => {
  currentDish.value.quantity++;
};

// 新增的方法
const addHalfQuantity = () => {
  currentDish.value.quantity = parseFloat((currentDish.value.quantity + 0.5).toFixed(1));
};

const resetQuantity = () => {
  // 从已选列表中移除该菜品
  const index = selectedDishes.value.findIndex((d) => d.id === currentDish.value.id);
  if (index >= 0) {
    selectedDishes.value.splice(index, 1);
  }
  closeDishDetailModal();
};

const closeDishDetailModal = () => {
  showDishDetailModal.value = false;
  currentDish.value = null;
};

const confirmDishEdit = () => {
  const index = selectedDishes.value.findIndex((d) => d.id === currentDish.value.id);
  if (index >= 0) {
    selectedDishes.value[index] = { ...currentDish.value };
  }
  closeDishDetailModal();
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
    // 创建新菜品
    const result = await DishService.createDish({
      name: newDish.value.name,
      stationId: Number(newDish.value.stationId), // 确保是数字类型
      categoryId: Number(newDish.value.categoryId), // 确保是数字类型
      countable: newDish.value.countable,
    });

    if (result.success) {
      // 添加到菜品列表
      const newDishItem = {
        id: result.data.id,
        name: newDish.value.name,
        quantity: newDish.value.quantity,
        weight: "",
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
  resetForm();
  closeModal();
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
    // 创建订单
    const orderResult = await OrderService.createOrder({
      hallNumber: hallNumber.value,
      peopleCount: personCount.value,
      tableCount: tableCount.value, // 使用桌数字段
      mealTime: `${mealDate.value} ${mealTime.value}`,
    });

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
        dishes: selectedDishes.value,
        selectedDishIds: selectedDishes.value.map((d) => d.id), // 传递已选菜品ID用于保持状态
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

// 初始化加载菜品数据
const loadDishes = async () => {
  dishesLoading.value = true;
  dishesError.value = null;
  try {
    // 使用按上菜顺序排序的菜品数据
    const dishes = await DishService.getAllDishesInServingOrder();
    allDishes.value = dishes;
  } catch (error) {
    console.error("加载菜品数据失败:", error);
    dishesError.value = "加载菜品失败，请稍后重试";
    // 回退到字母排序
    try {
      const fallbackDishes = await DishService.getAllDishes();
      allDishes.value = fallbackDishes;
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
