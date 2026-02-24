<template>
  <Teleport to="#modal-container">
    <!-- 主订单录入弹窗 -->
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-2000">
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
          <!-- 人数和桌数输入（同一行） -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">用餐信息</label>
            <div class="flex space-x-3">
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">人数</label>
                <input
                  v-model.number="personCount"
                  type="number"
                  min="1"
                  placeholder="人数"
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-500 mb-1">桌数</label>
                <input
                  v-model.number="tableCount"
                  type="number"
                  min="1"
                  placeholder="桌数"
                  class="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
          </div>

          <!-- 台号输入 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">台号</label>
            <input
              v-model="hallNumber"
              type="text"
              placeholder="请输入台号"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <!-- 用餐时间 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">用餐时间</label>
            <div class="flex space-x-2">
              <input
                v-model="mealDate"
                type="date"
                class="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select
                v-model="mealTime"
                class="w-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="午餐">午餐</option>
                <option value="晚餐">晚餐</option>
              </select>
            </div>
          </div>

          <!-- 菜品选择区域 -->
          <div>
            <div class="flex items-center justify-between mb-3">
              <label class="block text-sm font-medium text-gray-700">菜品</label>
              <button @click="showAddDishModal = true" class="text-blue-500 hover:text-blue-700 text-sm font-medium">+ 新增菜品</button>
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
            <div v-else class="grid grid-cols-3 gap-2">
              <button
                v-for="dish in allDishes"
                :key="dish.id"
                @click="toggleDishSelection(dish)"
                :class="[
                  'p-3 rounded-lg border-2 text-sm font-medium transition-all',
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
            <button @click="cancel" class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors">
              取消
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
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">菜品名称</label>
            <div class="text-gray-900 font-medium">{{ currentDish?.name }}</div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">份量</label>
            <div class="flex items-center space-x-3">
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
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">重量</label>
            <input
              v-model="currentDish.weight"
              type="text"
              placeholder="如：5两，1斤"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">备注</label>
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
            <input
              v-model="newDish.weight"
              type="text"
              placeholder="如：5两，1斤"
              class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
          <button @click="closeAddDishModal" class="flex-1 py-3 bg-gray-200 text-black rounded-lg font-medium hover:bg-gray-300 transition-colors">
            取消
          </button>
          <button
            @click="confirmAddDish"
            :disabled="!newDish.name"
            :class="[
              'flex-1 py-3 rounded-lg font-medium transition-colors',
              newDish.name ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed',
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

// 状态
const personCount = ref(1);
const tableCount = ref(1); // 桌数字段
const hallNumber = ref("");
const mealDate = ref(new Date().toISOString().split("T")[0]);
const mealTime = ref("午餐");
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
});

// 菜品数据
const allDishes = ref([]);
const dishesLoading = ref(false); // 添加加载状态
const dishesError = ref(null); // 添加错误状态

// 计算属性
const canSubmit = computed(() => {
  return (
    personCount.value > 0 &&
    tableCount.value > 0 && // 桌数验证
    hallNumber.value &&
    selectedDishes.value.length > 0
  );
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
    // 如果未选中，添加到选中列表
    const newSelectedDish = {
      ...dish,
      quantity: 1,
      weight: "",
      remark: "",
    };
    selectedDishes.value.push(newSelectedDish);
    // 打开编辑弹窗
    currentDish.value = newSelectedDish;
    showDishDetailModal.value = true;
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
  if (!newDish.value.name) return;

  try {
    // 创建新菜品
    const result = await DishService.createDish({
      name: newDish.value.name,
      stationId: 1, // 默认工位
      categoryId: 1, // 默认分类
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
      allDishes.value.push(result.data);

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
  };
};

const cancel = () => {
  resetForm();
  closeModal();
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
  mealTime.value = "午餐";
  // 注意：不重置selectedDishes，以保持已选菜品状态用于下一张订单
};

// 初始化加载菜品数据
const loadDishes = async () => {
  dishesLoading.value = true;
  dishesError.value = null;
  try {
    const dishes = await DishService.getAllDishes();
    allDishes.value = dishes;
  } catch (error) {
    console.error("加载菜品数据失败:", error);
    dishesError.value = "加载菜品失败，请稍后重试";
    allDishes.value = [];
  } finally {
    dishesLoading.value = false;
  }
};

// 监听visible变化
watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      loadDishes();
      // 设置已选菜品状态
      if (props.prevSelectedDishes.length > 0) {
        selectedDishes.value = props.prevSelectedDishes.map((dish) => ({
          ...dish,
          remark: "", // 清除备注，但保留其他信息
          weight: "", // 清除重量，但保留其他信息
        }));
      }
    } else {
      // 不重置selectedDishes，以保持状态
    }
  },
);

// 组件挂载时初始化
onMounted(() => {
  if (props.visible) {
    loadDishes();
    // 设置已选菜品状态
    if (props.prevSelectedDishes.length > 0) {
      selectedDishes.value = props.prevSelectedDishes.map((dish) => ({
        ...dish,
        remark: "",
        weight: "",
      }));
    }
  }
});
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
