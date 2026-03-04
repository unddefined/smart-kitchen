import { ref, reactive } from 'vue';

/**
 * Toast 提示组合式函数
 * 提供统一的 toast 提示管理功能
 */
export function useToast() {
  const toast = reactive({
    visible: false,
    message: '',
    type: 'success',
    duration: 3000,
  });

  /**
   * 显示 toast 提示
   * @param {string} message - 消息内容
   * @param {string} type - 类型：success | error | info
   * @param {number} duration - 持续时间（毫秒）
   */
  const showToast = (message, type = 'success', duration = 3000) => {
    toast.message = message;
    toast.type = type;
    toast.duration = duration;
    toast.visible = true;
  };

  /**
   * 显示成功提示
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间（毫秒）
   */
  const showSuccess = (message, duration = 3000) => {
    showToast(message, 'success', duration);
  };

  /**
   * 显示错误提示
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间（毫秒）
   */
  const showError = (message, duration = 3000) => {
    showToast(message, 'error', duration);
  };

  /**
   * 显示信息提示
   * @param {string} message - 消息内容
   * @param {number} duration - 持续时间（毫秒）
   */
  const showInfo = (message, duration = 3000) => {
    showToast(message, 'info', duration);
  };

  /**
   * 隐藏 toast
   */
  const hideToast = () => {
    toast.visible = false;
  };

  return {
    toast,
    showToast,
    showSuccess,
    showError,
    showInfo,
    hideToast,
  };
}
