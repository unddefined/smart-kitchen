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
      <div class="flex justify-between items-center mb-3">
        <!-- 左侧：员工头像 + 工位 + 用户名 -->
        <div class="flex items-center gap-2 cursor-pointer" @click="toggleSidebar">
          <div class="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-xl transition-all duration-200 hover:scale-110">
            👤
          </div>
          <div class="font-light text-gray-800 text-xl">打荷</div>
          <span class="text-lg font-bold">·</span>
          <div class="font-normal text-gray-800 text-xl">储旭</div>
        </div>

        <!-- 右侧：日期选择 + 午/晚餐切换 -->
        <div class="text-right flex items-center">
          <!-- 隐藏原生日期输入框，只用于数据绑定 -->
          <input type="date" v-model="selectedDate" ref="dateInput" class="hidden" @change="handleDateChange" />
          <!-- 自定义日期显示 -->
          <div class="flex items-center text-gray-600 text-xl cursor-pointer mr-3 group text-bold" @click="openDatePicker">
            <span class="mr-1">{{ currentDate }}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-200"
              viewBox="0 0 20 20"
              fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clip-rule="evenodd" />
            </svg>
          </div>
          <span class="flex rounded overflow-hidden">
            <button
              :class="[
                ' text-xl px-1 py-0.5 border-r border-gray-300 text-base cursor-pointer transition-all duration-200',
                mealType === 'lunch' ? 'bg-blue-500 text-white border-blue-500' : '',
              ]"
              @click="mealType = 'lunch'">
              午
            </button>
            <button
              :class="[
                ' text-xl px-1 py-0.5 border-gray-300 text-base cursor-pointer transition-all duration-200',
                mealType === 'dinner' ? 'bg-blue-500 text-white border-blue-500' : '',
              ]"
              @click="mealType = 'dinner'">
              晚
            </button>
          </span>
        </div>
      </div>

      <!-- 功能按钮区域：起菜、催菜、暂停、录入订单 -->
      <div class="flex w-full justify-between text-black gap-2">
        <button
          :class="[
            'py-1.5 border-none rounded-lg text-xl font-medium cursor-pointer transition-all duration-200 text-center flex-grow-[1.2] md:flex-grow-[1.1] sm:flex-grow-[1]',
            canStartDish || activeTab === 'overview' ? ' text-black hover:bg-blue-600 bg-gray-300' : 'bg-gray-300 text-gray-400 cursor-not-allowed',
          ]"
          @click="showActionModal('start')"
          :disabled="!canStartDish && activeTab !== 'overview'">
          起菜
        </button>
        <button
          :class="[
            'py-1.5 border-none rounded-lg text-xl font-medium cursor-pointer transition-all duration-200 text-center flex-grow-[1.2] md:flex-grow-[1.1] sm:flex-grow-[1]',
            canUrgentDish || activeTab === 'overview' ? ' text-black hover:bg-red-600 bg-gray-300' : 'bg-gray-300 text-gray-400 cursor-not-allowed',
          ]"
          @click="showActionModal('urgent')"
          :disabled="!canUrgentDish && activeTab !== 'overview'">
          催菜
        </button>
        <button
          :class="[
            'py-1.5 border-none rounded-lg text-xl font-medium cursor-pointer transition-all duration-200 text-center flex-grow-[1.2] md:flex-grow-[1.1] sm:flex-grow-[1]',
            canPauseDish || activeTab === 'overview' ? ' text-black hover:bg-yellow-600 bg-gray-300' : 'bg-gray-300 text-gray-400 cursor-not-allowed',
          ]"
          @click="showActionModal('pause')"
          :disabled="!canPauseDish && activeTab !== 'overview'">
          暂停
        </button>
        <button
          class="py-1.5 border-none rounded-lg text-xl font-medium text-black cursor-pointer transition-all duration-200 text-center bg-gray-300 hover:bg-gray-400 flex-grow-[1.6] md:flex-grow-[1.6] sm:flex-grow-[1.2]"
          @click="showOrderModal = true">
          录入订单
        </button>
      </div>
      <OrderBroadcast />
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
              'w-full p-2 border-none cursor-pointer text-xl transition-all duration-200 text-left ',
              activeTab === `order-${order.id}` ? 'bg-gray-100 text-black' : '',
              order.status === 'urged' ? 'bg-red-400 text-black font-bold' : '',
              order.status !== 'serving' ? 'text-gray-500' : '',
            ]"
            @click="activeTab = `order-${order.id}`">
            {{ order.hallNumber }}
          </button>
        </div>
      </aside>

      <!-- 右侧内容区域 -->
      <div class="flex-1 overflow-y-auto bg-gray-100">
        <!-- TODO 广播订单状态变更通知 -->
        <!-- 总览视图 -->
        <OverviewView v-if="activeTab === 'overview'" :orders="orders" @dish-action="handleDishAction" />

        <!-- 订单详情视图 -->
        <OrderView
          v-else-if="activeTab.startsWith('order-')"
          :order-id="activeOrderId"
          @back="activeTab = 'overview'"
          @orderCancelled="handleOrderDeleted"
          @orderDeleted="handleOrderDeleted" />
      </div>
    </main>

    <!-- 录入订单弹窗 -->
    <OrderInputModal v-model:visible="showOrderModal" @submit="handleOrderSubmit" />

    <!-- 起菜/催菜/暂停操作弹窗 -->
    <div
      v-if="showActionModalVisible"
      class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      @click="closeActionModal">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all" @click.stop>
        <!-- 弹窗标题 -->
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-2xl font-semibold text-gray-800">{{ actionModalTitle }}</h3>
        </div>

        <!-- 弹窗内容 -->
        <div class="p-6">
          <!-- 当前订单信息 -->
          <div class="mb-4 p-3 bg-blue-50 rounded-lg" :class="getStatusCardClass()">
            <p class="text-base text-gray-600">当前订单</p>
            <p class="text-lg font-medium text-gray-800 mt-1">{{ currentOrderInfo }}</p>
          </div>

          <!-- 操作类型提示 -->
          <div v-if="currentActionType === 'start'" class="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
            <p class="text-base text-green-700"><span class="font-semibold">起菜说明：</span>将订单状态从"待起菜"变更为"出餐中"</p>
          </div>
          <div v-else-if="currentActionType === 'urgent'" class="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
            <p class="text-base text-red-700"><span class="font-semibold">催菜说明：</span>标记为催菜订单，前端将显示"[台号] 催菜"提示</p>
          </div>
          <div v-else-if="currentActionType === 'pause'" class="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-500 rounded">
            <p class="text-base text-yellow-700"><span class="font-semibold">暂停说明：</span>将订单状态恢复为"待起菜"，需要重新起菜才能继续出餐</p>
          </div>

          <!-- 台号选择 - 仅在总览视图显示 -->
          <div v-if="!activeTab.startsWith('order-')" class="mb-4">
            <label class="block text-base font-medium text-gray-700 mb-2"> 选择订单（可多选） </label>
            <div class="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              <button
                v-for="order in availableOrders"
                :key="order.id"
                @click="toggleOrderSelection(order.id)"
                :class="[
                  'py-2 px-3 rounded-lg text-xl font-medium transition-all duration-200 flex items-center justify-between gap-2',
                  selectedOrderIds.includes(order.id) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                ]">
                <span class="truncate">{{ order.displayName }}</span>
                <span :class="selectedOrderIds.includes(order.id) ? 'text-blue-100 flex-shrink-0' : 'text-gray-400 flex-shrink-0'">{{
                  order.displayId
                }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 弹窗底部按钮 -->
        <div class="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end">
          <button
            @click="closeActionModal"
            class="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-base font-medium cursor-pointer transition-all duration-200 hover:bg-gray-200">
            取消
          </button>
          <button
            @click="confirmAction"
            :disabled="!activeTab.startsWith('order-') && selectedOrderIds.length === 0"
            :class="[
              'px-5 py-2.5 rounded-lg text-base font-medium cursor-pointer transition-all duration-200',
              !activeTab.startsWith('order-') && selectedOrderIds.length === 0 ? 'bg-gray-300 text-gray-400 cursor-not-allowed' : actionButtonColor,
            ]">
            确认
          </button>
        </div>
      </div>
    </div>

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
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import OverviewView from "./OverviewView.vue";
import OrderView from "./OrderView.vue";
import OrderInputModal from "../components/OrderInputModal.vue";
import OrderBroadcast from "../components/OrderBroadcast.vue";
import { OrderService } from "@/services";
import { useToast } from "@/composables/useToast";
import { useOrderAutoRefresh } from "@/composables/useOrderAutoRefresh";

// 使用 toast 组合式函数（使用全局注入）
const { showToast, showSuccess, showError, showInfo } = useToast();

// 自动刷新定时器
let refreshTimer = null;
const REFRESH_INTERVAL = 5000; // 5 秒刷新一次

// 根据当前时间获取用餐类型
const getDefaultMealType = () => {
  const now = new Date();
  const hour = now.getHours();

  // 9:00-13:00 为午餐时段
  if (hour >= 9 && hour < 13) {
    return "lunch";
  }
  // 13:00-24:00 为晚餐时段
  else if (hour >= 13 && hour < 24) {
    return "dinner";
  }
  // 0:00-9:00 默认返回午餐（第二天早餐时段）
  else {
    return "lunch";
  }
};

// 响应式数据
const mealType = ref(getDefaultMealType());
const activeTab = ref("overview");
const showSidebar = ref(false);
const loading = ref(false);
const error = ref(null);

// 获取本地日期（避免时区问题）
const getLocalDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const selectedDate = ref(getLocalDate()); // 使用本地时间初始化为今天
const dateInput = ref(null); // 添加对日期输入框的引用

// 真实订单数据
const orders = ref([]);

// 录入订单弹窗
const showOrderModal = ref(false);

// 起菜/催菜/暂停操作弹窗相关状态
const showActionModalVisible = ref(false);
const currentActionType = ref("start"); // 'start' | 'urgent' | 'pause'
const selectedOrderIds = ref([]); // string[] - 存储选中的订单 ID

// 计算属性：订单列表（每个订单显示为一个按钮）
const availableOrders = computed(() => {
  // 返回所有订单，按台号排序
  return orders.value
    .map((order) => ({
      id: order.id,
      hallNumber: order.hallNumber,
      status: order.status,
      displayName: `${order.hallNumber}`,
      displayId: `#${order.id}`,
    }))
    .sort((a, b) => a.hallNumber.localeCompare(b.hallNumber));
});

// 获取订单索引的辅助函数
const getOrderByTable = (table, index) => {
  const matchingOrders = orders.value.filter((order) => order.hallNumber === table);
  return matchingOrders[index];
};

// 计算属性：弹窗标题
const actionModalTitle = computed(() => {
  const titles = {
    start: "起菜操作",
    urgent: "催菜操作",
    pause: "暂停操作",
  };
  return titles[currentActionType.value];
});

// 计算属性：当前订单信息
const currentOrderInfo = computed(() => {
  if (!activeOrderId.value) return "未选择订单";
  const order = orders.value.find((o) => o.id === activeOrderId.value);
  if (!order) return "订单不存在";
  return `${order.hallNumber} - ${
    order.status === "started" ? "待起菜" : order.status === "serving" ? "出餐中" : order.status === "urged" ? "已催菜" : order.status
  }`;
});

// 计算属性：确认按钮颜色
const actionButtonColor = computed(() => {
  const colors = {
    start: "bg-blue-500 text-white hover:bg-blue-600",
    urgent: "bg-red-500 text-white hover:bg-red-600",
    pause: "bg-yellow-500 text-white hover:bg-yellow-600",
  };
  return colors[currentActionType.value];
});

// 获取当前订单状态卡片样式
const getStatusCardClass = () => {
  if (!activeOrderId.value) return "bg-gray-100 border-gray-400";

  const order = orders.value.find((o) => o.id === activeOrderId.value);
  if (!order) return "bg-gray-100 border-gray-400";

  const statusClasses = {
    created: "bg-gray-50 border-gray-500",
    started: "bg-blue-50 border-blue-500",
    serving: "bg-green-50 border-green-500",
    urged: "bg-red-50 border-red-500",
    done: "bg-purple-50 border-purple-500",
    cancelled: "bg-red-50 border-red-400",
  };

  return statusClasses[order.status] || "bg-gray-100 border-gray-400";
};

// 获取当前订单状态文本
const getStatusText = () => {
  if (!activeOrderId.value) return "未选择订单";

  const order = orders.value.find((o) => o.id === activeOrderId.value);
  if (!order) return "订单不存在";

  const statusMap = {
    created: "待处理",
    started: "待起菜",
    serving: "出餐中",
    urged: "已催菜",
    done: "已完成",
    cancelled: "已取消",
  };

  return statusMap[order.status] || order.status;
};

// 获取当前订单状态图标
const getStatusIcon = () => {
  if (!activeOrderId.value) return "❓";

  const order = orders.value.find((o) => o.id === activeOrderId.value);
  if (!order) return "❓";

  const iconMap = {
    created: "📋",
    started: "⏳",
    serving: "🍽️",
    urged: "🔥",
    done: "✅",
    cancelled: "❌",
  };

  return iconMap[order.status] || "❓";
};

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

// 按钮状态计算属性
const canStartDish = computed(() => {
  if (!activeOrderId.value) return false;
  const order = orders.value.find((o) => o.id === activeOrderId.value);
  return order?.status === "started";
});

const canUrgentDish = computed(() => {
  if (!activeOrderId.value) return false;
  const order = orders.value.find((o) => o.id === activeOrderId.value);
  return order?.status === "serving";
});

const canPauseDish = computed(() => {
  if (!activeOrderId.value) return false;
  const order = orders.value.find((o) => o.id === activeOrderId.value);
  // 可以从 serving 或 urged 状态暂停
  return order?.status === "serving" || order?.status === "urged";
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

    // 构建筛选参数
    const filterParams = {
      date: selectedDate.value,
      mealType: mealType.value,
    };

    const orderList = await OrderService.getOrders(filterParams);

    orders.value = orderList.map((order) => ({
      id: order.id,
      hallNumber: order.hallNumber,
      peopleCount: order.peopleCount,
      tableCount: order.tableCount,
      status: order.status,
      createdAt: order.createdAt,
      mealType: order.mealType,
      mealTime: order.mealTime,
      orderItems: order.orderItems || [], // 保留订单菜品数据
    }));

    orders.value.forEach((order, index) => {
      console.log(`订单 ${index + 1}:`, {
        id: order.id,
        hallNumber: order.hallNumber,
        status: order.status,
        peopleCount: order.peopleCount,
        tableCount: order.tableCount,
        itemCount: order.orderItems?.length,
      });
    });
  } catch (err) {
    console.error("加载订单失败:", err);
    error.value = "加载订单数据失败，请检查网络连接";
  } finally {
    loading.value = false;
  }
};

// 处理订单删除/取消后的刷新
const handleOrderDeleted = async (orderId) => {
  console.log("订单已删除/取消，刷新订单列表", orderId);

  // 保存当前的 activeTab 状态
  const currentTab = activeTab.value;

  await loadOrders();

  // 如果是特定订单的 tab，检查该订单是否还在列表中
  if (currentTab.startsWith("order-")) {
    const targetOrderId = parseInt(currentTab.split("-")[1]);
    const orderStillExists = orders.value.some((o) => o.id === targetOrderId);

    // 如果订单不存在了（可能被删除或过滤掉），切换回总览页面
    if (!orderStillExists) {
      console.log(`订单 #${targetOrderId} 不在列表中，切换回总览页面`);
      activeTab.value = "overview";
    }
  }
};

// 定时刷新订单数据（静默刷新，不显示 loading）
const refreshOrders = async () => {
  try {
    const filterParams = {
      date: selectedDate.value,
      mealType: mealType.value,
    };

    const orderList = await OrderService.getOrders(filterParams);

    orders.value = orderList.map((order) => ({
      id: order.id,
      hallNumber: order.hallNumber,
      peopleCount: order.peopleCount,
      tableCount: order.tableCount,
      status: order.status,
      createdAt: order.createdAt,
      mealType: order.mealType,
      mealTime: order.mealTime,
      orderItems: order.orderItems || [],
    }));

    console.log("[自动刷新] 成功更新订单数据，数量:", orders.value.length);
  } catch (err) {
    console.error("[自动刷新] 失败:", err);
    // 静默失败，不显示错误提示，避免频繁打扰用户
  }
};

// 组件挂载时加载数据
onMounted(() => {
  loadOrders();
});

// 监听 activeTab 变化，确保选中的订单在列表中
watch(
  () => orders.value,
  (newOrders) => {
    if (activeTab.value.startsWith("order-")) {
      const targetOrderId = parseInt(activeTab.value.split("-")[1]);
      const orderStillExists = newOrders.some((o) => o.id === targetOrderId);

      // 如果订单不存在了（可能被删除或过滤掉），切换回总览页面
      if (!orderStillExists) {
        console.log(`订单 #${targetOrderId} 不在列表中，自动切换回总览页面`);
        activeTab.value = "overview";
      }
    }
  },
  { deep: true },
);

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});

// 注意：useOrderAutoRefresh 已在组件底部调用（第 952 行），此处不应重复调用
// 使用订单自动刷新 Composable（列表页模式）已移至底部统一管理
// useOrderAutoRefresh({
//   refreshFn: loadOrders,
//   mode: "list",
// });

// 处理起菜逻辑（已改为弹窗表单方式）
const handleStartDish = async () => {
  // 此方法已被 showActionModal('start') 替代
  console.log("请使用弹窗表单方式进行起菜操作");
};

// 处理催菜逻辑（已改为弹窗表单方式）
const handleUrgentDish = async () => {
  // 此方法已被 showActionModal('urgent') 替代
  console.log("请使用弹窗表单方式进行催菜操作");
};

// 处理暂停逻辑（已改为弹窗表单方式）
const handlePauseDish = async () => {
  // 此方法已被 showActionModal('pause') 替代
  console.log("请使用弹窗表单方式进行暂停操作");
};

const handleReturnDish = () => {
  console.log("退菜功能");
  // 实现退菜逻辑
};

const handleDishAction = async (action, data) => {
  console.log("菜品操作:", action, data);

  // 处理不同类型的菜品操作
  switch (action) {
    case "status-changed":
      // 菜品状态变更后，刷新订单列表
      console.log("菜品状态变更，刷新订单列表", data);
      // data 包含：{ dish, newStatus, newPriority, message }
      await loadOrders();
      break;

    case "refresh":
      // 刷新订单列表（来自子组件的请求）
      console.log("收到刷新请求，重新加载订单列表");
      await loadOrders();
      break;

    case "double-click":
      // 双击菜品，可以在这里添加更多交互逻辑
      console.log("双击菜品:", data);
      break;

    case "adjust-priority":
      // 调整优先级（通过弹窗表单）
      console.log("调整优先级:", data);
      // 优先级调整已在弹窗中处理，这里不需要额外操作
      break;

    case "served-click":
      // 点击已出菜品
      console.log("点击已出菜品:", data);
      break;

    default:
      console.log("未知的菜品操作类型:", action);
  }
};

const handleOrderSubmit = async (orderData) => {
  console.log("=== handleOrderSubmit 接收到的数据 ===", orderData);
  // 订单已在 OrderInputModal 组件中创建，这里只需要刷新订单列表
  showOrderModal.value = false;
  // 重新加载订单列表
  await loadOrders();
};

// 显示操作弹窗
const showActionModal = (actionType) => {
  currentActionType.value = actionType;
  selectedOrderIds.value = []; // 重置选择
  showActionModalVisible.value = true;
};

// 关闭操作弹窗
const closeActionModal = () => {
  showActionModalVisible.value = false;
  selectedOrderIds.value = [];
};

// 切换订单选择状态
const toggleOrderSelection = (orderId) => {
  const index = selectedOrderIds.value.indexOf(orderId);
  if (index > -1) {
    selectedOrderIds.value.splice(index, 1);
  } else {
    selectedOrderIds.value.push(orderId);
  }
};

// 确认执行操作
const confirmAction = async () => {
  // 订单 tab 模式下必须有选中的订单
  if (activeTab.value.startsWith("order-") && !activeOrderId.value) {
    showError("请先选择一个订单");
    return;
  }

  // 非订单 tab 模式下必须有选中的订单 ID
  if (!activeTab.value.startsWith("order-") && selectedOrderIds.value.length === 0) {
    showError("请至少选择一个订单");
    return;
  }

  // 订单 tab 模式下的验证
  if (activeTab.value.startsWith("order-")) {
    // 验证订单是否存在
    const order = orders.value.find((o) => o.id === activeOrderId.value);
    if (!order) {
      showError("订单不存在");
      return;
    }

    // 根据操作类型验证订单状态
    switch (currentActionType.value) {
      case "start":
        if (order.status !== "started") {
          showError("只有待起菜状态的订单才能起菜");
          return;
        }
        break;
      case "urgent":
        if (order.status !== "serving") {
          showError("只有出餐中的订单才能催菜");
          return;
        }
        break;
      case "pause":
        if (order.status !== "serving" && order.status !== "urged") {
          showError("只有出餐中或催菜状态的订单才能暂停");
          return;
        }
        break;
    }

    try {
      let result;
      switch (currentActionType.value) {
        case "start":
          result = await OrderService.startOrder(activeOrderId.value);
          break;
        case "urgent":
          result = await OrderService.urgeOrder(activeOrderId.value);
          break;
        case "pause":
          // 暂停订单 - 将状态更新为 started
          result = await OrderService.updateOrder(activeOrderId.value, { status: "started" });
          break;
      }

      if (result.success) {
        const actionNames = {
          start: "起菜",
          urgent: "催菜",
          pause: "暂停",
        };
        showSuccess(`${actionNames[currentActionType.value]}成功`);

        // 刷新订单列表
        await loadOrders();

        // ✅ 不需要切换 tab，OrderView 会通过 WebSocket 自动刷新详情
        // 只需要关闭弹窗即可
        console.log("✅ 操作成功，订单详情将通过 WebSocket 自动刷新");

        // 关闭弹窗
        closeActionModal();
      } else {
        showError(result.message);
      }
    } catch (error) {
      console.error("操作失败:", error);
      showError("操作失败：" + error.message);
    }
  } else {
    // 总览 tab 模式 - 批量操作
    try {
      let successCount = 0;
      const actionNames = {
        start: "起菜",
        urgent: "催菜",
        pause: "暂停",
      };

      // 遍历所有选中的订单 ID
      for (const orderId of selectedOrderIds.value) {
        const order = orders.value.find((o) => o.id === orderId);
        if (!order) continue;

        try {
          let result;
          switch (currentActionType.value) {
            case "start":
              if (order.status !== "started") continue; // 跳过不符合状态的订单
              result = await OrderService.startOrder(orderId);
              break;
            case "urgent":
              if (order.status !== "serving") continue;
              result = await OrderService.urgeOrder(orderId);
              break;
            case "pause":
              if (order.status !== "serving" && order.status !== "urged") continue;
              result = await OrderService.updateOrder(orderId, { status: "started" });
              break;
          }

          if (result && result.success) {
            successCount++;
          }
        } catch (error) {
          console.error(`订单 ${orderId} 操作失败:`, error);
        }
      }

      if (successCount > 0) {
        showSuccess(`成功${actionNames[currentActionType.value]}${successCount}个订单`);
        // 刷新订单列表
        await loadOrders();
      } else {
        showError("没有可操作的订单或操作全部失败");
      }

      // 关闭弹窗
      closeActionModal();
    } catch (error) {
      console.error("批量操作失败:", error);
      showError("操作失败：" + error.message);
    }
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

// 监听餐型变化
watch(mealType, (newType, oldType) => {
  console.log("餐型从", oldType, "变更为", newType);
  loadOrders();
});

// 过滤订单（按状态）
const filterOrders = (status) => {
  if (!status) return orders.value;
  return orders.value.filter((order) => order.status === status);
};

// 使用订单自动刷新 Composable
const { cleanup: cleanupWebSocket } = useOrderAutoRefresh({
  refreshFn: loadOrders,
  mode: "list",
  autoConnect: true,
});

// 组件卸载时清理 WebSocket 连接
onUnmounted(() => {
  cleanupWebSocket();
});
</script>
