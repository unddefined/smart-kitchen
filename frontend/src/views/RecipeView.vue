<template>
  <div class="recipe-view min-h-screen bg-gray-100">
    <!-- 头部 -->
    <div class="bg-white shadow-sm sticky top-0 z-10">
      <div class="flex items-center justify-between px-4 py-3">
        <div class="flex items-center space-x-3">
          <button @click="goBack" class="p-2 rounded-full hover:bg-gray-100">
            <svg
              class="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>
          <h1 class="text-lg font-bold text-gray-900">菜品菜谱</h1>
        </div>
        <button
          @click="editRecipe"
          class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg"
        >
          编辑
        </button>
      </div>
    </div>

    <!-- 菜品信息 -->
    <div class="p-4">
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div class="flex items-start space-x-4">
          <div
            class="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center"
          >
            <span class="text-gray-500">图片</span>
          </div>
          <div class="flex-1">
            <h2 class="text-xl font-bold text-gray-900 mb-2">
              {{ recipe.name }}
            </h2>
            <div class="flex items-center space-x-4 text-sm text-gray-600">
              <span>分类: {{ recipe.category }}</span>
              <span>烹饪时间: {{ recipe.cookTime }}分钟</span>
              <span>难度: {{ recipe.difficulty }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 食材清单 -->
      <div class="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">食材清单</h3>
        <div class="space-y-3">
          <div
            v-for="ingredient in recipe.ingredients"
            :key="ingredient.name"
            class="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
          >
            <span class="font-medium text-gray-900">{{ ingredient.name }}</span>
            <span class="text-gray-600">{{ ingredient.amount }}</span>
          </div>
        </div>
      </div>

      <!-- 制作步骤 -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">制作步骤</h3>
        <div class="space-y-4">
          <div
            v-for="(step, index) in recipe.steps"
            :key="index"
            class="flex space-x-4"
          >
            <div
              class="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium"
            >
              {{ index + 1 }}
            </div>
            <div class="flex-1">
              <p class="text-gray-800">{{ step.description }}</p>
              <p v-if="step.time" class="text-sm text-gray-500 mt-1">
                预计时间: {{ step.time }}分钟
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部导航栏 -->
    <nav
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2"
    >
      <div class="flex justify-around">
        <!-- 烹调 -->
        <div class="flex flex-col items-center">
          <div class="w-6 h-6 mb-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              />
            </svg>
          </div>
          <span class="text-xs text-gray-500">烹调</span>
        </div>

        <!-- 库存管理 -->
        <div class="flex flex-col items-center">
          <div class="w-6 h-6 mb-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v10H7V7z" />
            </svg>
          </div>
          <span class="text-xs text-gray-500">库存管理</span>
        </div>

        <!-- 待办事项 -->
        <div class="flex flex-col items-center">
          <div class="w-6 h-6 mb-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <span class="text-xs text-gray-500">待办事项</span>
        </div>

        <!-- 历史记录 -->
        <div class="flex flex-col items-center">
          <div class="w-6 h-6 mb-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <span class="text-xs text-gray-500">历史记录</span>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

// 模拟菜谱数据
const recipe = ref({
  name: "椒盐基围虾",
  category: "海鲜类",
  cookTime: 15,
  difficulty: "简单",
  ingredients: [
    { name: "基围虾", amount: "500g" },
    { name: "椒盐", amount: "适量" },
    { name: "蒜蓉", amount: "2勺" },
    { name: "生姜", amount: "10g" },
    { name: "料酒", amount: "1勺" },
    { name: "食用油", amount: "适量" },
  ],
  steps: [
    { description: "基围虾洗净，去除虾线，沥干水分", time: 3 },
    { description: "用料酒腌制10分钟", time: 10 },
    { description: "热锅下油，放入蒜蓉和姜片爆香", time: 2 },
    { description: "倒入基围虾大火翻炒至变色", time: 5 },
    { description: "撒入椒盐，继续翻炒均匀", time: 2 },
    { description: "出锅装盘即可", time: 1 },
  ],
});

const goBack = () => {
  router.back();
};

const editRecipe = () => {
  console.log("编辑菜谱");
  // 这里可以跳转到编辑页面
};
</script>

<style scoped>
.recipe-view {
  padding-bottom: 80px;
}
</style>
