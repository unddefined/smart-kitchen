import { useAutoRefresh } from "@/utils/websocket";

/**
 * 订单自动刷新 Composable
 * 专门用于订单相关页面的自动刷新逻辑
 * 
 * @param {Object} options - 配置选项
 * @param {Function} options.refreshFn - 刷新数据的函数（无参数）
 * @param {string} options.mode - 模式：'list'(列表页) | 'detail'(详情页)
 * @param {number|string} options.orderId - 订单 ID（仅详情页需要）
 * @param {boolean} options.autoConnect - 是否自动连接 WebSocket，默认 true
 * 
 * @returns {Object} - WebSocket 实例和清理方法
 */
export function useOrderAutoRefresh(options = {}) {
  const {
    refreshFn,
    mode = 'list',
    orderId = null,
    autoConnect = true,
  } = options;

  // 根据模式决定监听的事件
  const getEventsConfig = () => {
    if (mode === 'detail' && orderId) {
      // 详情页模式：只监听当前订单的变更
      return [
        {
          event: 'order-updated',
          filter: (data) => data.data?.id === parseInt(orderId),
        },
        {
          event: 'item-updated',
          filter: (data) => data.data?.orderId === parseInt(orderId),
        },
        {
          event: 'item-created',
          filter: (data) => data.data?.orderId === parseInt(orderId),
        },
        {
          event: 'item-deleted',
          filter: (data) => data.data?.orderId === parseInt(orderId),
        },
      ];
    } else {
      // 列表页模式：监听所有订单变更
      return [
        { event: 'order-created' },
        { event: 'order-updated' },
        { event: 'order-deleted' },
        { event: 'item-created' },
        { event: 'item-updated' },
        { event: 'item-deleted' },
      ];
    }
  };

  // 创建包装后的刷新函数
  const wrappedRefresh = (data) => {
    if (mode === 'detail' && orderId) {
      // 详情页需要检查是否是当前订单
      const events = getEventsConfig();
      const matchEvent = events.find(e => e.filter && e.filter(data));
      
      if (matchEvent || !data) {
        console.log('🔄 刷新当前订单详情');
        refreshFn();
      } else {
        console.log('⏭️ 跳过非当前订单的更新');
      }
    } else {
      // 列表页直接刷新
      console.log('🔄 刷新订单列表');
      refreshFn();
    }
  };

  // 使用通用的 AutoRefresh composable
  return useAutoRefresh({
    refreshFn: wrappedRefresh,
    rooms: ['orders', 'order-items', 'all'],
    events: getEventsConfig(),
    autoConnect,
    logPrefix: '[OrderAutoRefresh]',
  });
}
