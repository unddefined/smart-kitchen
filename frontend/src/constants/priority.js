/**
 * 优先级配置常量
 * 用于统一管理菜品优先级相关的配置
 */

export const PRIORITY_CONFIG = {
   URGENT: {
      value: 3,
      label: "即上/催菜",
      class: "bg-red-300",
      color: "red",
      tailwind: "#ff9a85",
   },
   WAIT: {
      value: 2,
      label: "等一下",
      class: "bg-yellow-300",
      color: "yellow",
      tailwind: "#ffdb66",
   },
   LOW: {
      value: 1,
      label: "不急",
      class: "bg-green-300",
      color: "green",
      tailwind: "#c9e68c",
   },
   PENDING: {
      value: 0,
      label: "未起菜",
      class: "white",
      color: "gray",
      tailwind: "#f3f4f6",
   },
   SERVED: {
      value: -1,
      label: "已出",
      class: "bg-gray-200",
      color: "darkgray",
      tailwind: "#6b7280",
   },
};

/**
 * 根据优先级值获取配置
 * @param {number} priority - 优先级值 (-1, 0, 1, 2, 3)
 * @returns {Object} 优先级配置对象
 */
export function getPriorityConfig(priority) {
   const config = Object.values(PRIORITY_CONFIG).find((config) => config.value === priority);
   return (
      config || {
         value: priority,
         label: "未知",
         class: "bg-gray-300",
         color: "gray",
         tailwind: "#9ca3af",
      }
   );
}

/**
 * 获取优先级的显示标签
 * @param {number} priority - 优先级值
 * @returns {string} 标签文本
 */
export function getPriorityLabel(priority) {
   return getPriorityConfig(priority).label;
}

/**
 * 获取优先级对应的颜色类名
 * @param {number} priority - 优先级值
 * @returns {string} Tailwind CSS 类名
 */
export function getPriorityClass(priority) {
   return getPriorityConfig(priority).class;
}

/**
 * 获取优先级对应的颜色名称
 * @param {number} priority - 优先级值
 * @returns {string} 颜色名称
 */
export function getPriorityColor(priority) {
   return getPriorityConfig(priority).color;
}

/**
 * 按优先级排序（降序）
 * @param {Array} items - 包含 priority 字段的数组
 * @returns {Array} 排序后的数组
 */
export function sortByPriority(items) {
   return [...items].sort((a, b) => {
      const priorityA = a.priority ?? a.currentPriority ?? 0;
      const priorityB = b.priority ?? b.currentPriority ?? 0;
      return priorityB - priorityA;
   });
}

/**
 * 筛选指定优先级的菜品
 * @param {Array} items - 菜品数组
 * @param {number|string} priorityLevel - 优先级级别 ('URGENT', 'WAIT', 'LOW', 'PENDING', 'SERVED')
 * @returns {Array} 筛选后的数组
 */
export function filterByPriorityLevel(items, priorityLevel) {
   const targetValue = typeof priorityLevel === "string" ? PRIORITY_CONFIG[priorityLevel]?.value : priorityLevel;

   if (targetValue === undefined) return [];

   return items.filter((item) => (item.priority ?? item.currentPriority ?? 0) === targetValue);
}
