<template>
  <div class="cooking-container">
    <!-- Header区域 -->
    <header class="cooking-header safe-area-top">
      <div class="header-content">
        <!-- 左侧：员工头像 + 工位 + 用户名 -->
        <div class="user-info">
          <div class="avatar-placeholder" @click="toggleSidebar">👤</div>
          <div class="station-name" style="margin-left: 2px">打荷</div>
          <span style="font-size: large; font-weight: bold">·</span>
          <div class="station-name">张师傅</div>
        </div>

        <!-- 右侧：日期选择 + 午/晚餐切换 -->
        <div class="date-section">
          <span class="date-display">{{ currentDate }}</span>
          <span>
            <button :class="{ active: mealType === 'lunch' }" @click="mealType = 'lunch'" class="meal-btn">午</button>
            <button :class="{ active: mealType === 'dinner' }" @click="mealType = 'dinner'" class="meal-btn">晚</button>
          </span>
        </div>
      </div>

      <!-- 功能按钮区域：起菜、催菜、加菜、暂缓、退菜、录入订单 -->
      <div class="function-buttons">
        <button class="func-btn secondary" @click="handleStartDish">起菜</button>
        <button class="func-btn secondary" @click="handleUrgentDish">催菜</button>
        <button class="func-btn secondary" @click="handleAddDish">加菜</button>
        <button class="func-btn secondary" @click="handleDelayDish">暂缓</button>
        <button class="func-btn secondary" @click="handleReturnDish">退菜</button>
        <button class="func-btn secondary" @click="showOrderModal = true">录入订单</button>
      </div>
    </header>

    <!-- Body区域 -->
    <main class="cooking-body">
      <!-- 左侧菜单组件：总览置顶 + 订单选择区选项卡 -->
      <aside class="sidebar">
        <!-- 总览选项卡 -->
        <button :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'" class="tab-button overview-tab">总览</button>

        <!-- 订单选项卡区域 -->
        <div class="order-tabs">
          <button
            v-for="order in orders"
            :key="order.id"
            :class="{
              active: activeTab === `order-${order.id}`,
              urgent: order.hasUrgentItems,
              pending: order.isPending,
            }"
            @click="activeTab = `order-${order.id}`"
            class="order-tab">
            {{ order.hallNumber }}
          </button>
        </div>
      </aside>

      <!-- 右侧内容区域 -->
      <div class="content-area">
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
    <div v-if="showSidebar" class="sidebar-overlay" @click="toggleSidebar">
      <div class="user-sidebar" @click.stop>
        <div class="sidebar-header">
          <h3>员工信息</h3>
          <button class="close-btn" @click="toggleSidebar">×</button>
        </div>
        <div class="sidebar-content">
          <div class="user-detail">
            <div class="avatar-large">👤</div>
            <div class="user-basic-info">
              <p><strong>姓名：</strong>张师傅</p>
              <p><strong>工位：</strong>打荷</p>
              <p><strong>手机号：</strong>138****8888</p>
            </div>
          </div>
          <div class="work-stats">
            <h4>今日工作统计</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">处理订单</span>
                <span class="stat-value">24</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">完成菜品</span>
                <span class="stat-value">86</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import OverviewView from "./OverviewView.vue";
import OrderView from "./OrderView.vue";
import OrderInputModal from "../components/OrderInputModal.vue";

// 响应式数据
const mealType = ref("lunch");
const activeTab = ref("overview");
const showOrderModal = ref(false);
const showSidebar = ref(false);

// 模拟订单数据
const orders = ref([
  {
    id: 1,
    hallNumber: "A01",
    peopleCount: 4,
    hasUrgentItems: true,
    isPending: false,
  },
  {
    id: 2,
    hallNumber: "A02",
    peopleCount: 2,
    hasUrgentItems: false,
    isPending: true,
  },
  {
    id: 3,
    hallNumber: "B01",
    peopleCount: 6,
    hasUrgentItems: false,
    isPending: false,
  },
]);

// 模拟待处理菜品数据
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
  const now = new Date();
  const currentYear = now.getFullYear();
  const dateStr = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // 如果是当年，只显示月日；否则显示完整日期
  return dateStr;
});

const activeOrderId = computed(() => {
  if (activeTab.value.startsWith("order-")) {
    return activeTab.value.split("-")[1];
  }
  return null;
});

// 方法
const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
};

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

const handleDelayDish = () => {
  console.log("暂缓功能");
  // 实现暂缓逻辑
};

const handleReturnDish = () => {
  console.log("退菜功能");
  // 实现退菜逻辑
};

const handleDishAction = (action, dish) => {
  console.log("菜品操作:", action, dish);
  // 处理菜品的各种操作
};

const handleOrderSubmit = (orderData) => {
  console.log("订单提交:", orderData);
  showOrderModal.value = false;
  // 这里可以添加实际的订单提交逻辑
};
</script>

<style scoped>
.cooking-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

/* Header区域样式 */
.cooking-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  transition: all 0.2s;
}

.avatar-placeholder:hover {
  transform: scale(1.1);
}

.station-name {
  font-weight: 300;
  color: #333;
  font-size: 16px;
}

.date-section {
  text-align: right;
}

.date-display {
  font-size: 18px;
  color: #666;
  margin-bottom: 8px;
  margin-right: 18px;
}

.meal-toggle {
  /* display: flex; */
  gap: 8px;
}

.meal-btn {
  padding: 4px;
  border: 1px solid #ddd;
  background: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.meal-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.function-buttons {
  display: flex;
  width: 100%;
  justify-content: space-between; /* 使用space-between实现铺满 */
  color: #000;
  gap: 2px;
}

.func-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: #000;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  flex: 0 1 auto; /* 基础设置 */
  white-space: nowrap;
  min-width: fit-content;
}

/* 根据文字长度设置不同的flex-grow值 */
.func-btn:nth-child(1) {
  flex-grow: 1.2;
} /* 起菜 - 短文字，增长系数稍大 */
.func-btn:nth-child(2) {
  flex-grow: 1.2;
} /* 催菜 - 短文字，增长系数稍大 */
.func-btn:nth-child(3) {
  flex-grow: 1.2;
} /* 加菜 - 短文字，增长系数稍大 */
.func-btn:nth-child(4) {
  flex-grow: 1.2;
} /* 暂缓 - 短文字，增长系数稍大 */
.func-btn:nth-child(5) {
  flex-grow: 1.2;
} /* 退菜 - 短文字，增长系数稍大 */
.func-btn:nth-child(6) {
  flex-grow: 1.6;
} /* 录入订单 - 长文字，增长系数更大 */

/* 第一个按钮左边距为0 */
.func-btn:first-child {
  margin-left: 0;
}

/* 最后一个按钮右边距为0 */
.func-btn:last-child {
  margin-right: 0;
}

/* 按钮颜色样式 */
.func-btn.primary {
  background: #60a5fa;
  color: white;
}
.func-btn.warning {
  background: #fbbf24;
  color: white;
}
.func-btn.success {
  background: #34d399;
  color: white;
}
.func-btn.info {
  background: #a78bfa;
  color: white;
}
.func-btn.danger {
  background: #f87171;
  color: white;
}
.func-btn.secondary {
  background: #d5d5d5;
  color: rgb(0, 0, 0);
}

/* 移动端优化：保持一行六个按钮 */
@media (max-width: 768px) {
  .func-btn {
    padding: 8px 10px;
    font-size: 14px;
    margin: 0 3px;
  }

  /* 移动端调整flex-grow值 */
  .func-btn:nth-child(1) {
    flex-grow: 1.1;
  }
  .func-btn:nth-child(2) {
    flex-grow: 1.1;
  }
  .func-btn:nth-child(3) {
    flex-grow: 1.1;
  }
  .func-btn:nth-child(4) {
    flex-grow: 1.1;
  }
  .func-btn:nth-child(5) {
    flex-grow: 1.1;
  }
  .func-btn:nth-child(6) {
    flex-grow: 1.6;
  }

  .func-btn:first-child {
    margin-left: 0;
  }

  .func-btn:last-child {
    margin-right: 0;
  }
}

@media (max-width: 480px) {
  .func-btn {
    padding: 4px;
    font-size: 16px;
    letter-spacing: 1px;
    margin: 0 2px;
  }

  /* 更小屏幕进一步调整 */
  .func-btn:nth-child(1) {
    flex-grow: 1;
  }
  .func-btn:nth-child(2) {
    flex-grow: 1;
  }
  .func-btn:nth-child(3) {
    flex-grow: 1;
  }
  .func-btn:nth-child(4) {
    flex-grow: 1;
  }
  .func-btn:nth-child(5) {
    flex-grow: 1;
  }
  .func-btn:nth-child(6) {
    flex-grow: 1.2;
  }
}

/* Body区域样式 */
.cooking-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 100px;
  background: rgb(230, 230, 230);
  overflow-y: auto;
}

.menu-tabs {
  padding: 16px 12px;
}

.overview-tab {
  width: 100%;
  padding: 14px 16px;
  border: none;
  background: rgb(231, 230, 230);
  cursor: pointer;
  font-size: 18px;
  color: #000000;
  font-weight: 600;
  transition: all 0.2s;
  text-align: left;
}

.overview-tab.active {
  background: #f8f9fa;
}

.order-tabs {
  display: flex;
  flex-direction: column;
}

.order-tab {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: rgb(230, 230, 230);
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
  text-align: left;
}

.order-tab.active {
  background: #f8f9fa;
  color: rgb(0, 0, 0);
}

.order-tab.urgent {
  color: #ef4444;
  font-weight: bold;
}

.order-tab.pending {
  color: #9ca3af;
}

.content-area {
  flex: 1;
  overflow-y: auto;
  background: #f8f9fa;
}

/* 侧边栏样式 */
.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  justify-content: flex-start;
}

.user-sidebar {
  width: 300px;
  height: 100%;
  background: white;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.2);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.sidebar-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}

.sidebar-content {
  padding: 20px;
}

.user-detail {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.avatar-large {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.user-basic-info p {
  margin: 8px 0;
  color: #666;
}

.work-stats h4 {
  margin: 0 0 16px 0;
  color: #333;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #3b82f6;
}

/* 安全区域适配 */
.safe-area-top {
  padding-top: max(16px, env(safe-area-inset-top));
}

/* 响应式设计 */
@media (max-width: 768px) {
  .cooking-header {
    padding: 12px;
  }

  .header-content {
    /* 保持水平布局，但调整元素尺寸 */
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .user-info {
    gap: 6px;
    min-width: 0; /* 允许收缩 */
  }

  .avatar-placeholder {
    width: 32px;
    height: 32px;
    font-size: 16px;
  }

  .station-name {
    font-size: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60px;
  }

  .username {
    font-size: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 60px;
  }

  .date-section {
    text-align: right;
    min-width: 0; /* 允许收缩 */
  }

  .date-display {
    font-size: 14px;
    margin-bottom: 4px;
    margin-right: 8px;
    font-weight: bold;
  }

  .meal-toggle {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
  }

  .meal-btn {
    padding: 3px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .cooking-header {
    padding: 10px;
  }

  .header-content {
    gap: 6px;
  }

  .user-info {
    gap: 4px;
  }

  .avatar-placeholder {
    width: 28px;
    height: 28px;
    font-size: 14px;
  }

  .station-name {
    font-size: 16px;
    max-width: 50px;
  }

  .username {
    font-size: 16px;
    max-width: 50px;
  }

  .date-display {
    font-size: 16px;
  }

  .meal-btn {
    padding: 1px 5px;
    font-size: 16px;
  }

  .sidebar {
    width: 60px;
  }

  .overview-tab,
  .order-tab {
    padding: 10px 8px;
    font-size: 16px;
  }
}

/* 超窄屏幕特殊处理 */
@media (max-width: 360px) {
  .header-content {
    gap: 4px;
    font-size: 12px;
  }

  .user-info {
    gap: 3px;
  }

  .avatar-placeholder {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .station-name {
    font-size: 12px;
    max-width: 45px;
  }

  .username {
    font-size: 10px;
    max-width: 45px;
  }

  .date-display {
    font-size: 12px;
  }

  .meal-btn {
    padding: 2px 8px;
    font-size: 10px;
  }

  .func-btn:nth-child(1) {
    flex-grow: 0.9;
  }
  .func-btn:nth-child(2) {
    flex-grow: 0.9;
  }
  .func-btn:nth-child(3) {
    flex-grow: 0.9;
  }
  .func-btn:nth-child(4) {
    flex-grow: 0.9;
  }
  .func-btn:nth-child(5) {
    flex-grow: 0.9;
  }
  .func-btn:nth-child(6) {
    flex-grow: 1.4;
  }
}
</style>
