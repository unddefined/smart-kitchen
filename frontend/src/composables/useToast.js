import { reactive, inject } from "vue";

/**
 * Toast 提示组合式函数
 * 提供统一的 toast 提示管理功能
 */
export function useToast() {
   // 尝试注入全局 toast 方法
   const globalToast = inject("toast", null);

   // 如果存在全局 toast，直接使用；否则创建本地实例
   if (globalToast) {
      // 创建一个响应式对象用于模板绑定
      const toast = reactive({
         visible: false,
         message: "",
         type: "success",
         duration: 3000,
      });

      // 统一的 toast 对象 API - 直接附加到 toast 对象上
      toast.success = (msg, duration) => globalToast.toast.success(msg, duration);
      toast.error = (msg, duration) => globalToast.toast.error(msg, duration);
      toast.info = (msg, duration) => globalToast.toast.info(msg, duration);

      return {
         toast,
         showToast: (msg, type, duration) => globalToast.toast[type === "error" ? "error" : type === "info" ? "info" : "success"](msg, duration),
         showSuccess: (msg, duration) => globalToast.toast.success(msg, duration),
         showError: (msg, duration) => globalToast.toast.error(msg, duration),
         showInfo: (msg, duration) => globalToast.toast.info(msg, duration),
         hideToast: () => {}, // 占位
      };
   }

   // 本地实例（仅 App.vue 使用）
   const toast = reactive({
      visible: false,
      message: "",
      type: "success",
      duration: 3000,
   });

   /**
    * 显示 toast 提示
    * @param {string} message - 消息内容
    * @param {string} type - 类型：success | error | info
    * @param {number} duration - 持续时间（毫秒）
    */
   const showToast = (message, type = "success", duration = 3000) => {
      toast.message = message;
      toast.type = type;
      toast.duration = duration;
      toast.visible = true;
      console.log("showToast", message, type, duration);
   };

   /**
    * 显示成功提示
    * @param {string} message - 消息内容
    * @param {number} duration - 持续时间（毫秒）
    */
   const showSuccess = (message, duration = 3000) => {
      showToast(message, "success", duration);
   };

   /**
    * 显示错误提示
    * @param {string} message - 消息内容
    * @param {number} duration - 持续时间（毫秒）
    */
   const showError = (message, duration = 3000) => {
      showToast(message, "error", duration);
   };

   /**
    * 显示信息提示
    * @param {string} message - 消息内容
    * @param {number} duration - 持续时间（毫秒）
    */
   const showInfo = (message, duration = 3000) => {
      showToast(message, "info", duration);
   };

   /**
    * 隐藏 toast
    */
   const hideToast = () => {
      toast.visible = false;
   };

   // 统一的 toast 对象 API - 直接附加到 toast 对象上
   toast.success = (message, duration) => showSuccess(message, duration);
   toast.error = (message, duration) => showError(message, duration);
   toast.info = (message, duration) => showInfo(message, duration);

   return {
      toast,
      showToast,
      showSuccess,
      showError,
      showInfo,
      hideToast,
   };
}
