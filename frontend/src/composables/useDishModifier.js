import { ref } from "vue";
import { api } from "@/services/api";
import { useToast } from "@/composables/useToast";

/**
 * 订单菜品修改器 Composable Hook
 * 专注于订单菜品的增删改逻辑，包括 diff 算法和批量操作
 *
 * @param {Object} options - 配置选项
 * @param {Function} options.onSuccess - 成功回调
 * @param {Function} options.onError - 错误回调
 *
 * @returns {Object} 响应式状态和方法
 */
export function useDishModifier(options = {}) {
   const { onSuccess, onError } = options;
   const { toast } = useToast();

   // 响应式状态
   const showModifyModalVisible = ref(false);
   const isModifying = ref(false);
   const selectedOrderItems = ref([]);
   const originalOrderItems = ref([]);

   // 分类默认优先级映射（三层优先级）
   const CATEGORY_PRIORITY_MAP = {
      凉菜: 3, // 立即上（红色）
      前菜: 3, // 立即上（红色）
      中菜: 2, // 正常（黄色）
      点心: 2, // 正常（黄色）
      蒸菜: 2, // 正常（黄色）
      后菜: 1, // 后上（绿色）
      尾菜: 1, // 后上（绿色）
   };

   const CATEGORY_ORDER = ["凉菜", "前菜", "中菜", "点心", "蒸菜", "后菜", "尾菜"];

   /**
    * 从 weight 字符串中提取数值部分（如 "2 两" -> 2）
    */
   const extractWeightValue = (weight) => {
      if (!weight) return null;
      const match = weight.match(/^(\d+)/);
      return match ? parseInt(match[1]) : null;
   };

   /**
    * 从 weight 字符串中提取单位部分（如 "2 两" -> "两"）
    */
   const extractWeightUnit = (weight) => {
      if (!weight) return "两";
      const match = weight.match(/[\u4e00-\u9fa5]+$/);
      return match ? match[0] : "两";
   };

   /**
    * 初始化已选中的订单菜品
    */
   const initializeSelectedItems = (orderItems) => {
      if (!orderItems) return [];

      return orderItems.map((item) => ({
         id: item.dishId,
         orderItemId: item.id,
         status: item.status,
         priority: item.priority,
         name: item.dish?.name || "未知菜品",
         category: item.dish?.categoryName || "未知类别",
         quantity: item.quantity || 1,
         remark: item.remark || "",
         weight: item.weight || null,
         weightValue: extractWeightValue(item.weight) || null,
         weightUnit: extractWeightUnit(item.weight) || "两",
         dish: item.dish,
      }));
   };

   /**
    * 计算新菜品的优先级
    * 基于订单中已有菜品的最高优先级和分类顺序
    */
   const calculateNewDishPriority = (dish, orderDetail) => {
      if (orderDetail?.status !== "urged" && orderDetail?.status !== "serving") {
         return 0;
      }

      const categoryName = dish.categoryName;
      if (!categoryName) return 0;

      const pendingItems = orderDetail?.items?.filter((i) => i.status !== "served");

      if (!pendingItems || pendingItems.length === 0) {
         return CATEGORY_PRIORITY_MAP[categoryName] || 3;
      }

      const categoryPriority = {};

      for (const item of pendingItems) {
         const cat = item.dish?.categoryName;
         if (!cat) continue;

         const p = item.priority ?? 1;

         if (!categoryPriority[cat] || categoryPriority[cat] < p) {
            categoryPriority[cat] = p;
         }
      }

      const categories = Object.keys(categoryPriority);

      // 如果没有有效的分类，使用默认优先级
      if (categories.length === 0) {
         return CATEGORY_PRIORITY_MAP[categoryName] || 1;
      }

      const maxCategory = categories.reduce((a, b) => (categoryPriority[a] > categoryPriority[b] ? a : b));

      const maxPriority = categoryPriority[maxCategory];

      const newIndex = CATEGORY_ORDER.indexOf(categoryName);
      const maxIndex = CATEGORY_ORDER.indexOf(maxCategory);

      if (newIndex <= maxIndex) return maxPriority;

      return categoryPriority[categoryName] || 1;
   };

   /**
    * 显示修改菜品弹窗并初始化数据
    */
   const showModifyModal = (orderDetail) => {
      if (!orderDetail) return;

      selectedOrderItems.value = initializeSelectedItems(orderDetail.items);
      originalOrderItems.value = JSON.parse(JSON.stringify(selectedOrderItems.value));

      showModifyModalVisible.value = true;
   };

   /**
    * 隐藏修改菜品弹窗
    */
   const hideModifyModal = () => {
      showModifyModalVisible.value = false;
      selectedOrderItems.value = [];
      originalOrderItems.value = [];
   };

   /**
    * 处理选中菜品的变化
    */
   const handleSelectedDishesChange = (newSelectedDishes) => {
      selectedOrderItems.value = newSelectedDishes;
   };

   /**
    * 保存原始菜品快照
    */
   const saveOriginalSnapshot = () => {
      originalOrderItems.value = JSON.parse(JSON.stringify(selectedOrderItems.value));
   };

   /**
    * Diff 算法：比较变更的菜品
    * @returns {Object} 包含 removedItems, modifiedItems, addedItems
    */
   const diffChanges = () => {
      const originalMap = new Map(originalOrderItems.value.filter((i) => i.orderItemId).map((i) => [i.orderItemId, i]));
      const currentMap = new Map(selectedOrderItems.value.filter((i) => i.orderItemId).map((i) => [i.orderItemId, i]));

      // 删除的菜品：原来有但现在没有
      const removedItems = originalOrderItems.value.filter((item) => !currentMap.has(item.orderItemId));

      // 更新的菜品：orderItemId 存在但内容有变化
      const modifiedItems = selectedOrderItems.value
         .filter((i) => i.orderItemId)
         .filter((i) => {
            const original = originalMap.get(i.orderItemId);
            return original && (original.quantity !== i.quantity || original.remark !== i.remark || original.weight !== i.weight);
         });

      // 新增的菜品：orderItemId 为 null
      const addedItems = selectedOrderItems.value.filter((item) => !item.orderItemId);

      return { removedItems, modifiedItems, addedItems };
   };

   /**
    * 确认修改菜品
    */
   const confirmModifyDishes = async (orderDetail) => {
      if (isModifying.value) {
         return Promise.reject(new Error("正在修改中"));
      }

      try {
         isModifying.value = true;

         const orderId = orderDetail?.id;
         if (!orderId) {
            throw new Error("订单信息未加载");
         }

         // 使用 diff 算法比较变更
         const { removedItems, modifiedItems, addedItems } = diffChanges();

         // 为新增菜品计算优先级
         const addedItemsWithPriority = addedItems.map((item) => ({
            ...item,
            calculatedPriority: calculateNewDishPriority(item, orderDetail),
         }));

         let hasChanges = false;

         // 并行批量删除被移除的菜品
         if (removedItems.length > 0) {
            await Promise.all(removedItems.map((item) => api.orderItems.delete(item.orderItemId, orderId)));
            toast.success(`成功删除 ${removedItems.length} 个菜品`);
            hasChanges = true;
         }

         // 并行批量更新已修改的菜品
         if (modifiedItems.length > 0) {
            await Promise.all(
               modifiedItems.map((item) =>
                  api.orderItems.update(item.orderItemId, orderId, {
                     quantity: item.quantity,
                     remark: item.remark || "",
                     weight: item.weight || null,
                  }),
               ),
            );
            toast.success(`成功更新 ${modifiedItems.length} 个菜品`);
            hasChanges = true;
         }

         // 并行批量添加新选中的菜品
         if (addedItemsWithPriority.length > 0) {
            await Promise.all(
               addedItemsWithPriority.map((item) =>
                  api.orderItems.create(orderId, {
                     dishId: item.id,
                     quantity: item.quantity,
                     remark: item.remark || "",
                     weight: item.weight || null,
                     priority: item.calculatedPriority,
                  }),
               ),
            );

            if (removedItems.length === 0 && modifiedItems.length === 0) {
               toast.success(`成功添加 ${addedItemsWithPriority.length} 个菜品`);
            } else {
               toast.success(
                  `已删除 ${removedItems.length} 个菜品，已更新 ${modifiedItems.length} 个菜品，已添加 ${addedItemsWithPriority.length} 个菜品`,
               );
            }
            hasChanges = true;
         }

         if (!hasChanges) {
            toast.info("没有菜品变更");
         }

         // 隐藏弹窗
         hideModifyModal();

         // 调用成功回调
         if (onSuccess && typeof onSuccess === "function") {
            onSuccess({ orderId });
         }

         return { success: true, hasChanges };
      } catch (error) {
         console.error("修改菜品失败:", error);
         toast.error("修改菜品失败：" + (error.message || "操作失败"));

         // 调用错误回调
         if (onError && typeof onError === "function") {
            onError(error);
         }

         throw error;
      } finally {
         isModifying.value = false;
      }
   };

   /**
    * 重置状态
    */
   const resetState = () => {
      showModifyModalVisible.value = false;
      isModifying.value = false;
      selectedOrderItems.value = [];
      originalOrderItems.value = [];
   };

   return {
      // 状态
      showModifyModalVisible,
      isModifying,
      selectedOrderItems,
      originalOrderItems,

      // 方法
      showModifyModal,
      hideModifyModal,
      handleSelectedDishesChange,
      saveOriginalSnapshot,
      confirmModifyDishes,
      resetState,

      // 工具函数
      extractWeightValue,
      extractWeightUnit,
      initializeSelectedItems,
      calculateNewDishPriority,
      diffChanges,
   };
}
