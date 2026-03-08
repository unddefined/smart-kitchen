// API 基础配置和服务
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://8.145.34.30:3001";

// 导入 WebSocket 工具
import { useWebSocket } from "@/utils/websocket";

// 📡 广播防抖机制 - 避免批量操作时频繁广播
const broadcastDebounceTimers = {};
const BROADCAST_DEBOUNCE_DELAY = 1000; // 1000ms 防抖延迟

// 通用请求函数
async function request(url, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 处理空响应（特别是 DELETE 请求可能返回 204 No Content）
    const contentType = response.headers.get("content-type");
    let data = null;

    if (contentType && contentType.includes("application/json")) {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    }

    // 📢 写操作自动触发 WebSocket 广播（带防抖）
    const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (writeMethods.includes(options.method?.toUpperCase())) {
      debouncedBroadcast(url, options.method, data);
    }

    return data;
  } catch (error) {
    console.error("API 请求失败:", error);
    throw error;
  }
}

// 防抖广播 - 合并短时间内的多次广播
function debouncedBroadcast(url, method, responseData) {
  const resourceInfo = extractResourceInfo(url);
  const debounceKey = `${resourceInfo.resource}-${method}`;

  // 清除之前的定时器
  if (broadcastDebounceTimers[debounceKey]) {
    clearTimeout(broadcastDebounceTimers[debounceKey]);
  }

  // 设置新的定时器
  broadcastDebounceTimers[debounceKey] = setTimeout(() => {
    performBroadcast(url, method, responseData);
    delete broadcastDebounceTimers[debounceKey];
  }, BROADCAST_DEBOUNCE_DELAY);

  console.log('⏱️ 广播已防抖:', {
    key: debounceKey,
    delay: BROADCAST_DEBOUNCE_DELAY + 'ms',
  });
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
    ws.broadcast('all', 'global-change', {
      resource: resourceInfo.resource,
      action: methodToEvent(method),
      timestamp: new Date().toISOString(),
      data: responseData.data || responseData,
    });

    console.log('📢 广播数据变更:', {
      type: eventType,
      method: method.toUpperCase(),
      url: url,
      data: responseData.data || responseData,
    });
  } catch (error) {
    console.warn('⚠️ WebSocket 广播失败:', error.message);
  }
}

// 从 URL 提取资源信息
function extractResourceInfo(url) {
  // 匹配 /api/orders/123/items 或 /api/orders/123 等
  const patterns = [
    { regex: /^\/api\/orders\/(\d+)\/items/, resource: 'order-items', room: 'order-items' },
    { regex: /^\/api\/orders\/(\d+)/, resource: 'orders', room: 'orders' },
    { regex: /^\/api\/dishes\/(\d+)/, resource: 'dishes', room: 'dishes' },
    { regex: /^\/api\/users\/(\d+)/, resource: 'users', room: 'users' },
    { regex: /^\/api\/serving\/(.*)/, resource: 'serving', room: 'serving' },
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      return { resource: pattern.resource, room: pattern.room, id: match[1] };
    }
  }

  // 默认情况
  const parts = url.split('/').filter(Boolean);
  const resource = parts[parts.length - 1] || 'unknown';
  return { resource, room: resource };
}

// HTTP 方法转换为事件后缀
function methodToEvent(method) {
  const map = {
    'POST': 'created',
    'PUT': 'updated',
    'PATCH': 'updated',
    'DELETE': 'deleted',
  };
  return map[method.toUpperCase()] || 'changed';
}

// API服务对象
export const api = {
  // 订单相关API
  orders: {
    // 创建订单
    create: (orderData) =>
      request("/api/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      }),

    // 获取订单列表
    list: (queryParams) => {
      const queryString = queryParams
        ? `?${new URLSearchParams(queryParams).toString()}`
        : "";
      return request(`/api/orders${queryString}`);
    },

    // 获取订单详情
    get: (id) => request(`/api/orders/${id}`),

    // 更新订单状态
    updateStatus: (id, status) =>
      request(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),

    // 更新订单信息（人数、台号、状态、用餐时间等）
    update: (id, updateData) =>
      request(`/api/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      }),

    // 取消订单
    cancel: (id) =>
      request(`/api/orders/${id}/cancel`, {
        method: "PATCH",
      }),

    // 起菜
    start: (id) =>
      request(`/api/orders/${id}/start`, {
        method: "PATCH",
      }),

    // 催菜
    urge: (id) =>
      request(`/api/orders/${id}/urge`, {
        method: "PATCH",
      }),

    // 暂停
    pause: (id) =>
      request(`/api/orders/${id}/pause`, {
        method: "PATCH",
      }),

    // 恢复（催菜后自动恢复）
    resume: (id) =>
      request(`/api/orders/${id}/resume`, {
        method: "POST",
      }),

    // 完成订单
    complete: (id) =>
      request(`/api/orders/${id}/complete`, {
        method: "PATCH",
      }),

    // 删除订单
    delete: (id) =>
      request(`/api/orders/${id}`, {
        method: "DELETE",
      }),
  },

  // 订单菜品相关API
  orderItems: {
    // 获取订单的所有菜品
    listByOrder: (orderId) => request(`/api/orders/${orderId}/items`),

    // 添加菜品到订单
    create: (orderId, itemData) =>
      request(`/api/orders/${orderId}/items`, {
        method: "POST",
        body: JSON.stringify(itemData),
      }),

    // 更新订单菜品信息（份量、备注等）
    update: (itemId, orderId, itemData) =>
      request(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(itemData),
      }),

    // 删除订单菜品
    delete: (itemId, orderId) =>
      request(`/api/orders/${orderId}/items/${itemId}`, {
        method: "DELETE",
      }),

    // 更新菜品优先级（催菜功能）- 使用 serving 模块的接口
    updatePriority: (itemId, priority, reason) =>
      request(`/api/serving/items/${itemId}/priority`, {
        method: "PUT",
        body: JSON.stringify({ priority, reason }),
      }),

    // 标记菜品为已出菜
    markAsServed: (itemId) =>
      request(`/api/serving/items/${itemId}/serve`, {
        method: "POST",
      }),
  },

  // 菜品相关API
  dishes: {
    // 获取菜品列表
    list: () => request("/api/dishes"),

    // 获取按分类分组的菜品（按上菜顺序）
    groupedByCategory: () => request("/api/dishes/grouped-by-category"),

    // 获取菜品详情
    get: (id) => request(`/api/dishes/${id}`),

    // 创建菜品
    create: (dishData) =>
      request("/api/dishes", {
        method: "POST",
        body: JSON.stringify(dishData),
      }),

    // 更新菜品
    update: (id, dishData) =>
      request(`/api/dishes/${id}`, {
        method: "PUT",
        body: JSON.stringify(dishData),
      }),

    // 删除菜品
    delete: (id) =>
      request(`/api/dishes/${id}`, {
        method: "DELETE",
      }),

    // 搜索菜品
    search: (query) =>
      request(`/api/dishes/search?q=${encodeURIComponent(query)}`),
  },

  // 工位相关API
  stations: {
    // 获取工位列表
    list: () => request("/api/dishes/stations"),

    // 获取工位详情
    get: (id) => request(`/api/dishes/stations/${id}`),
  },

  // 菜品分类相关API
  categories: {
    // 获取分类列表
    list: () => request("/api/dishes/categories"),

    // 获取分类详情
    get: (id) => request(`/api/dishes/categories/${id}`),
  },

  // 出餐相关API
  serving: {
    // 获取待处理菜品列表
    getPendingItems: () => request("/api/serving/pending"),

    // 获取已出菜品列表
    getServedItems: () => request("/api/serving/served"),

    // 获取订单出餐状态
    getOrderStatus: (orderId) => request(`/api/serving/status/${orderId}`),

    // 获取出餐提醒
    getAlerts: () => request("/api/serving/alerts"),

    // 获取紧急菜品
    detectUrgent: () => request("/api/serving/urgent-dishes"),

    // 自动调整优先级
    autoAdjustPriorities: (orderId) =>
      request(`/api/serving/orders/${orderId}/auto-adjust`, {
        method: "POST",
      }),

    // 标记菜品完成切配（pending → prep）
    completePrep: (itemId) =>
      request(`/api/serving/items/${itemId}/complete-prep`, {
        method: "POST",
      }),

    // 批量标记菜品已上菜
    serveDishes: (itemIds) =>
      request("/api/serving/items/serve-batch", {
        method: "POST",
        body: JSON.stringify({ itemIds }),
      }),

    // 标记菜品已上菜（单个）
    serveDish: (itemId) =>
      request(`/api/serving/items/${itemId}/serve`, {
        method: "POST",
      }),
  },

  // 用户相关API
  users: {
    // 获取用户列表
    list: () => request("/api/users"),

    // 获取用户详情
    get: (id) => request(`/api/users/${id}`),

    // 创建用户
    create: (userData) =>
      request("/api/users", {
        method: "POST",
        body: JSON.stringify(userData),
      }),

    // 更新用户
    update: (id, userData) =>
      request(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(userData),
      }),

    // 删除用户
    delete: (id) =>
      request(`/api/users/${id}`, {
        method: "DELETE",
      }),
  },

  // 健康检查
  health: {
    check: () => request("/health"),
  },
};

// 出餐优先级常量
export const PRIORITY_LEVELS = {
  URGENT: 3, // 红色 - 催菜
  WAIT: 2, // 黄色 - 等一下
  NORMAL: 1, // 绿色 - 不急
  PENDING: 0, // 灰色 - 未起菜
  SERVED: -1, // 灰色 - 已出
};

// 订单状态常量
export const ORDER_STATUS = {
  CREATED: "created",
  STARTED: "started",
  SERVING: "serving",
  URGED: "urged",
  DONE: "done",
  CANCELLED: "cancelled",
};

// 订单菜品状态常量
export const ORDER_ITEM_STATUS = {
  PENDING: "pending",
  PREPARING: "preparing",
  READY: "ready",
  SERVED: "served",
};

// 工位常量
export const STATIONS = {
  HOT_DISH: "热菜",
  GARNISH: "打荷",
  COLD_DISH: "凉菜",
  STEAM: "蒸菜",
  DIM_SUM: "点心",
  CUTTING: "切配",
};

export default api;
