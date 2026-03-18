/**
 * 前端全局错误处理工具
 * 提供统一的 API 错误拦截和用户友好的错误提示
 */

// 错误类型映射（后端返回的 error.type）
const ERROR_TYPE_MAP = {
   // HTTP 错误
   HTTP_ERROR: "请求错误",
   INTERNAL_ERROR: "服务器错误",

   // Prisma 相关错误
   PRISMA_ERROR: "数据库操作失败",
   RECORD_NOT_FOUND: "记录不存在",
   UNIQUE_CONSTRAINT: "数据重复",

   // 业务错误
   VALIDATION_ERROR: "数据验证失败",
   BUSINESS_ERROR: "业务逻辑错误",
   PERMISSION_DENIED: "权限不足",

   // 网络错误
   NETWORK_ERROR: "网络连接失败",
   TIMEOUT_ERROR: "请求超时",
};

/**
 * 处理 API 响应错误
 * @param {Response} response - fetch 响应对象
 * @returns {Promise<never>} 抛出格式化的错误
 */
export async function handleResponseError(response) {
   let errorMessage = `HTTP error! status: ${response.status}`;
   let errorType = "HTTP_ERROR";
   let statusCode = response.status;

   try {
      // 尝试解析后端返回的错误信息
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
         const errorData = await response.json();

         // 使用后端返回的统一错误格式
         if (errorData.error) {
            errorMessage = errorData.error.message || errorMessage;
            errorType = errorData.error.type || errorType;
            statusCode = errorData.error.statusCode || statusCode;
         } else if (errorData.message) {
            // 兼容其他错误格式
            errorMessage = errorData.message;
         }
      }
   } catch (parseError) {
      // 无法解析 JSON，使用默认错误信息
      console.warn("无法解析错误响应:", parseError);
   }

   // 创建格式化错误对象
   const formattedError = new Error(errorMessage);
   formattedError.type = errorType;
   formattedError.statusCode = statusCode;
   formattedError.userMessage = getUserFriendlyMessage(errorType, errorMessage);

   return Promise.reject(formattedError);
}

/**
 * 处理网络错误（fetch 抛出的异常）
 * @param {Error} error - 原始错误
 * @returns {Error} 格式化后的错误
 */
export function handleNetworkError(error) {
   let errorType = "NETWORK_ERROR";
   let userMessage = "网络连接失败，请检查网络或服务器状态";

   // 判断是否是超时错误
   if (error.name === "AbortError") {
      errorType = "TIMEOUT_ERROR";
      userMessage = "请求超时，请稍后重试";
   }

   // 判断是否是 CORS 错误
   if (error.message?.includes("Failed to fetch")) {
      userMessage = "无法连接到服务器，请检查后端服务是否正常运行";
   }

   const formattedError = new Error(error.message);
   formattedError.type = errorType;
   formattedError.originalError = error;
   formattedError.userMessage = userMessage;

   return formattedError;
}

/**
 * 获取用户友好的错误消息
 * @param {string} errorType - 错误类型
 * @param {string} defaultMessage - 默认错误消息
 * @returns {string} 用户友好的错误消息
 */
function getUserFriendlyMessage(errorType, defaultMessage) {
   const prefix = ERROR_TYPE_MAP[errorType];
   if (prefix) {
      return `${prefix}: ${defaultMessage}`;
   }
   return defaultMessage;
}

/**
 * 显示错误提示（集成到 UI）
 * @param {string|Error} error - 错误或错误消息
 * @param {Function} customHandler - 自定义处理函数（可选）
 */
export function showError(error, customHandler) {
   const errorMessage = error?.userMessage || error?.message || String(error);

   // 如果提供了自定义处理函数，使用自定义处理
   if (customHandler) {
      customHandler(errorMessage, error);
      return;
   }

   // 默认控制台输出
   console.error("❌ 错误:", errorMessage);

   // TODO: 集成到 UI 通知系统（如 Element Plus Message、Ant Design Notification 等）
   // 示例：ElMessage.error(errorMessage);
   // 示例：notification.error({ message: '操作失败', description: errorMessage });

   // 临时方案：在浏览器中显示 alert（仅开发环境）
   if (import.meta.env.DEV) {
      // alert(errorMessage);
   }
}

/**
 * 错误恢复建议
 */
export const ERROR_RECOVERY_SUGGESTIONS = {
   NETWORK_ERROR: "请检查网络连接和服务器地址配置",
   TIMEOUT_ERROR: "请检查网络速度或减少请求数据量",
   INTERNAL_ERROR: "服务器内部错误，请联系管理员",
   PERMISSION_DENIED: "您没有执行此操作的权限",
   RECORD_NOT_FOUND: "请求的数据不存在或已被删除",
   UNIQUE_CONSTRAINT: "数据已存在，请修改后重试",
   VALIDATION_ERROR: "请检查输入数据格式是否正确",
};

/**
 * 获取错误恢复建议
 * @param {string} errorType - 错误类型
 * @returns {string} 恢复建议
 */
export function getRecoverySuggestion(errorType) {
   return ERROR_RECOVERY_SUGGESTIONS[errorType] || "请稍后重试";
}

/**
 * 日志记录错误（用于调试）
 * @param {Error} error - 错误对象
 * @param {string} context - 错误发生的上下文
 */
export function logError(error, context = "") {
   const errorInfo = {
      timestamp: new Date().toISOString(),
      context,
      message: error?.message,
      type: error?.type,
      statusCode: error?.statusCode,
      stack: error?.stack,
      url: window?.location?.href,
   };

   console.error("[Error Log]", errorInfo);

   // TODO: 发送到错误监控服务（如 Sentry）
   // if (import.meta.env.PROD) {
   //   sendToErrorMonitoring(errorInfo);
   // }
}
