import { ref } from "vue";
import { DishService } from "@/services";

/**
 * 菜品数据加载 Composable
 * 用于复用菜品列表加载逻辑，支持两级容错
 * @returns {Object} 响应式状态和方法
 */
export function useDishLoader() {
  const dishes = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * 加载菜品数据
   * 优先使用按上菜顺序排序的接口，失败后回退到字母排序接口
   */
  const loadDishes = async () => {
    loading.value = true;
    error.value = null;
    
    try {
      // 使用按上菜顺序排序的菜品数据
      const loadedDishes = await DishService.getAllDishesInServingOrder();
      dishes.value = loadedDishes;
    } catch (error) {
      console.error("加载菜品数据失败:", error);
      error.value = "加载菜品失败，请稍后重试";
      
      // 回退到字母排序
      try {
        const fallbackDishes = await DishService.getAllDishes();
        dishes.value = fallbackDishes;
      } catch (fallbackError) {
        console.error("回退加载失败:", fallbackError);
        dishes.value = [];
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重置菜品数据
   */
  const resetDishes = () => {
    dishes.value = [];
    loading.value = false;
    error.value = null;
  };

  return {
    dishes,
    loading,
    error,
    loadDishes,
    resetDishes,
  };
}
