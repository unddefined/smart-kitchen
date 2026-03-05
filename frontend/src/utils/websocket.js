import { io } from "socket.io-client";
import { ref, onMounted, onUnmounted } from "vue";

const socket = ref(null);
const isConnected = ref(false);
const reconnectAttempts = ref(0);

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
    });

    socket.value.on("disconnect", (reason) => {
      console.warn("❌ WebSocket 断开连接:", reason);
      isConnected.value = false;
    });

    socket.value.on("reconnect", (attemptNumber) => {
      console.log(`🔄 重新连接成功，尝试次数：${attemptNumber}`);
      reconnectAttempts.value = attemptNumber;
    });

    socket.value.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 尝试重新连接... (${attemptNumber})`);
    });

    socket.value.on("reconnect_failed", () => {
      console.error("❌ 重新连接失败");
    });

    // 错误处理
    socket.value.on("connect_error", (error) => {
      console.error("❌ 连接错误:", error.message);
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
    if (socket.value) {
      socket.value.on(event, callback);
      return () => removeListener(event, callback);
    }
    return () => { };
  };

  const removeListener = (event, callback) => {
    if (socket.value) {
      socket.value.off(event, callback);
    }
  };

  const subscribe = (room, stationId = null) => {
    const payload = stationId ? { room, stationId } : { room };
    return sendMessage('subscribe', payload);
  };

  const unsubscribe = (room) => {
    return sendMessage('unsubscribe', { room });
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

  // 连接 WebSocket
  const connect = () => {
    if (autoConnect) {
      ws.connect();
    }
  };

  // 订阅所有房间
  const subscribeRooms = () => {
    rooms.forEach(room => {
      ws.subscribe(room);
      console.log(`${logPrefix} 订阅房间：${room}`);
    });
  };

  // 监听事件
  const listenEvents = () => {
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

    if (autoConnect) {
      ws.disconnect();
    }
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
