<!-- eslint-disable prettier/prettier -->
<template>
  <div v-show="broadcasts.length > 0" class="mt-2">
    <transition-group name="broadcast" tag="div" class="items-center w-full mx-auto">
      <div
        v-for="broadcast in broadcasts"
        :key="broadcast.id"
        :class="[
          'w-full rounded-lg overflow-hidden cursor-pointer transition-all duration-300 relative p-1 text-xl mt-2',
          'hover:shadow-xl hover:scale-[1.02]',
          getTypeClasses(broadcast.type),
        ]"
        @click="handleClick(broadcast)">
        <!-- 关闭按钮 -->
        <button
          @click.stop="removeBroadcast(broadcast.id)"
          class="absolute top-2 right-2 text-white font-bold w-6 h-6 flex items-center justify-center rounded-full bg-black bg-opacity-20 hover:bg-opacity-30 transition-all duration-200">
          ×
        </button>
        <!-- 内容区域 -->
        <span
          ><span v-if="broadcast.icon">{{ broadcast.icon }}</span> <span class="leading-relaxed">{{ broadcast.message }}</span></span
        >
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useWebSocket } from "@/utils/websocket";

const router = useRouter();
const { listen, subscribe, unsubscribe } = useWebSocket();

// ✅ 新增：接收父组件传递的当前用餐时间段
const props = defineProps({
  currentMealType: {
    type: String,
    default: "lunch", // 默认午餐时段
  },
  currentDate: {
    type: String,
    default: "", // 格式：YYYY-MM-DD
  },
});

// 广播列表
const broadcasts = ref([]);
const MAX_BROADCASTS = 5; // 最多显示 5 条广播
const RECENT_BROADCASTS = new Map(); // 用于去重：key -> {type, orderId, timestamp}

// ✅ 新增：判断订单是否属于当前选中的用餐时间段
const isCurrentMealPeriod = (order) => {
  // 检查餐型是否匹配
  if (order.mealType !== props.currentMealType) {
    console.log("⚠️ 餐型不匹配，跳过订单:", {
      orderMealType: order.mealType,
      currentMealType: props.currentMealType,
    });
    return false;
  }

  // 检查日期是否匹配
  if (props.currentDate && order.mealTime) {
    const orderDate = new Date(order.mealTime).toISOString().split("T")[0];
    if (orderDate !== props.currentDate) {
      console.log("⚠️ 日期不匹配，跳过订单:", {
        orderDate,
        currentDate: props.currentDate,
      });
      return false;
    }
  }

  return true;
};

// 获取类型对应的样式类
const getTypeClasses = (type) => {
  const typeMap = {
    "new-order": "bg-blue-300 text-black",
    "start-dish": "bg-green-300 text-black",
    "urgent-dish": "bg-red-300 text-black",
    "pause-dish": "bg-yellow-300 text-black",
    "add-dish": "bg-purple-300 text-black",
    "remove-dish": "bg-orange-300 text-black",
    "order-complete": "bg-cyan-500 text-black",
  };
  return typeMap[type] || "bg-gray-500 text-white";
};

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

// 检查是否是重复的广播（3 秒内相同订单的相同类型通知）
const isDuplicate = (type, orderId, timestamp) => {
  const key = `${type}-${orderId}`;
  const recent = RECENT_BROADCASTS.get(key);

  if (recent && recent.type === type && timestamp - recent.timestamp < 3000) {
    return true;
  }

  return false;
};

// 添加广播
const addBroadcast = (broadcast) => {
  const { type, orderId, timestamp = Date.now() } = broadcast;

  // 去重检查
  if (orderId && isDuplicate(type, orderId, timestamp)) {
    console.log("⚠️ 跳过重复广播:", type, orderId);
    return;
  }

  // 生成唯一 ID
  const id = `broadcast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 添加到列表（限制最大数量）
  if (broadcasts.value.length >= MAX_BROADCASTS) {
    // 移除最早的广播
    broadcasts.value.shift();
  }

  // 添加到列表
  broadcasts.value.push({
    id,
    ...broadcast,
    timestamp,
  });

  // 记录到去重 Map
  if (orderId) {
    const key = `${type}-${orderId}`;
    RECENT_BROADCASTS.set(key, { type, orderId, timestamp });

    // 清理旧的记录（保留 3 秒内的）
    setTimeout(() => {
      if (RECENT_BROADCASTS.get(key)?.timestamp === timestamp) {
        RECENT_BROADCASTS.delete(key);
      }
    }, 3000);
  }

  console.log("📢 添加广播:", broadcast);
};

// 移除广播
const removeBroadcast = (id) => {
  const index = broadcasts.value.findIndex((b) => b.id === id);
  if (index > -1) {
    broadcasts.value.splice(index, 1);
    console.log("❌ 移除广播:", id);
  }
};

// 点击广播
const handleClick = (broadcast) => {
  console.log("👆 点击广播:", broadcast);

  // 如果广播携带订单 ID，跳转到订单详情页
  if (broadcast.orderId) {
    router.push(`/cooking?tab=order-${broadcast.orderId}`);
  }
};

// 监听 WebSocket 事件
const unsubscribers = [];

// 监听订单相关事件
const setupEventListeners = () => {
  // 新订单创建
  const unsubscribeNewOrder = listen("order-created", (data) => {
    console.log("🆕 新订单创建:", data);

    const order = data.data || data;

    // ✅ 过滤：只处理当前用餐时间段的订单
    if (!isCurrentMealPeriod(order)) return;

    addBroadcast({
      type: "new-order",
      title: "新订单通知",
      message: `新增订单 ${order.hallNumber}`,
      orderId: order.id,
      hallNumber: order.hallNumber,
      icon: "📋",
      timestamp: Date.now(),
    });
  });
  unsubscribers.push(unsubscribeNewOrder);

  // 订单状态变更
  const unsubscribeOrderUpdated = listen("order-updated", (data) => {
    console.log("🔄 订单更新:", data);

    const order = data.data || data;

    // ✅ 过滤：只处理当前用餐时间段的订单
    if (!isCurrentMealPeriod(order)) return;

    const previousStatus = order.previousStatus || data.previousStatus;
    const currentStatus = order.status;
    const hallNumber = order.hallNumber || data.hallNumber;
    const orderId = order.id || data.id;

    // ========== 处理普通字段变更（台号、人数、桌数等）==========
    const changes = [];

    // 检查台号变化
    if (order.hallNumber !== undefined && order.previousHallNumber !== undefined) {
      if (order.hallNumber !== order.previousHallNumber) {
        changes.push(`台号：${order.previousHallNumber}→${order.hallNumber}`);
      }
    }

    // 检查人数变化
    if (order.peopleCount !== undefined && order.previousPeopleCount !== undefined) {
      if (order.peopleCount !== order.previousPeopleCount) {
        changes.push(`人数：${order.previousPeopleCount}→${order.peopleCount}`);
      }
    }

    // 检查桌数变化
    if (order.tableCount !== undefined && order.previousTableCount !== undefined) {
      if (order.tableCount !== order.previousTableCount) {
        changes.push(`桌数：${order.previousTableCount}→${order.tableCount}`);
      }
    }

    // 如果有变更，显示广播
    if (changes.length > 0) {
      addBroadcast({
        type: "add-dish",
        title: "订单信息变更",
        message: `${hallNumber || "未知"} ${changes.join(", ")}`,
        orderId,
        hallNumber: hallNumber || "未知",
        icon: "✏️",
        timestamp: Date.now(),
      });
    }

    // ========== 处理状态变更 ==========
    // 起菜：status 从 started 变为 serving
    if (previousStatus === "started" && currentStatus === "serving") {
      addBroadcast({
        type: "start-dish",
        title: "起菜通知",
        message: `${hallNumber} 已起菜`,
        orderId,
        hallNumber,
        icon: "🍽️",
        timestamp: Date.now(),
      });
    }

    // 催菜：status 变为 urged
    if (currentStatus === "urged" && previousStatus !== "urged") {
      addBroadcast({
        type: "urgent-dish",
        title: "催菜通知",
        message: `${hallNumber} 催菜`,
        orderId,
        hallNumber,
        icon: "🔥",
        timestamp: Date.now(),
      });
    }

    // 暂停：status 从 serving/urged 变回 started
    if (previousStatus === "serving" && currentStatus === "started") {
      addBroadcast({
        type: "pause-dish",
        title: "暂停通知",
        message: `${hallNumber} 已暂停`,
        orderId,
        hallNumber,
        icon: "⏸️",
        timestamp: Date.now(),
      });
    }

    // 订单完成：status 变为 done
    if (currentStatus === "done" && previousStatus !== "done") {
      addBroadcast({
        type: "order-complete",
        title: "订单完成",
        message: `${hallNumber} 订单已完成`,
        orderId,
        hallNumber,
        icon: "✅",
        timestamp: Date.now(),
      });
    }
  });
  unsubscribers.push(unsubscribeOrderUpdated);

  // 订单项变更 - 监听 item-created（加菜）
  const unsubscribeItemCreated = listen("item-created", (data) => {
    console.log("➕ 菜品被添加:", data);

    const item = data.data || data;

    // ✅ 过滤：只处理当前用餐时间段的订单
    // 修复：使用 item.order 而不是未定义的 order
    const orderInfo = item.order || data.order || {};
    if (!isCurrentMealPeriod(orderInfo)) return;

    const dishName = item.dish?.name || "未知菜品";
    const orderId = item.orderId || data.orderId;

    // ✅ 修复：后端现在会广播 hallNumber 字段
    let hallNumber = item.hallNumber || data.hallNumber || orderInfo.hallNumber;

    addBroadcast({
      type: "add-dish",
      title: "加菜通知",
      message: `${hallNumber || "未知"} 加菜：${dishName}`,
      orderId,
      hallNumber: hallNumber || "未知",
      icon: "➕",
      timestamp: Date.now(),
    });
  });
  unsubscribers.push(unsubscribeItemCreated);

  // 订单项变更 - 监听 item-deleted（退菜）
  const unsubscribeItemDeleted = listen("item-deleted", (data) => {
    console.log("➖ 菜品被删除:", data);

    const item = data.data || data;

    // ✅ 修复：添加用餐时段过滤
    const orderInfo = item.order || data.order || {};
    if (!isCurrentMealPeriod(orderInfo)) return;

    const dishName = item.dish?.name || data.dishName || "未知菜品";
    const orderId = item.orderId || data.orderId;

    // ✅ 修复：后端现在会广播 hallNumber 字段
    let hallNumber = item.hallNumber || data.hallNumber || orderInfo.hallNumber;

    addBroadcast({
      type: "remove-dish",
      title: "退菜通知",
      message: `${hallNumber || "未知"} 退菜：${dishName}`,
      orderId,
      hallNumber: hallNumber || "未知",
      icon: "➖",
      timestamp: Date.now(),
    });
  });
  unsubscribers.push(unsubscribeItemDeleted);

  // 订单项变更 - 监听 item-updated（处理内容变更）
  const unsubscribeItemUpdated = listen("item-updated", (data) => {
    console.log("🔄 菜品更新:", data);

    // ✅ 修复：data 包含 { data: {...}, timestamp } 结构
    const item = data.data || data;

    // ✅ 修复：添加用餐时段过滤
    const orderInfo = item.order || data.order || {};
    if (!isCurrentMealPeriod(orderInfo)) return;

    const dishName = item.dish?.name || "未知菜品";
    const hallNumber = item.hallNumber || data.hallNumber || orderInfo.hallNumber;
    const orderId = item.orderId || data.orderId;

    // ========== 处理普通字段变更（数量、重量、备注）==========
    const changes = [];

    // 检查数量变化
    if (item.quantity !== undefined && item.previousQuantity !== undefined) {
      if (item.quantity !== item.previousQuantity) {
        changes.push(`数量：${item.previousQuantity}→${item.quantity}`);
      }
    }

    // 检查重量变化
    if (item.weight !== undefined && item.previousWeight !== undefined) {
      if (item.weight !== item.previousWeight) {
        changes.push(`重量：${item.previousWeight}斤→${item.weight}斤`);
      }
    }

    // 检查备注变化
    if (item.remark !== undefined && item.previousRemark !== undefined) {
      if (item.remark !== item.previousRemark) {
        changes.push(`备注已更新`);
      }
    }

    // 如果有变更，显示广播
    if (changes.length > 0) {
      addBroadcast({
        type: "add-dish",
        title: "菜品信息变更",
        message: `${hallNumber || "未知"} ${dishName} - ${changes.join(", ")}`,
        orderId,
        hallNumber: hallNumber || "未知",
        icon: "✏️",
        timestamp: Date.now(),
      });
    }
  });
  unsubscribers.push(unsubscribeItemUpdated);
};

// 生命周期钩子
onMounted(() => {
  // 订阅订单房间
  subscribe("orders");
  subscribe("order-items");

  // 设置事件监听器
  setupEventListeners();
});

onUnmounted(() => {
  // 清理所有监听器
  unsubscribers.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch (error) {
      console.warn("清理监听器失败:", error);
    }
  });

  // 取消订阅
  unsubscribe("orders");
  unsubscribe("order-items");
});

// 暴露方法给父组件（可选）
defineExpose({
  addBroadcast,
  removeBroadcast,
});
</script>

<style scoped>
/* 进入动画 */
.broadcast-enter-active,
.broadcast-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 进入初始状态 */
.broadcast-enter-from {
  opacity: 0;
  transform: translateY(-100%) scale(0.9);
}

/* 进入结束状态 */
.broadcast-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 离开初始状态 */
.broadcast-leave-from {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 离开结束状态 */
.broadcast-leave-to {
  opacity: 0;
  transform: translateY(-100%) scale(0.9);
}

/* 移动动画 */
.broadcast-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
