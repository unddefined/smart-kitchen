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

// 默认导出，方便直接导入OrderService等服务
import { OrderService } from "./orderService.js";  // 导入类
import DishService from "./dishService.js";
import ServingService from "./servingService.js";
import api from "./api.js";

export default {
  OrderService,
  DishService,
  ServingService,
  api,
};
