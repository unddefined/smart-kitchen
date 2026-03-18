// API 广播 Composable Hook - 处理 WebSocket 广播和防抖逻辑
import { ref } from "vue";
import { useWebSocket } from "@/utils/websocket";

// 📡 广播防抖机制 - 避免批量操作时频繁广播
const broadcastDebounceTimers = {};
const BROADCAST_DEBOUNCE_DELAY = 1000; // 1000ms 防抖延迟

// 从 URL 提取资源信息
function extractResourceInfo(url) {
   // 匹配 /api/orders/123/items 或 /api/orders/123 等
   const patterns = [
      {
         regex: /^\/api\/orders\/(\d+)\/items/,
         resource: "order-items",
         room: "order-items",
      },
      { regex: /^\/api\/orders\/(\d+)/, resource: "orders", room: "orders" },
      { regex: /^\/api\/dishes\/(\d+)/, resource: "dishes", room: "dishes" },
      { regex: /^\/api\/users\/(\d+)/, resource: "users", room: "users" },
      { regex: /^\/api\/serving\/(.*)/, resource: "serving", room: "serving" },
   ];

   for (const pattern of patterns) {
      const match = url.match(pattern.regex);
      if (match) {
         return { resource: pattern.resource, room: pattern.room, id: match[1] };
      }
   }

   // 默认情况
   const parts = url.split("/").filter(Boolean);
   const resource = parts[parts.length - 1] || "unknown";
   return { resource, room: resource };
}

// HTTP 方法转换为事件后缀
function methodToEvent(method) {
   const map = {
      POST: "created",
      PUT: "updated",
      PATCH: "updated",
      DELETE: "deleted",
   };
   return map[method.toUpperCase()] || "changed";
}

// 执行广播
function performBroadcast(url, method, responseData) {
   try {
      const ws = useWebSocket();

      // 确定资源类型和事件名称
      const resourceInfo = extractResourceInfo(url);
      const eventType = `${resourceInfo.resource}-${methodToEvent(method)}`;

      // 广播到特定资源房间
      ws.broadcast(resourceInfo.room, eventType, {
         type: eventType,
         method: method.toUpperCase(),
         url: url,
         timestamp: new Date().toISOString(),
         data: responseData.data || responseData,
      });

      // 广播全局变更到 all 房间
      ws.broadcast("all", "global-change", {
         resource: resourceInfo.resource,
         action: methodToEvent(method),
         timestamp: new Date().toISOString(),
         data: responseData.data || responseData,
      });

      console.log("📢 广播数据变更:", {
         type: eventType,
         method: method.toUpperCase(),
         url: url,
         data: responseData.data || responseData,
      });
   } catch (error) {
      console.warn("⚠️ WebSocket 广播失败:", error.message);
   }
}

// 增强广播 - 带确认机制和重试
async function enhancedBroadcast(url, method, responseData) {
   try {
      const ws = useWebSocket();

      // 确定资源类型和事件名称
      const resourceInfo = extractResourceInfo(url);
      const eventType = `${resourceInfo.resource}-${methodToEvent(method)}`;

      // 使用带确认的广播
      const messageId = await ws.broadcastWithAck(resourceInfo.room, eventType, {
         type: eventType,
         method: method.toUpperCase(),
         url: url,
         timestamp: new Date().toISOString(),
         data: responseData?.data || responseData,
      });

      // 同时广播到全局变更房间
      await ws.broadcastWithAck("all", "global-change", {
         resource: resourceInfo.resource,
         action: methodToEvent(method),
         timestamp: new Date().toISOString(),
         data: responseData?.data || responseData,
      });

      console.log("📢 增强广播发送成功:", {
         type: eventType,
         method: method.toUpperCase(),
         url: url,
         messageId,
      });

      return messageId;
   } catch (error) {
      console.warn("⚠️ 增强广播失败，降级到普通广播:", error.message);
      // 降级到普通广播
      performBroadcast(url, method, responseData);
   }
}

// 防抖广播 - 合并短时间内的多次广播
function debouncedBroadcast(url, method, responseData) {
   const resourceInfo = extractResourceInfo(url);
   const debounceKey = `${resourceInfo.resource}-${methodToEvent(method)}`;

   // 清除之前的定时器
   if (broadcastDebounceTimers[debounceKey]) {
      clearTimeout(broadcastDebounceTimers[debounceKey]);
   }

   // 设置新的定时器
   broadcastDebounceTimers[debounceKey] = setTimeout(() => {
      performBroadcast(url, method, responseData);
      delete broadcastDebounceTimers[debounceKey];
   }, BROADCAST_DEBOUNCE_DELAY);

   console.log("⏱️ 广播已防抖:", {
      key: debounceKey,
      delay: BROADCAST_DEBOUNCE_DELAY + "ms",
   });
}

/**
 * useApiBroadcast Composable Hook
 *
 * 用于处理 API 请求后的 WebSocket 广播逻辑
 * 提供防抖、增强广播（带确认）、普通广播等功能
 *
 * @returns {Object} 广播相关方法
 *
 * @example
 * // 在组件中使用
 * import { useApiBroadcast } from '@/composables/useApiBroadcast';
 *
 * export default {
 *   setup() {
 *     const { debouncedBroadcast, enhancedBroadcast, performBroadcast } = useApiBroadcast();
 *
 *     // 使用防抖广播
 *     const handleUpdate = async () => {
 *       await api.orders.updateStatus(1, 'started');
 *       // 广播会自动触发，无需手动调用
 *     };
 *
 *     return { handleUpdate };
 *   }
 * }
 */
export function useApiBroadcast() {
   // 内部状态（如果需要响应式状态可以添加）
   const isBroadcasting = ref(false);
   const lastBroadcastTime = ref(null);

   /**
    * 执行带防抖的广播
    * @param {string} url - API URL
    * @param {string} method - HTTP 方法
    * @param {any} responseData - 响应数据
    */
   const broadcast = (url, method, responseData) => {
      debouncedBroadcast(url, method, responseData);
   };

   /**
    * 执行增强广播（带确认机制）
    * @param {string} url - API URL
    * @param {string} method - HTTP 方法
    * @param {any} responseData - 响应数据
    * @returns {Promise<string>} 消息 ID
    */
   const broadcastWithAck = async (url, method, responseData) => {
      isBroadcasting.value = true;
      try {
         const messageId = await enhancedBroadcast(url, method, responseData);
         lastBroadcastTime.value = new Date().toISOString();
         return messageId;
      } finally {
         isBroadcasting.value = false;
      }
   };

   /**
    * 立即执行广播（不防抖）
    * @param {string} url - API URL
    * @param {string} method - HTTP 方法
    * @param {any} responseData - 响应数据
    */
   const broadcastNow = (url, method, responseData) => {
      performBroadcast(url, method, responseData);
   };

   /**
    * 取消待处理的防抖广播
    * @param {string} url - API URL
    * @param {string} method - HTTP 方法
    */
   const cancelPendingBroadcast = (url, method) => {
      const resourceInfo = extractResourceInfo(url);
      const debounceKey = `${resourceInfo.resource}-${methodToEvent(method)}`;

      if (broadcastDebounceTimers[debounceKey]) {
         clearTimeout(broadcastDebounceTimers[debounceKey]);
         delete broadcastDebounceTimers[debounceKey];
         console.log("❌ 已取消待处理的广播:", debounceKey);
      }
   };

   /**
    * 获取广播状态
    * @returns {Object} 广播状态信息
    */
   const getBroadcastStatus = () => ({
      isBroadcasting: isBroadcasting.value,
      lastBroadcastTime: lastBroadcastTime.value,
      pendingBroadcasts: Object.keys(broadcastDebounceTimers).length,
   });

   return {
      // 主要方法
      broadcast, // 防抖广播
      broadcastWithAck, // 增强广播（带确认）
      broadcastNow, // 立即广播

      // 控制方法
      cancelPendingBroadcast, // 取消待处理广播
      getBroadcastStatus, // 获取状态

      // 工具方法（高级用法）
      extractResourceInfo, // 提取资源信息
      methodToEvent, // 方法转事件
   };
}

// 导出底层函数以保持向后兼容
export { debouncedBroadcast, enhancedBroadcast, performBroadcast, extractResourceInfo, methodToEvent, BROADCAST_DEBOUNCE_DELAY };

export default useApiBroadcast;
