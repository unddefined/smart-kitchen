// API 基础配置和服务
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://8.145.34.30:3001";

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

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API请求失败:", error);
    throw error;
  }
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

    // 更新订单菜品
    update: (itemId, itemData) =>
      request(`/api/order-items/${itemId}`, {
        method: "PUT",
        body: JSON.stringify(itemData),
      }),

    // 删除订单菜品
    delete: (itemId) =>
      request(`/api/order-items/${itemId}`, {
        method: "DELETE",
      }),

    // 更新菜品优先级（催菜功能）
    updatePriority: (itemId, priority, reason) =>
      request(`/api/order-items/${itemId}/priority`, {
        method: "PUT",
        body: JSON.stringify({ priority, reason }),
      }),

    // 标记菜品为已出菜
    markAsServed: (itemId) =>
      request(`/api/order-items/${itemId}/serve`, {
        method: "PUT",
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

    // 标记菜品已上菜（任意状态 → served）
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
