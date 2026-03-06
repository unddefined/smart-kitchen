import { ref, reactive, inject } from 'vue';

/**
 * Toast 提示组合式函数
 * 提供统一的 toast 提示管理功能
 */
export function useToast() {
  // 尝试注入全局 toast 方法
  const globalToast = inject('toast', null);
  
  // 如果存在全局 toast，直接使用；否则创建本地实例
  if (globalToast) {
    return {
      toast: reactive({
        visible: false, // 占位，实际不使用
        message: '',
        type: 'success',
        duration: 3000,
      }),
      showToast: globalToast.showToast,
      showSuccess: globalToast.showSuccess,
      showError: globalToast.showError,
      showInfo: globalToast.showInfo,
      hideToast: () => {}, // 占位
    };
  }
  
  // 本地实例（仅 App.vue 使用）
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
    console.log('showToast', message, type, duration);
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