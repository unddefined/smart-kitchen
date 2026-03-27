// API 常量定义

// 导入统一的优先级配置
import { PRIORITY_CONFIG, getPriorityConfig, getPriorityLabel, getPriorityClass } from "./priority";

// 导出旧的 PRIORITY_LEVELS 以保持向后兼容（推荐使用 PRIORITY_CONFIG）
export const PRIORITY_LEVELS = {
   URGENT: 3, // 红色 - 催菜
   WAIT: 2, // 黄色 - 等一下
   NORMAL: 1, // 绿色 - 不急
   PENDING: 0, // 灰色 - 未起菜
   SERVED: -1, // 灰色 - 已出
};

// 导出新的优先级配置和工具函数
export { PRIORITY_CONFIG, getPriorityConfig, getPriorityLabel, getPriorityClass };

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
