<template>
  <div class="p-4 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6 text-gray-900">订单录入组件演示</h1>

    <!-- 功能演示区域 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <!-- 触发按钮 -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">触发方式</h2>
        <div class="space-y-3">
          <button
            @click="showOrderModal = true"
            class="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all font-medium shadow-md"
          >
            打开订单录入
          </button>

          <div class="text-sm text-gray-600">
            <p class="mb-2">📌 使用场景：</p>
            <ul class="list-disc list-inside space-y-1 text-gray-500">
              <li>前台点餐系统</li>
              <li>服务员移动设备</li>
              <li>自助点餐终端</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 设计特点 -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-800 mb-4">设计特点</h2>
        <div class="space-y-3">
          <div class="flex items-start space-x-3">
            <div
              class="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"
            ></div>
            <div>
              <h3 class="font-medium text-gray-800">现代化UI设计</h3>
              <p class="text-sm text-gray-600">圆角卡片、渐变按钮、优雅阴影</p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div
              class="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"
            ></div>
            <div>
              <h3 class="font-medium text-gray-800">智能搜索功能</h3>
              <p class="text-sm text-gray-600">支持菜品名称和助记码搜索</p>
            </div>
          </div>

          <div class="flex items-start space-x-3">
            <div
              class="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"
            ></div>
            <div>
              <h3 class="font-medium text-gray-800">移动端优化</h3>
              <p class="text-sm text-gray-600">触控友好的大按钮和间距</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单录入模态框 -->
    <OrderInputModal
      v-model:visible="showOrderModal"
      @submit="handleOrderSubmit"
      @close="handleModalClose"
    />

    <!-- 提交结果显示 -->
    <div
      v-if="submittedOrder"
      class="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6 mb-8 shadow-sm"
    >
      <div class="flex items-center mb-4">
        <div
          class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mr-3"
        >
          <svg
            class="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            ></path>
          </svg>
        </div>
        <h2 class="text-xl font-bold text-green-800">订单提交成功</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <h3 class="font-semibold text-green-700 mb-3">订单基本信息</h3>
          <div class="space-y-2 text-green-700">
            <div class="flex justify-between">
              <span class="font-medium">订单编号:</span>
              <span class="font-mono">{{ submittedOrder.orderId }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">桌号:</span>
              <span>{{ submittedOrder.tableNumber }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">用餐人数:</span>
              <span>{{ submittedOrder.personCount }} 人</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">用餐时段:</span>
              <span>{{
                submittedOrder.mealTime === "lunch" ? "午餐" : "晚餐"
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="font-medium">备注:</span>
              <span>{{ submittedOrder.remark || "无" }}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 class="font-semibold text-green-700 mb-3">菜品明细</h3>
          <div class="space-y-2">
            <div
              v-for="(dish, index) in submittedOrder.dishes"
              :key="index"
              class="flex items-center justify-between p-3 bg-white rounded-lg border border-green-100"
            >
              <div class="flex items-center">
                <div
                  class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3"
                >
                  <span class="text-green-700 font-medium text-sm">{{
                    index + 1
                  }}</span>
                </div>
                <div>
                  <div class="font-medium text-green-800">{{ dish.name }}</div>
                  <div class="text-xs text-green-600 mt-1">
                    {{ dish.isManual ? "手动添加" : "菜品库" }}
                  </div>
                </div>
              </div>
              <div class="text-green-700 font-medium">
                × {{ dish.quantity }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能特性说明 -->
    <div
      class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 shadow-sm"
    >
      <h2 class="text-xl font-bold text-blue-800 mb-4">核心功能特性</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="bg-white rounded-lg p-4 border border-blue-100"
        >
          <div class="flex items-center mb-3">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center mr-3"
              :class="feature.bgColor"
            >
              <component :is="feature.icon" class="w-4 h-4 text-white" />
            </div>
            <h3 class="font-semibold text-gray-800">{{ feature.title }}</h3>
          </div>
          <p class="text-sm text-gray-600">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import OrderInputModal from "./OrderInputModal.vue";
import { OrderService } from "@/services";

// 状态
const showOrderModal = ref(false);
const submittedOrder = ref(null);

// 功能特性数据
const features = [
  {
    title: "智能搜索",
    description: "支持菜品名称和助记码双重搜索，快速定位目标菜品",
    icon: "SearchIcon",
    bgColor: "bg-blue-500",
  },
  {
    title: "批量操作",
    description: "支持菜品数量增减、删除等快捷操作",
    icon: "PlusIcon",
    bgColor: "bg-green-500",
  },
  {
    title: "语音录入",
    description: "集成语音识别功能，提升点餐效率",
    icon: "MicrophoneIcon",
    bgColor: "bg-purple-500",
  },
  {
    title: "拍照识别",
    description: "支持菜单图片识别，自动提取菜品信息",
    icon: "CameraIcon",
    bgColor: "bg-yellow-500",
  },
  {
    title: "新增菜品",
    description: "可临时添加不在菜品库中的新菜品",
    icon: "DocumentAddIcon",
    bgColor: "bg-indigo-500",
  },
  {
    title: "数据验证",
    description: "完善的表单验证和错误提示机制",
    icon: "ShieldCheckIcon",
    bgColor: "bg-red-500",
  },
];

// 图标组件
const SearchIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>`,
};

const PlusIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>`,
};

const MicrophoneIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>`,
};

const CameraIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>`,
};

const DocumentAddIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>`,
};

const ShieldCheckIcon = {
  template: `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`,
};

// 处理订单提交
const handleOrderSubmit = async (orderData) => {
  console.log("收到订单数据:", orderData);

  try {
    // 使用OrderService创建订单
    const result = await OrderService.createOrder({
      hallNumber: orderData.tableNumber,
      peopleCount: orderData.personCount,
      remark: orderData.remark,
      mealTime: orderData.mealTime,
    });

    if (result.success) {
      // 添加菜品到订单
      const dishPromises = orderData.dishes.map((dish) =>
        OrderService.addDishToOrder(result.data.id, {
          dishId: dish.dishId,
          quantity: dish.quantity,
          remark: dish.isManual ? dish.name : null,
        }),
      );

      await Promise.all(dishPromises);

      // 保存提交的数据用于显示
      submittedOrder.value = {
        ...orderData,
        orderId: result.data.id,
      };

      console.log("订单创建成功:", result.data);
    } else {
      console.error("订单创建失败:", result.message);
    }
  } catch (error) {
    console.error("处理订单时发生错误:", error);
  }
};

// 处理模态框关闭
const handleModalClose = () => {
  console.log("模态框已关闭");
};
</script>

<style scoped>
/* 平滑过渡动画 */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

/* 卡片悬停效果 */
.shadow-sm:hover {
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

/* 响应式网格布局 */
.grid {
  display: grid;
}

@media (min-width: 768px) {
  .md\:grid-cols-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .md\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .lg\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
