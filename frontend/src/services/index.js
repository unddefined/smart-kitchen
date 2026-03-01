// 统一导出所有服务
export { default as api } from "./api.js";
export { default as ServingService } from "./servingService.js";
export { OrderService } from "./orderService.js";  // 导出类而不是实例
export { default as DishService } from "./dishService.js";

// 导出所有常量
export {
  PRIORITY_LEVELS,
  ORDER_STATUS,
  ORDER_ITEM_STATUS,
  STATIONS,
} from "./api.js";

// 注意：为了避免导入方式混淆，此处不提供默认导出
// 推荐使用命名导入：import { OrderService } from "@/services"
