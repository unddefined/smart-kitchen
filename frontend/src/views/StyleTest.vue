<template>
  <div class="min-h-screen bg-gray-100 p-4">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">样式测试页面</h1>
      
      <!-- 基础颜色测试 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">基础颜色测试</h2>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-red-500 text-white p-3 rounded">红色背景</div>
          <div class="bg-blue-500 text-white p-3 rounded">蓝色背景</div>
          <div class="bg-green-500 text-white p-3 rounded">绿色背景</div>
          <div class="bg-yellow-500 text-white p-3 rounded">黄色背景</div>
        </div>
      </div>

      <!-- 文本样式测试 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">文本样式测试</h2>
        <div class="space-y-2">
          <p class="text-sm text-gray-500">小号灰色文本</p>
          <p class="text-base text-gray-700">基础黑色文本</p>
          <p class="text-lg font-medium text-gray-900">大号粗体文本</p>
          <p class="text-xl font-bold text-blue-600">超大蓝色粗体</p>
        </div>
      </div>

      <!-- 按钮样式测试 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">按钮样式测试</h2>
        <div class="flex flex-wrap gap-3">
          <button class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            主要按钮
          </button>
          <button class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
            次要按钮
          </button>
          <button class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            成功按钮
          </button>
          <button class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            危险按钮
          </button>
        </div>
      </div>

      <!-- 布局测试 -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">布局测试</h2>
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-blue-500 rounded-full"></div>
            <div>
              <p class="font-medium text-gray-900">Flex布局测试</p>
              <p class="text-sm text-gray-500">水平居中对齐</p>
            </div>
          </div>
          <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            状态标签
          </span>
        </div>
      </div>

      <!-- 移动端优化测试 -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">移动端优化测试</h2>
        <div class="touch-feedback p-4 bg-blue-50 rounded-lg mb-3">
          <p class="text-gray-700">触摸反馈测试区域</p>
        </div>
        <div class="grid-mobile-2 gap-3">
          <div class="p-3 bg-gray-100 rounded-lg text-center">网格1</div>
          <div class="p-3 bg-gray-100 rounded-lg text-center">网格2</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 样式测试组件 - 用于验证Tailwind CSS和自定义样式是否正常工作
</script>

<style scoped>
/* 测试scoped样式 */
.test-scoped {
  color: red;
}
</style>