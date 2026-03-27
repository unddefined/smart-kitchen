import { ref, reactive } from "vue";
import { OrderService } from "@/services";
import { useToast } from "@/composables/useToast";

/**
 * 订单编辑器 Composable Hook
 * 专注于订单编辑逻辑，包括表单初始化、验证和提交
 *
 * @param {Object} options - 配置选项
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 错误回调
 *
 * @returns {Object} 响应式状态和方法
 */
export function useOrderEditor(options = {}) {
   const { onSuccess, onError } = options;
   const { showSuccess, showError, showInfo } = useToast();

   // 响应式状态
   const showEditModalVisible = ref(false);
   const isEditing = ref(false);
   const editForm = reactive({
      hallNumber: "",
      peopleCount: 1,
      tableCount: 1,
      status: "created",
   });

   const mealDate = ref("");
   const mealTime = ref("午餐");

   // 餐型映射
   const MEAL_TYPE_MAP = {
      lunch: "午餐",
      dinner: "晚餐",
      breakfast: "早餐",
      other: "其他",
   };

   /**
    * 获取本地日期字符串（避免时区问题）
    */
   const getLocalDateString = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
   };

   /**
    * 从订单数据解析用餐时间
    */
   const parseMealTime = (orderDetail) => {
      let parsedDate = new Date().toISOString().split("T")[0];
      let parsedMealType = "午餐";

      // 优先使用 mealType 字段
      if (orderDetail.mealType) {
         parsedMealType = MEAL_TYPE_MAP[orderDetail.mealType] || "午餐";
      }

      // 如果有 mealTime，使用其日期部分
      if (orderDetail.mealTime) {
         const dateObj = new Date(orderDetail.mealTime);
         const year = dateObj.getFullYear();
         const month = String(dateObj.getMonth() + 1).padStart(2, "0");
         const day = String(dateObj.getDate()).padStart(2, "0");
         parsedDate = `${year}-${month}-${day}`;

         // 如果 mealType 为空，尝试根据小时数推断餐型
         if (!orderDetail.mealType) {
            const hours = dateObj.getHours();
            if (hours >= 9 && hours < 15) {
               parsedMealType = "午餐";
            } else if (hours >= 15 && hours < 21) {
               parsedMealType = "晚餐";
            }
         }
      }

      return { parsedDate, parsedMealType };
   };

   /**
    * 将餐型转换为后端格式
    */
   const convertMealTypeToBackend = (mealTypeChinese) => {
      const reverseMap = {
         午餐: "lunch",
         晚餐: "dinner",
         早餐: "breakfast",
         其他: "other",
      };
      return reverseMap[mealTypeChinese] || "lunch";
   };

   /**
    * 显示编辑弹窗并初始化表单
    */
   const showEditModal = (orderDetail) => {
      if (!orderDetail) return;

      // 解析用餐时间
      const { parsedDate, parsedMealType } = parseMealTime(orderDetail);

      // 初始化表单数据
      editForm.hallNumber = orderDetail.hallNumber || "";
      editForm.peopleCount = orderDetail.peopleCount || 1;
      editForm.tableCount = orderDetail.tableCount || 1;
      editForm.status = orderDetail.status || "created";

      // 设置用餐时间
      mealDate.value = parsedDate;
      mealTime.value = parsedMealType;

      showEditModalVisible.value = true;
   };

   /**
    * 隐藏编辑弹窗
    */
   const hideEditModal = () => {
      showEditModalVisible.value = false;
   };

   /**
    * 构建更新数据对象
    */
   const buildUpdateData = (orderDetail) => {
      const updateData = {};
      const hasStatusChange = editForm.status !== orderDetail?.status;

      // 检查各字段是否有变化
      if (editForm.hallNumber !== orderDetail?.hallNumber) {
         updateData.hallNumber = editForm.hallNumber;
      }

      if (editForm.peopleCount !== orderDetail?.peopleCount) {
         updateData.peopleCount = parseInt(editForm.peopleCount);
      }

      if (editForm.tableCount !== orderDetail?.tableCount) {
         updateData.tableCount = parseInt(editForm.tableCount);
      }

      // 处理用餐时间
      const newMealTime = `${mealDate.value} ${mealTime.value}`;
      if (newMealTime !== orderDetail?.mealTime) {
         updateData.mealTime = newMealTime;
         updateData.mealType = convertMealTypeToBackend(mealTime.value);
      }

      return {
         updateData,
         hasStatusChange,
         newStatus: editForm.status,
      };
   };

   /**
    * 根据状态调用专用 API
    */
   const callStatusSpecificAPI = async (orderId, status) => {
      switch (status) {
         case "serving":
            return await OrderService.startOrder(orderId);
         case "urged":
            return await OrderService.urgeOrder(orderId);
         case "done":
            return await OrderService.completeOrder(orderId);
         case "cancelled":
            return await OrderService.cancelOrder(orderId);
         case "started":
            return await OrderService.updateOrder(orderId, { status });
         default:
            return await OrderService.updateOrder(orderId, { status });
      }
   };

   /**
    * 确认编辑订单
    */
   const confirmEditOrder = async (orderId, orderDetail) => {
      if (isEditing.value) return Promise.reject(new Error("正在编辑中"));

      try {
         isEditing.value = true;

         // 确保 orderId 是数字类型
         const orderIdNum = parseInt(orderId);
         if (isNaN(orderIdNum)) {
            throw new Error("无效的订单 ID");
         }

         // 构建更新数据
         const { updateData, hasStatusChange, newStatus } = buildUpdateData(orderDetail);

         let result;

         if (hasStatusChange) {
            // 状态发生变化，调用专用 API
            result = await callStatusSpecificAPI(orderIdNum, newStatus);

            if (result.success) {
               showSuccess("订单信息更新成功");
            } else {
               throw new Error(result.message);
            }
         } else {
            // 状态未变化，只更新其他字段
            if (Object.keys(updateData).length === 0) {
               hideEditModal();
               showInfo("没有需要更新的字段");
               return Promise.resolve({ success: true });
            }

            result = await OrderService.updateOrder(orderIdNum, updateData);

            if (result.success) {
               showSuccess("订单信息更新成功");
            } else {
               throw new Error(result.message);
            }
         }

         // 隐藏弹窗
         hideEditModal();

         // 调用成功回调
         if (onSuccess && typeof onSuccess === "function") {
            onSuccess(orderIdNum);
         }

         return result;
      } catch (error) {
         console.error("更新订单失败:", error);
         showError("更新订单失败：" + (error.message || "未知错误"));

         // 调用错误回调
         if (onError && typeof onError === "function") {
            onError(error);
         }

         throw error;
      } finally {
         isEditing.value = false;
      }
   };

   /**
    * 重置表单
    */
   const resetForm = () => {
      editForm.hallNumber = "";
      editForm.peopleCount = 1;
      editForm.tableCount = 1;
      editForm.status = "created";
      mealDate.value = "";
      mealTime.value = "午餐";
   };

   return {
      // 状态
      showEditModalVisible,
      isEditing,
      editForm,
      mealDate,
      mealTime,

      // 方法
      showEditModal,
      hideEditModal,
      confirmEditOrder,
      resetForm,
   };
}
