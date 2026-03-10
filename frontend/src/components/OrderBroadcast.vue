<!-- eslint-disable prettier/prettier -->
<template>
  <div class="fixed top-0 left-0 right-0 z-[3000] flex flex-col items-center gap-2 p-4 pt-20 pointer-events-none">
    <transition-group name="broadcast" tag="div" class="flex flex-col items-center gap-2 w-full max-w-md mx-auto">
      <div
        v-for="broadcast in broadcasts"
        :key="broadcast.id"
        :class="[
          'w-full pointer-events-auto rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-300',
          'hover:shadow-xl hover:scale-[1.02]',
          getTypeClasses(broadcast.type),
        ]"
        @click="handleClick(broadcast)">
        <!-- 关闭按钮 -->
        <button
          @click.stop="removeBroadcast(broadcast.id)"
          class="absolute top-2 right-2 text-white text-xl font-bold w-6 h-6 flex items-center justify-center rounded-full bg-black bg-opacity-20 hover:bg-opacity-30 transition-all duration-200">
          ×
        </button>

        <!-- 内容区域 -->
        <div class="p-2 text-lg flex items-center justify-between">
          <!-- 标题和图标 -->

          <span
            ><span v-if="broadcast.icon">{{ broadcast.icon }}</span>
            <p class="leading-relaxed">{{ broadcast.message }}</p></span
          >

          <!-- 消息内容 -->
          <span v-if="broadcast.timestamp">{{ formatTime(broadcast.timestamp) }}</span>
        </div>
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

// 广播列表
const broadcasts = ref([]);
const MAX_BROADCASTS = 5; // 最多显示 5 条广播
const RECENT_BROADCASTS = new Map(); // 用于去重：key -> {type, orderId, timestamp}

// 获取类型对应的样式类
const getTypeClasses = (type) => {
  const typeMap = {
    "new-order": "bg-blue-500 text-white",
    "start-dish": "bg-green-500 text-white",
    "urgent-dish": "bg-red-500 text-white",
    "pause-dish": "bg-yellow-500 text-white",
    "add-dish": "bg-purple-500 text-white",
    "remove-dish": "bg-orange-500 text-white",
    "order-complete": "bg-cyan-500 text-white",
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
    addBroadcast({
      type: "new-order",
      title: "新订单通知",
      message: `台号 ${data.hallNumber} 新增订单`,
      orderId: data.id,
      hallNumber: data.hallNumber,
      icon: "📋",
      timestamp: Date.now(),
    });
  });
  unsubscribers.push(unsubscribeNewOrder);

  // 订单状态变更
  const unsubscribeOrderUpdated = listen("order-updated", (data) => {
    console.log("🔄 订单状态更新:", data);

    // 起菜：status 从 started 变为 serving
    if (data.previousStatus === "started" && data.status === "serving") {
      addBroadcast({
        type: "start-dish",
        title: "起菜通知",
        message: `台号 ${data.hallNumber} 已起菜`,
        orderId: data.id,
        hallNumber: data.hallNumber,
        icon: "🍽️",
        timestamp: Date.now(),
      });
    }

    // 催菜：status 变为 urged
    if (data.status === "urged" && data.previousStatus !== "urged") {
      addBroadcast({
        type: "urgent-dish",
        title: "催菜通知",
        message: `台号 ${data.hallNumber} 催菜`,
        orderId: data.id,
        hallNumber: data.hallNumber,
        icon: "🔥",
        timestamp: Date.now(),
      });
    }

    // 暂停：status 从 serving/urged 变回 started
    if (data.previousStatus === "serving" && data.status === "started") {
      addBroadcast({
        type: "pause-dish",
        title: "暂停通知",
        message: `台号 ${data.hallNumber} 已暂停`,
        orderId: data.id,
        hallNumber: data.hallNumber,
        icon: "⏸️",
        timestamp: Date.now(),
      });
    }

    // 订单完成：status 变为 done
    if (data.status === "done" && data.previousStatus !== "done") {
      addBroadcast({
        type: "order-complete",
        title: "订单完成",
        message: `台号 ${data.hallNumber} 订单已完成`,
        orderId: data.id,
        hallNumber: data.hallNumber,
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
    const dishName = item.dish?.name || "未知菜品";
    const orderId = item.orderId || data.orderId;

    // ✅ 修复：后端现在会广播 hallNumber 字段
    let hallNumber = item.hallNumber || data.hallNumber;

    addBroadcast({
      type: "add-dish",
      title: "加菜通知",
      message: `台号 ${hallNumber || "未知"} 新增菜品：${dishName}`,
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
    const dishName = item.dish?.name || data.dishName || "未知菜品";
    const orderId = item.orderId || data.orderId;

    // ✅ 修复：后端现在会广播 hallNumber 字段
    let hallNumber = item.hallNumber || data.hallNumber;

    addBroadcast({
      type: "remove-dish",
      title: "退菜通知",
      message: `台号 ${hallNumber || "未知"} 退菜：${dishName}`,
      orderId,
      hallNumber: hallNumber || "未知",
      icon: "➖",
      timestamp: Date.now(),
    });
  });
  unsubscribers.push(unsubscribeItemDeleted);

  // 订单项状态变更 - 监听 item-updated（可选，用于显示制作进度等）
  const unsubscribeItemUpdated = listen("item-updated", (data) => {
    console.log("🔄 菜品状态更新:", data);
    // 如果需要显示菜品制作进度通知，可以在这里添加逻辑
    // 目前暂不处理，只记录日志
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
