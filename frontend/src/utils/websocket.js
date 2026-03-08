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
    // 生产环境使用服务器地址
    if (import.meta.env.PROD) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}/ws`;
    }
    // 开发环境使用本地地址
    return import.meta.env.VITE_WS_URL || "ws://localhost:3001/ws";
  };

  const connect = (url = null) => {
    // 防止重复连接
    if (isConnecting || (socket.value && isConnected.value)) {
      console.log('⚠️ WebSocket 已在连接或已连接，跳过连接');
      return;
    }

    isConnecting = true;
    const wsUrl = url || getWebSocketUrl();
    console.log('Connecting to WebSocket:', wsUrl);

    socket.value = io(wsUrl, {
      transports: ["websocket", "polling"], // 支持多种传输方式
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
    });

    socket.value.on("connect", () => {
      console.log("✅ WebSocket 连接成功");
      isConnected.value = true;
      reconnectAttempts.value = 0;
      isConnecting = false;
    });

    socket.value.on("disconnect", (reason) => {
      console.warn("❌ WebSocket 断开连接:", reason);
      isConnected.value = false;
      isConnecting = false;
    });

    socket.value.on("reconnect", (attemptNumber) => {
      console.log(`🔄 重新连接成功，尝试次数：${attemptNumber}`);
      reconnectAttempts.value = attemptNumber;
      isConnecting = false;
    });

    socket.value.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 尝试重新连接... (${attemptNumber})`);
    });

    socket.value.on("reconnect_failed", () => {
      console.error("❌ 重新连接失败");
      isConnecting = false;
    });

    // 错误处理
    socket.value.on("connect_error", (error) => {
      console.error("❌ 连接错误:", error.message);
      isConnecting = false;
    });

    // 监听订阅成功
    socket.value.on("subscribed", (data) => {
      console.log("📡 订阅成功:", data);
    });
  };

  const disconnect = () => {
    if (socket.value) {
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
    const success = sendMessage('subscribe', payload);
    
    if (success) {
      subscribedRooms.add(roomKey);
    }
    
    return success;
  };

  const unsubscribe = (room) => {
    const success = sendMessage('unsubscribe', { room });
    if (success) {
      subscribedRooms.delete(room);
    }
    return success;
  };

  const broadcast = (room, event, data) => {
    return sendMessage('broadcast', { room, event, data });
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
  const {
    refreshFn,
    rooms = ['orders', 'all'],
    events = [],
    autoConnect = true,
    logPrefix = 'WebSocket',
  } = options;

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
      rooms.forEach(room => {
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
          { event: 'order-created', rooms: ['orders', 'all'] },
          { event: 'order-updated', rooms: ['orders', 'all'] },
          { event: 'order-deleted', rooms: ['orders', 'all'] },
          { event: 'item-created', rooms: ['order-items', 'all'] },
          { event: 'item-updated', rooms: ['order-items', 'all'] },
          { event: 'item-deleted', rooms: ['order-items', 'all'] },
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
    unsubscribers.forEach(unsubscribe => {
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
