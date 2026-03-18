import { io } from "socket.io-client";
import { ref, onMounted, onUnmounted } from "vue";

const socket = ref(null);
const isConnected = ref(false);
const reconnectAttempts = ref(0);
// 新增：全局状态跟踪已订阅的房间和已监听的事件
const subscribedRooms = new Set();
const eventListeners = new Map();
let isConnecting = false; // 防止重复连接

export function useWebSocket() {
   // 根据环境自动选择 WebSocket 地址
   const getWebSocketUrl = () => {
      // 生产环境使用服务器地址（通过 Nginx 反向代理）
      if (import.meta.env.PROD) {
         const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
         // 使用当前 host，不添加端口号（由 Nginx 处理反向代理）
         return `${protocol}//${window.location.host}/ws`;
      }
      // 开发环境使用本地地址
      return import.meta.env.VITE_WS_URL || "ws://localhost:3001/ws";
   };

   const connect = (url = null) => {
      // 防止重复连接
      if (isConnecting || (socket.value && isConnected.value)) {
         console.log("⚠️ WebSocket 已在连接或已连接，跳过连接");
         return;
      }

      isConnecting = true;
      const wsUrl = url || getWebSocketUrl();
      console.log("🔌 Connecting to WebSocket:", wsUrl);

      socket.value = io(wsUrl, {
         transports: ["websocket"], // 强制使用 WebSocket，禁用轮询
         reconnection: true,
         reconnectionDelay: 2000, // 增加初始重连延迟到 2 秒
         reconnectionDelayMax: 10000, // 最大重连延迟增加到 10 秒
         reconnectionAttempts: Infinity, // 无限重连尝试
         timeout: 30000, // 增加连接超时到 30 秒
         forceNew: false, // 重用现有连接
         autoConnect: true, // 自动连接
         // 启用心跳检测
         pingTimeout: 60000, // 60 秒无响应视为超时
         pingInterval: 25000, // 每 25 秒发送一次 ping
         // 升级代理配置
         upgrade: true,
         rememberUpgrade: true,
      });

      // ✅ 修复：确保 socket.value 存在后再添加事件监听器
      if (!socket.value) {
         console.error("❌ Socket 实例创建失败");
         isConnecting = false;
         return;
      }

      socket.value.on("connect", () => {
         console.log("✅ WebSocket 连接成功");
         isConnected.value = true;
         reconnectAttempts.value = 0;
         isConnecting = false;

         // 重新订阅之前订阅过的房间
         resubscribeRooms();

         // 重连后同步状态（如果是重连）
         if (reconnectAttempts.value > 0) {
            syncStateAfterReconnect();
         }
      });

      socket.value.on("disconnect", (reason) => {
         console.warn("❌ WebSocket 断开连接:", reason);
         isConnected.value = false;
         isConnecting = false;

         // 根据断开原因输出不同日志
         if (reason === "io server disconnect") {
            console.error("⚠️ 服务器主动断开连接，尝试重新连接...");
         } else if (reason === "transport close") {
            console.warn("⚠️ 传输层关闭，可能是网络问题");
         } else if (reason === "pingTimeout") {
            console.error("⚠️ 心跳超时，服务器无响应");
         }
      });

      socket.value.on("reconnect", (attemptNumber) => {
         console.log(`🔄 重新连接成功，尝试次数：${attemptNumber}`);
         reconnectAttempts.value = attemptNumber;
         isConnecting = false;
      });

      socket.value.on("reconnect_attempt", (attemptNumber) => {
         console.log(`🔄 尝试重新连接... (${attemptNumber}/${socket.value.opts.reconnectionAttempts})`);
      });

      socket.value.on("reconnect_failed", () => {
         console.error("❌ 重新连接失败，已达到最大尝试次数");
         isConnecting = false;
      });

      socket.value.on("reconnect_error", (error) => {
         console.error("❌ 重连错误:", error.message);
      });

      // 错误处理
      socket.value.on("connect_error", (error) => {
         console.error("❌ 连接错误:", error.message);
         isConnecting = false;
      });

      // 监听 ping 事件（心跳）
      socket.value.on("ping", () => {
         console.debug("💓 收到服务器 ping");
      });

      // 监听 pong 事件（心跳响应）
      socket.value.on("pong", (latency) => {
         console.debug(`💓 心跳响应，延迟：${latency}ms`);
      });

      // 监听订阅成功
      socket.value.on("subscribed", (data) => {
         console.log("📡 订阅成功:", data);
      });

      // 监听取消订阅成功
      socket.value.on("unsubscribed", (data) => {
         console.log("📡 取消订阅成功:", data);
      });
   };

   const disconnect = () => {
      if (socket.value) {
         // 清理连接检查定时器
         if (connectionCheckTimer) {
            clearInterval(connectionCheckTimer);
            connectionCheckTimer = null;
         }

         socket.value.disconnect();
         socket.value = null;
         isConnected.value = false;
         isConnecting = false;
         // 可选：清理已订阅的房间和监听器
         // subscribedRooms.clear();
         // eventListeners.clear();
      }
   };

   const sendMessage = (event, data) => {
      if (socket.value && isConnected.value) {
         socket.value.emit(event, data);
         return true;
      } else {
         console.warn("⚠️ WebSocket 未连接，无法发送消息");
         return false;
      }
   };

   const listen = (event, callback) => {
      // 检查是否已存在该事件的监听器
      const eventKey = event;
      if (!eventListeners.has(eventKey)) {
         eventListeners.set(eventKey, new Set());
      }

      const listeners = eventListeners.get(eventKey);
      if (listeners.has(callback)) {
         console.warn(`⚠️ 事件 ${event} 的监听器已存在，跳过重复注册`);
         return () => {}; // 返回空清理函数
      }

      listeners.add(callback);

      if (socket.value) {
         socket.value.on(event, callback);
         return () => removeListener(event, callback);
      }
      return () => {};
   };

   const removeListener = (event, callback) => {
      const eventKey = event;
      if (eventListeners.has(eventKey)) {
         const listeners = eventListeners.get(eventKey);
         listeners.delete(callback);

         if (listeners.size === 0) {
            eventListeners.delete(eventKey);
            if (socket.value) {
               socket.value.off(event, callback);
            }
         }
      }
   };

   const subscribe = (room, stationId = null) => {
      // 防止重复订阅相同的房间
      const roomKey = stationId ? `${room}:${stationId}` : room;
      if (subscribedRooms.has(roomKey)) {
         console.log(`ℹ️ 房间 ${roomKey} 已订阅，跳过重复订阅`);
         return true;
      }

      const payload = stationId ? { room, stationId } : { room };
      const success = sendMessage("subscribe", payload);

      if (success) {
         subscribedRooms.add(roomKey);
      }

      return success;
   };

   const unsubscribe = (room) => {
      const success = sendMessage("unsubscribe", { room });
      if (success) {
         subscribedRooms.delete(room);
      }
      return success;
   };

   const broadcast = (room, event, data) => {
      return sendMessage("broadcast", { room, event, data });
   };

   /**
    * 发送需要确认的消息
    * @param {string} room - 房间名
    * @param {string} event - 事件名
    * @param {any} data - 数据
    * @returns {Promise<string>} 消息 ID
    */
   const broadcastWithAck = (room, event, data) => {
      return new Promise((resolve, reject) => {
         if (!socket.value || !isConnected.value) {
            reject(new Error("WebSocket 未连接"));
            return;
         }

         // 监听消息确认响应
         const ackHandler = (response) => {
            if (response.success && response.messageId) {
               resolve(response.messageId);
            } else {
               reject(new Error(response.error || "Message acknowledgment failed"));
            }
            // 清理监听器
            socket.value.off("message-ack-response", ackHandler);
         };

         socket.value.on("message-ack-response", ackHandler);

         // 发送带确认要求的消息
         socket.value.emit("broadcast-with-ack", { room, event, data }, (response) => {
            // 处理回调响应
            if (response && response.messageId) {
               resolve(response.messageId);
               socket.value.off("message-ack-response", ackHandler);
            }
         });

         // 设置超时
         setTimeout(() => {
            socket.value.off("message-ack-response", ackHandler);
            reject(new Error("Message acknowledgment timeout"));
         }, 10000); // 10 秒超时
      });
   };

   /**
    * 确认收到消息
    * @param {string} messageId - 消息 ID
    */
   const acknowledgeMessage = (messageId) => {
      if (socket.value && isConnected.value) {
         socket.value.emit("message-ack", { messageId });
      }
   };

   /**
    * 请求房间状态同步（用于重连后）
    * @param {string} room - 房间名
    * @param {number} sinceSequence - 可选，从此序列号之后开始同步
    * @returns {Promise<Object|null>} 房间状态
    */
   const syncRoomState = (room, sinceSequence) => {
      return new Promise((resolve, reject) => {
         if (!socket.value || !isConnected.value) {
            reject(new Error("WebSocket 未连接"));
            return;
         }

         const responseHandler = (state) => {
            resolve(state);
            socket.value.off("room-state-sync-response", responseHandler);
         };

         socket.value.on("room-state-sync-response", responseHandler);

         socket.value.emit("sync-room-state", { room, sinceSequence });

         // 设置超时
         setTimeout(() => {
            socket.value.off("room-state-sync-response", responseHandler);
            reject(new Error("Room state sync timeout"));
         }, 5000);
      });
   };

   /**
    * 获取消息历史（用于重连后补发）
    * @param {string} room - 可选，房间名
    * @param {number} limit - 限制数量
    * @returns {Promise<Array>} 消息历史
    */
   const getMessageHistory = (room, limit = 50) => {
      return new Promise((resolve, reject) => {
         if (!socket.value || !isConnected.value) {
            reject(new Error("WebSocket 未连接"));
            return;
         }

         const historyHandler = (history) => {
            resolve(history);
            socket.value.off("message-history-response", historyHandler);
         };

         socket.value.on("message-history-response", historyHandler);

         socket.value.emit("get-message-history", { room, limit });

         // 设置超时
         setTimeout(() => {
            socket.value.off("message-history-response", historyHandler);
            reject(new Error("Message history fetch timeout"));
         }, 5000);
      });
   };

   // 重新订阅房间（重连后调用）
   const resubscribeRooms = () => {
      if (subscribedRooms.size > 0) {
         console.log(`🔄 重新订阅 ${subscribedRooms.size} 个房间`);
         subscribedRooms.forEach((roomKey) => {
            const [room, stationId] = roomKey.split(":");
            const payload = stationId ? { room, stationId: parseInt(stationId) } : { room };
            sendMessage("subscribe", payload);
         });
      }
   };

   // 重连后同步状态
   const syncStateAfterReconnect = async () => {
      console.log("🔄 开始重连后的状态同步...");

      try {
         // 获取所有订阅的房间
         const roomsToSync = Array.from(subscribedRooms).map((key) => key.split(":")[0]);

         for (const room of roomsToSync) {
            try {
               // 请求房间状态同步
               const state = await syncRoomState(room);
               if (state) {
                  console.log(`📦 房间 ${room} 状态已同步:`, state);
                  // 触发房间状态更新事件
                  socket.value.emit("room-state-updated", { room, state });
               }

               // 获取消息历史
               const history = await getMessageHistory(room, 20);
               if (history && history.length > 0) {
                  console.log(`📜 房间 ${room} 获取到 ${history.length} 条历史消息`);
                  // 逐条处理历史消息
                  history.forEach((msg) => {
                     socket.value.emit(msg.event, msg.data);
                  });
               }
            } catch (error) {
               console.warn(`⚠️ 房间 ${room} 状态同步失败:`, error.message);
            }
         }

         console.log("✅ 重连后状态同步完成");
      } catch (error) {
         console.error("❌ 重连后状态同步失败:", error.message);
      }
   };

   // 获取连接状态信息
   const getConnectionInfo = () => {
      if (!socket.value) {
         return { connected: false, reason: "No socket instance" };
      }

      return {
         connected: isConnected.value,
         id: socket.value.id,
         connectedServer: socket.value.connectedServer,
         attempts: reconnectAttempts.value,
         rooms: Array.from(subscribedRooms),
         listeners: eventListeners.size,
      };
   };

   // 手动测试连接
   const ping = () => {
      if (socket.value && isConnected.value) {
         const startTime = Date.now();
         socket.value.emit("ping");
         console.log("🏓 Ping sent at", new Date(startTime).toISOString());
         return startTime;
      }
      return null;
   };

   return {
      socket: socket.value,
      isConnected,
      reconnectAttempts,
      connect,
      disconnect,
      sendMessage,
      listen,
      removeListener,
      subscribe,
      unsubscribe,
      broadcast,
      getConnectionInfo,
      ping,
   };
}

/**
 * WebSocket 自动刷新 Composable
 * 用于组件中自动监听 WebSocket 事件并刷新数据
 *
 * @param {Object} options - 配置选项
 * @param {Function} options.refreshFn - 刷新数据的函数
 * @param {Array<string>} options.rooms - 要订阅的房间列表
 * @param {Array<Object>} options.events - 要监听的事件配置 [{event: 'order-updated', rooms: ['orders', 'all']}]
 * @param {boolean} options.autoConnect - 是否自动连接，默认 true
 * @param {string} options.logPrefix - 日志前缀，默认 'WebSocket'
 *
 * @returns {Object} - 包含 unsubscribe 方法和 WebSocket 实例
 */
export function useAutoRefresh(options = {}) {
   const { refreshFn, rooms = ["orders", "all"], events = [], autoConnect = true, logPrefix = "WebSocket" } = options;

   const ws = useWebSocket();
   const unsubscribers = [];
   const isInitialized = ref(false); // 防止重复初始化

   // 连接 WebSocket
   const connect = () => {
      if (autoConnect && !isInitialized.value) {
         ws.connect();
      }
   };

   // 订阅所有房间
   const subscribeRooms = () => {
      if (!isInitialized.value) {
         rooms.forEach((room) => {
            ws.subscribe(room);
            console.log(`${logPrefix} 订阅房间：${room}`);
         });
      }
   };

   // 监听事件
   const listenEvents = () => {
      if (!isInitialized.value) {
         if (!events || events.length === 0) {
            // 如果没有配置事件，使用默认配置
            const defaultEvents = [
               { event: "order-created", rooms: ["orders", "all"] },
               { event: "order-updated", rooms: ["orders", "all"] },
               { event: "order-deleted", rooms: ["orders", "all"] },
               { event: "item-created", rooms: ["order-items", "all"] },
               { event: "item-updated", rooms: ["order-items", "all"] },
               { event: "item-deleted", rooms: ["order-items", "all"] },
            ];

            defaultEvents.forEach(({ event, rooms: eventRooms }) => {
               const unsubscribe = ws.listen(event, (data) => {
                  console.log(`${logPrefix} 📢 ${event}:`, data);
                  if (refreshFn) {
                     refreshFn(data);
                  }
               });
               unsubscribers.push(unsubscribe);
            });
         } else {
            // 使用自定义配置
            events.forEach(({ event, rooms: eventRooms }) => {
               const unsubscribe = ws.listen(event, (data) => {
                  console.log(`${logPrefix} 📢 ${event}:`, data);
                  if (refreshFn) {
                     refreshFn(data);
                  }
               });
               unsubscribers.push(unsubscribe);
            });
         }

         isInitialized.value = true;
      }
   };

   // 清理所有监听
   const cleanup = () => {
      unsubscribers.forEach((unsubscribe) => {
         try {
            unsubscribe();
         } catch (error) {
            console.warn(`${logPrefix} 清理监听器失败:`, error);
         }
      });
      unsubscribers.length = 0;

      // 注意：不清理全局 WebSocket 连接，因为可能被其他组件使用
      // 只有当明确需要断开时才调用 ws.disconnect()
      isInitialized.value = false;
   };

   // 生命周期钩子
   onMounted(() => {
      connect();
      subscribeRooms();
      listenEvents();
   });

   onUnmounted(() => {
      cleanup();
   });

   return {
      ws,
      cleanup,
   };
}

/**
 * 全局 WebSocket 实例（用于浏览器 Console 调试）
 * 在应用启动时初始化
 */
let globalWebSocket = null;

/**
 * 初始化全局 WebSocket 实例
 * 应在 main.js 中调用一次
 */
export function initGlobalWebSocket() {
   if (!globalWebSocket) {
      globalWebSocket = useWebSocket();
      // ✅ 修复：创建实例后立即连接
      globalWebSocket.connect();
      // 暴露到 window 对象，方便在 Console 中访问
      if (typeof window !== "undefined") {
         window.ws = globalWebSocket;
         window.subscribedRooms = subscribedRooms;
         window.eventListeners = eventListeners;
         console.log("🌐 全局 WebSocket 已初始化并自动连接");

         // ✅ 新增：连接成功后自动订阅默认房间
         // 等待连接成功后再订阅
         const checkConnectionAndSubscribe = () => {
            if (globalWebSocket.isConnected.value) {
               // 自动订阅常用房间
               subscribeToDefaultRooms();
               console.log("✅ 已自动订阅默认房间");
            } else {
               // 如果还没连接成功，等待 100ms 后重试
               setTimeout(checkConnectionAndSubscribe, 100);
            }
         };
         checkConnectionAndSubscribe();
      }
   }
   return globalWebSocket;
}

/**
 * 订阅默认的房间列表
 */
function subscribeToDefaultRooms() {
   const defaultRooms = ["orders", "order-items", "dishes", "all"];

   defaultRooms.forEach((room) => {
      if (globalWebSocket) {
         const success = globalWebSocket.subscribe(room);
         if (success) {
            console.log(`✅ 自动订阅房间：${room}`);
         }
      }
   });
}

/**
 * 获取全局 WebSocket 实例
 */
export function getGlobalWebSocket() {
   return globalWebSocket || initGlobalWebSocket();
}
