// API 常量定义

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
