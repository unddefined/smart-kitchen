<template>
  <div class="dish-sorting-test p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">菜品排序测试</h1>
    
    <!-- 测试按钮 -->
    <div class="mb-6">
      <button 
        @click="runTest" 
        :disabled="loading"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {{ loading ? '测试中...' : '运行排序测试' }}
      </button>
    </div>

    <!-- 测试结果显示 -->
    <div v-if="testResults" class="space-y-6">
      <!-- 字母排序结果 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-3">字母顺序排序</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
          <div 
            v-for="(dish, index) in alphabeticallySorted.slice(0, 12)" 
            :key="dish.id"
            class="p-2 bg-gray-50 rounded text-sm"
          >
            {{ index + 1 }}. {{ dish.name }}
          </div>
        </div>
        <p class="mt-2 text-gray-600">总共: {{ alphabeticallySorted.length }} 个菜品</p>
      </div>

      <!-- 上菜顺序结果 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-3">上菜顺序排序</h2>
        <div class="space-y-3">
          <div 
            v-for="(dish, index) in servingOrderSorted.slice(0, 15)" 
            :key="dish.id"
            class="flex items-center p-2 bg-blue-50 rounded"
          >
            <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-3">
              {{ index + 1 }}
            </span>
            <span class="font-medium">{{ dish.name }}</span>
            <span class="ml-2 text-sm text-gray-600">({{ dish.categoryName }})</span>
          </div>
        </div>
        <p class="mt-2 text-gray-600">总共: {{ servingOrderSorted.length }} 个菜品</p>
      </div>

      <!-- 分类分组结果 -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-3">分类分组显示</h2>
        <div class="space-y-4">
          <div 
            v-for="(group, groupIndex) in groupedDishes" 
            :key="group.category.id"
            class="border rounded-lg overflow-hidden"
          >
            <div class="bg-gray-100 px-4 py-2 font-medium">
              {{ groupIndex + 1 }}. {{ group.category.name }} 
              <span class="text-sm text-gray-600">(顺序: {{ group.category.displayOrder }})</span>
            </div>
            <div class="p-3">
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="(dish, dishIndex) in group.dishes.slice(0, 6)" 
                  :key="dish.id"
                  class="px-2 py-1 bg-green-100 text-green-800 rounded text-sm"
                >
                  {{ dish.name }}
                </span>
                <span 
                  v-if="group.dishes.length > 6"
                  class="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm"
                >
                  +{{ group.dishes.length - 6 }} 更多
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="mt-4 p-4 bg-red-50 text-red-700 rounded">
      错误: {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { DishService } from '@/services'

const loading = ref(false)
const testResults = ref(null)
const error = ref(null)

const alphabeticallySorted = ref([])
const servingOrderSorted = ref([])
const groupedDishes = ref([])

const runTest = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 测试字母排序
    alphabeticallySorted.value = await DishService.getAllDishes()
    
    // 测试上菜顺序排序
    servingOrderSorted.value = await DishService.getAllDishesInServingOrder()
    
    // 测试分类分组
    groupedDishes.value = await DishService.getDishesGroupedByCategory()
    
    testResults.value = {
      alphabeticallyCount: alphabeticallySorted.value.length,
      servingOrderCount: servingOrderSorted.value.length,
      groupedCategories: groupedDishes.value.length
    }
    
  } catch (err) {
    error.value = err.message
    console.error('测试失败:', err)
  } finally {
    loading.value = false
  }
}
</script>