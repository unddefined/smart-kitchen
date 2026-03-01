<!-- eslint-disable prettier/prettier -->
<template>
  <div class="flex flex-col h-full bg-gray-100 relative">
    <!-- 加载状态覆盖层 -->
    <div v-if="loading" class="absolute inset-0 bg-white bg-opacity-90 flex justify-center items-center z-50">
      <div class="text-center p-5 bg-white rounded-xl shadow-lg">
        <div class="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-600 text-base">正在加载订单数据...</p>
      </div>
    </div>

    <!-- 错误状态覆盖层 -->
    <div v-if="error && !loading" class="absolute inset-0 bg-white bg-opacity-95 flex justify-center items-center z-50">
      <div class="text-center p-7 bg-white rounded-xl shadow-lg max-w-xs">
        <div class="text-5xl mb-4">⚠️</div>
        <p class="text-gray-600 text-base leading-relaxed mb-5">{{ error }}</p>
        <button
          @click="loadOrders"
          class="px-6 py-3 bg-blue-500 text-white rounded-lg text-base cursor-pointer transition-all duration-200 hover:bg-blue-600 hover:-translate-y-0.5">
          重新加载
        </button>
      </div>
    </div>

    <!-- Header区域 -->
    <header class="bg-white border-b p-3 shadow-sm safe-area-top">
      <div class="flex justify-between items-center mb-4">
        <!-- 左侧：员工头像 + 工位 + 用户名 -->
        <div class="flex items-center gap-2 cursor-pointer" @click="toggleSidebar">
          <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-xl transition-all duration-200 hover:scale-110">
            👤
          </div>
          <div class="font-light text-gray-800 text-base ml-1">打荷</div>
          <span class="text-lg font-bold">·</span>
          <div class="font-normal text-gray-800 text-base">张师傅</div>
        </div>

        <!-- 右侧：日期选择 + 午/晚餐切换 -->
        <div class="text-right flex items-center">
          <!-- 隐藏原生日期输入框，只用于数据绑定 -->
          <input 
            type="date" 
            v-model="selectedDate" 
            ref="dateInput"
            class="hidden"
            @change="handleDateChange"
          />
          <!-- 自定义日期显示 -->
          <div 
            class="flex items-center text-gray-600 text-xl cursor-pointer mr-3 group text-bold"
            @click="openDatePicker"
          >
            <span class="mr-1">{{ currentDate }}</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
            </svg>
          </div>
          <span>
            <button
              :class="[
                'px-1 py-0.5 border border-gray-300 text-base cursor-pointer transition-all duration-200',
                mealType === 'lunch' ? 'bg-blue-500 text-white border-blue-500' : '',
              ]"
              @click="mealType = 'lunch'">
              午
            </button>
            <button
              :class="[
                'px-1 py-0.5 border border-gray-300 text-base cursor-pointer transition-all duration-200',
                mealType === 'dinner' ? 'bg-blue-500 text-white border-blue-500' : '',
              ]"
              @click="mealType = 'dinner'">
              晚
            </button>
          </span>
        </div>
      </div>

      <!-- 功能按钮区域：起菜、催菜、加菜、暂缓、退菜、录入订单 -->
      <div class="flex w-full justify-between text-black gap-1">
        <button
          class="py-1.5 border-none rounded-lg text-base font-medium text-black cursor-pointer transition-all duration-200 text-center bg-gray-300 hover:bg-gray-400 flex-grow-[1.2] md:flex-grow-[1.1] sm:flex-grow-[1]"
          @click="handleStartDish">
          起菜
        </button>
        <button
          class="py-1.5 border-none rounded-lg text-base font-medium text-black cursor-pointer transition-all duration-200 text-center bg-gray-300 hover:bg-gray-400 flex-grow-[1.2] md:flex-grow-[1.1] sm:flex-grow-[1]"
          @click="handleUrgentDish">
          催菜
        </button>
        <button
          class="py-1.5 border-none rounded-lg text-base font-medium text-black cursor-pointer transition-all duration-200 text-center bg-gray-300 hover:bg-gray-400 flex-grow-[1.2] md:flex-grow-[1.1] sm:flex-grow-[1]"
          @click="handleAddDish">
          加菜
        </button>
        <button
          class="py-1.5 border-none rounded-lg text-base font-medium text-black cursor-pointer transition-all duration-200 text-center bg-gray-300 hover:bg-gray-400 flex-grow-[1.2] md:flex-grow-[1.1] sm:flex-grow-[1]"
          @click="handlePauseDish">
          暂停
        </button>
        <button
          class="py-1.5 border-none rounded-lg text-base font-medium text-black cursor-pointer transition-all duration-200 text-center bg-gray-300 hover:bg-gray-400 flex-grow-[1.2] md:flex-grow-[1.1] sm:flex-grow-[1]"
          @click="handleReturnDish">
          退菜
        </button>
        <button
          class="py-1.5 border-none rounded-lg text-base font-medium text-black cursor-pointer transition-all duration-200 text-center bg-gray-300 hover:bg-gray-400 flex-grow-[1.6] md:flex-grow-[1.6] sm:flex-grow-[1.2]"
          @click="showOrderModal = true">
          录入订单
        </button>
      </div>
    </header>

    <!-- Body区域 -->
    <main class="flex flex-1 overflow-hidden">
      <!-- 左侧菜单组件：总览置顶 + 订单选择区选项卡 -->
      <aside class="w-20 bg-gray-300 overflow-y-auto">
        <!-- 总览选项卡 -->
        <button
          :class="[
            'w-full p-2 border-none cursor-pointer text-lg text-black font-semibold transition-all duration-200 text-left sticky top-0 z-10',
            activeTab === 'overview' ? 'bg-gray-100' : '',
          ]"
          @click="activeTab = 'overview'">
          总览
        </button>

        <!-- 订单选项卡区域 -->
        <div class="flex flex-col flex-wrap">
          <button
            v-for="order in orders"
            :key="order.id"
            :class="[
              'w-full p-2 border-none cursor-pointer text-lg transition-all duration-200 text-left ',
              activeTab === `order-${order.id}` ? 'bg-gray-100 text-black' : '',
              order.hasUrgentItems ? 'text-red-500 font-bold' : '',
              order.isPending ? 'text-gray-400' : '',
            ]"
            @click="activeTab = `order-${order.id}`">
            {{ order.hallNumber }}
          </button>
        </div>
      </aside>

      <!-- 右侧内容区域 -->
      <div class="flex-1 overflow-y-auto bg-gray-100">
        <!-- 总览视图 -->
        <OverviewView
          v-if="activeTab === 'overview'"
          :pending-dishes="mockPendingDishes"
          :served-dishes="mockServedDishes"
          @dish-action="handleDishAction" />

        <!-- 订单详情视图 -->
        <OrderView v-else-if="activeTab.startsWith('order-')" :order-id="activeOrderId" @back="activeTab = 'overview'" />
      </div>
    </main>

    <!-- 订单录入弹窗 -->
    <OrderInputModal v-model:visible="showOrderModal" @submit="handleOrderSubmit" />

    <!-- 侧边栏（员工信息详情） -->
    <div v-if="showSidebar" class="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-start" @click="toggleSidebar">
      <div class="w-75 h-full bg-white shadow-lg" @click.stop>
        <div class="flex justify-between items-center p-5 border-b border-gray-200">
          <h3 class="text-gray-800 m-0">员工信息</h3>
          <button class="bg-none border-none text-2xl cursor-pointer text-gray-400" @click="toggleSidebar">×</button>
        </div>
        <div class="p-5">
          <div class="flex gap-4 mb-6">
            <div class="w-15 h-15 rounded-full bg-gray-300 flex items-center justify-center text-2xl">👤</div>
            <div class="user-basic-info">
              <p class="my-2 text-gray-600"><strong>姓名：</strong>张师傅</p>
              <p class="my-2 text-gray-600"><strong>工位：</strong>打荷</p>
              <p class="my-2 text-gray-600"><strong>手机号：</strong>138****8888</p>
            </div>
          </div>
          <div class="work-stats">
            <h4 class="text-gray-800 my-0 mb-4">今日工作统计</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-gray-100 rounded-lg">
                <span class="block text-xs text-gray-600 mb-1">处理订单</span>
                <span class="block text-xl font-bold text-blue-500">24</span>
              </div>
              <div class="text-center p-3 bg-gray-100 rounded-lg">
                <span class="block text-xs text-gray-600 mb-1">完成菜品</span>
                <span class="block text-xl font-bold text-blue-500">86</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import OverviewView from "./OverviewView.vue";
import OrderView from "./OrderView.vue";
import OrderInputModal from "../components/OrderInputModal.vue";
import { OrderService } from "@/services";

// 响应式数据
const mealType = ref("lunch");
const activeTab = ref("overview");
const showOrderModal = ref(false);
const showSidebar = ref(false);
const loading = ref(false);
const error = ref(null);
const selectedDate = ref(new Date().toISOString().split('T')[0]); // 初始化为今天
const dateInput = ref(null); // 添加对日期输入框的引用

// 真实订单数据
const orders = ref([]);

// 模拟待处理菜品数据（这部分暂时保留用于总览视图）
const mockPendingDishes = ref([
  {
    id: 1,
    name: "宫保鸡丁",
    quantity: 2,
    priority: 3,
    status: "ready",
    details: ["少辣", "加花生"],
  },
  {
    id: 2,
    name: "麻婆豆腐",
    quantity: 1,
    priority: 2,
    status: "pending",
    details: ["正常"],
  },
  {
    id: 3,
    name: "红烧肉",
    quantity: 3,
    priority: 1,
    status: "prep",
    details: ["肥瘦相间"],
  },
  {
    id: 4,
    name: "清蒸鲈鱼",
    quantity: 1,
    priority: 3,
    status: "pending",
    details: ["鲜活"],
  },
  {
    id: 5,
    name: "西红柿鸡蛋",
    quantity: 2,
    priority: 1,
    status: "pending",
    details: ["少盐"],
  },
]);

// 模拟已出菜品数据
const mockServedDishes = ref([
  {
    id: 101,
    name: "糖醋里脊",
    quantity: 1,
  },
  {
    id: 102,
    name: "干煸豆角",
    quantity: 2,
  },
  {
    id: 103,
    name: "蒜蓉西兰花",
    quantity: 1,
  },
]);

// 计算属性
const currentDate = computed(() => {
  const date = new Date(selectedDate.value);
  const currentYear = new Date().getFullYear();
  const selectedYear = date.getFullYear();
  
  // 只有当选中的年份不是当前年份时才显示年份
  if (selectedYear !== currentYear) {
    return `${selectedYear}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  } else {
    // 当前年份只显示月日
    return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
});

const activeOrderId = computed(() => {
  if (activeTab.value.startsWith("order-")) {
    const orderId = activeTab.value.split("-")[1];
    return parseInt(orderId) || null;
  }
  return null;
});

// 订单相关计算属性
const pendingCount = computed(() => {
  return orders.value.filter((order) => order.status === "created").length;
});

const servingCount = computed(() => {
  return orders.value.filter((order) => order.status === "serving").length;
});

const doneCount = computed(() => {
  return orders.value.filter((order) => order.status === "done").length;
});

// 方法
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};

// 加载订单数据
const loadOrders = async () => {
  try {
    loading.value = true;
    error.value = null;

    const orderList = await OrderService.getOrders();
    orders.value = orderList.map((order) => ({
      id: order.id,
      hallNumber: order.hallNumber,
      peopleCount: order.peopleCount,
      tableCount: order.tableCount,
      status: order.status,
      createdAt: order.createdAt,
      hasUrgentItems: checkHasUrgentItems(order),
      isPending: order.status === "created",
    }));
  } catch (err) {
    console.error("加载订单失败:", err);
    error.value = "加载订单数据失败，请检查网络连接";
  } finally {
    loading.value = false;
  }
};

// 检查订单是否有催菜项
const checkHasUrgentItems = (order) => {
  // 这里可以根据实际业务逻辑判断是否有催菜项
  // 暂时返回false，后续可以完善
  return false;
};

// 刷新订单数据
const refreshOrders = async () => {
  await loadOrders();
};

// 组件挂载时加载数据
onMounted(() => {
  loadOrders();
});

const handleStartDish = () => {
  console.log("起菜功能");
  // 实现起菜逻辑
};

const handleUrgentDish = () => {
  console.log("催菜功能");
  // 实现催菜逻辑
};

const handleAddDish = () => {
  console.log("加菜功能");
  // 实现加菜逻辑
};

const handlePauseDish = () => {
  console.log("暂停功能");
  // 实现暂停逻辑
};

const handleReturnDish = () => {
  console.log("退菜功能");
  // 实现退菜逻辑
};

const handleDishAction = (action, dish) => {
  console.log("菜品操作:", action, dish);
  // 处理菜品的各种操作
};

const handleOrderSubmit = async (orderData) => {
  try {
    const result = await OrderService.createOrder(orderData);
    if (result.success) {
      showOrderModal.value = false;
      // 重新加载订单列表
      await loadOrders();
    } else {
      console.error("订单创建失败:", result.message);
    }
  } catch (error) {
    console.error("订单提交错误:", error);
  }
};

// 日期选择器打开方法
const openDatePicker = () => {
  if (dateInput.value) {
    dateInput.value.click();
    // 对于支持showPicker的浏览器，也可以尝试调用
    if (dateInput.value.showPicker) {
      try {
        dateInput.value.showPicker();
      } catch (e) {
        // 如果showPicker失败，回退到click方法
        dateInput.value.click();
      }
    }
  }
};

// 日期变更处理方法
const handleDateChange = () => {
  console.log("日期已更改为:", selectedDate.value);
  // 这里可以添加重新加载数据的逻辑
  loadOrders();
};

// 过滤订单（按状态）
const filterOrders = (status) => {
  if (!status) return orders.value;
  return orders.value.filter((order) => order.status === status);
};
</script>
