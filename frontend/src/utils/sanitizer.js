import DOMPurify from "dompurify";

/**
 * XSS 防护工具函数
 * 用于清理和验证用户输入，防止跨站脚本攻击
 */

/**
 * 清理字符串输入
 * @param {string} input - 需要清理的输入字符串
 * @returns {string} - 清理后的字符串
 */
export function sanitizeString(input) {
   if (typeof input !== "string") {
      return input;
   }

   // 使用 DOMPurify 清理 HTML 标签和脚本
   return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // 不允许任何 HTML 标签
      ALLOWED_ATTR: [], // 不允许任何属性
   });
}

/**
 * 清理对象的所有字符串属性
 * @param {Object} obj - 需要清理的对象
 * @returns {Object} - 清理后的对象
 */
export function sanitizeObject(obj) {
   if (!obj || typeof obj !== "object") {
      return obj;
   }

   const sanitized = {};

   for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
         const value = obj[key];

         if (typeof value === "string") {
            sanitized[key] = sanitizeString(value);
         } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item) => (typeof item === "string" ? sanitizeString(item) : item));
         } else if (value && typeof value === "object") {
            sanitized[key] = sanitizeObject(value);
         } else {
            sanitized[key] = value;
         }
      }
   }

   return sanitized;
}

/**
 * 清理数组中的每个对象
 * @param {Array} arr - 需要清理的数组
 * @returns {Array} - 清理后的数组
 */
export function sanitizeArray(arr) {
   if (!Array.isArray(arr)) {
      return arr;
   }

   return arr.map((item) => {
      if (typeof item === "string") {
         return sanitizeString(item);
      } else if (item && typeof item === "object") {
         return sanitizeObject(item);
      }
      return item;
   });
}

/**
 * 验证并清理订单菜品数据
 * @param {Object} itemData - 订单菜品数据
 * @returns {Object} - 清理后的数据
 */
export function sanitizeOrderItemData(itemData) {
   if (!itemData || typeof itemData !== "object") {
      return itemData;
   }

   const sanitized = { ...itemData };

   // 清理备注字段
   if (sanitized.remark) {
      sanitized.remark = sanitizeString(sanitized.remark);
   }

   // 清理其他可能的字符串字段
   if (sanitized.name) {
      sanitized.name = sanitizeString(sanitized.name);
   }

   if (sanitized.specialInstructions) {
      sanitized.specialInstructions = sanitizeString(sanitized.specialInstructions);
   }

   return sanitized;
}

/**
 * 验证并清理订单数据
 * @param {Object} orderData - 订单数据
 * @returns {Object} - 清理后的数据
 */
export function sanitizeOrderData(orderData) {
   if (!orderData || typeof orderData !== "object") {
      return orderData;
   }

   const sanitized = { ...orderData };

   // 清理台号字段
   if (sanitized.hallNumber) {
      sanitized.hallNumber = sanitizeString(sanitized.hallNumber);
   }

   // 清理备注字段
   if (sanitized.remark) {
      sanitized.remark = sanitizeString(sanitized.remark);
   }

   // 清理用餐时间字段
   if (sanitized.diningTime) {
      sanitized.diningTime = sanitizeString(sanitized.diningTime);
   }

   return sanitized;
}

/**
 * 验证并清理用户数据
 * @param {Object} userData - 用户数据
 * @returns {Object} - 清理后的数据
 */
export function sanitizeUserData(userData) {
   if (!userData || typeof userData !== "object") {
      return userData;
   }

   const sanitized = { ...userData };

   // 清理用户名
   if (sanitized.username) {
      sanitized.username = sanitizeString(sanitized.username);
   }

   // 清理昵称
   if (sanitized.nickname) {
      sanitized.nickname = sanitizeString(sanitized.nickname);
   }

   // 清理邮箱
   if (sanitized.email) {
      sanitized.email = sanitizeString(sanitized.email);
   }

   // 清理手机号
   if (sanitized.phone) {
      sanitized.phone = sanitizeString(sanitized.phone);
   }

   return sanitized;
}

/**
 * 验证并清理菜品数据
 * @param {Object} dishData - 菜品数据
 * @returns {Object} - 清理后的数据
 */
export function sanitizeDishData(dishData) {
   if (!dishData || typeof dishData !== "object") {
      return dishData;
   }

   const sanitized = { ...dishData };

   // 清理菜品名称
   if (sanitized.name) {
      sanitized.name = sanitizeString(sanitized.name);
   }

   // 清理描述
   if (sanitized.description) {
      sanitized.description = sanitizeString(sanitized.description);
   }

   // 清理分类名称
   if (sanitized.categoryName) {
      sanitized.categoryName = sanitizeString(sanitized.categoryName);
   }

   return sanitized;
}
