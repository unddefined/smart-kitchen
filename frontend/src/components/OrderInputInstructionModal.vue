<!-- eslint-disable prettier/prettier -->
<template>
  <Teleport to="#modal-container">
    <!-- 使用说明弹窗 -->
    <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-5000" @click.self="closeModal">
      <div class="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col m-4">
        <!-- 头部 -->
        <div class="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600">
          <h3 class="text-lg font-bold text-white flex items-center">
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            订单录入使用说明
          </h3>
          <button @click="closeModal" class="p-2 rounded-full hover:bg-white/20 transition-colors">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="space-y-6">
            <!-- 基本信息填写 -->
            <div class="bg-blue-50 rounded-xl p-4">
              <h4 class="font-bold text-blue-800 mb-3 flex items-center">
                <span class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm mr-2">1</span>
                基本信息填写
              </h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li class="flex items-start">
                  <span class="text-blue-500 mr-2">•</span>
                  <span><strong>总人数：</strong>输入用餐总人数，必须大于 0</span>
                </li>
                <li class="flex items-start">
                  <span class="text-blue-500 mr-2">•</span>
                  <span><strong>桌数：</strong>输入用餐桌数，必须大于 0</span>
                </li>
                <li class="flex items-start">
                  <span class="text-blue-500 mr-2">•</span>
                  <span><strong>台号：</strong>输入餐厅台号，如：A01、B12 等</span>
                </li>
                <li class="flex items-start">
                  <span class="text-blue-500 mr-2">•</span>
                  <span><strong>打包说明：</strong>如需打包，请输入"打包 + 取餐时间"，例如：打包 12:30</span>
                </li>
              </ul>
            </div>

            <!-- 菜品选择 -->
            <div class="bg-green-50 rounded-xl p-4">
              <h4 class="font-bold text-green-800 mb-3 flex items-center">
                <span class="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm mr-2">2</span>
                菜品选择与录入
              </h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">•</span>
                  <span><strong>选择菜品：</strong>点击"添加菜品"按钮，从菜品列表中选择所需菜品</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">•</span>
                  <span><strong>附加信息录入：</strong>再次点击选中的菜品打开编辑弹窗</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">•</span>
                  <span><strong>重量录入：</strong>对于需要称重的菜品，点击重量框弹出称重器</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">•</span>
                  <span><strong>可数菜品：</strong>自动按总人数计数</span>
                </li>
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">•</span>
                  <span><strong>菜品备注：</strong>可为每个菜品添加特殊要求，如：少辣、不要香菜等</span>
                </li>
              </ul>
            </div>

            <!-- 用餐时间与日期 -->
            <div class="bg-purple-50 rounded-xl p-4">
              <h4 class="font-bold text-purple-800 mb-3 flex items-center">
                <span class="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm mr-2">3</span>
                用餐时间与日期
              </h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li class="flex items-start">
                  <span class="text-purple-500 mr-2">•</span>
                  <span><strong>用餐日期：</strong>默认为当天，可根据需要修改</span>
                </li>
                <li class="flex items-start">
                  <span class="text-purple-500 mr-2">•</span>
                  <span><strong>用餐时段：</strong>系统会根据当前时间自动推荐（9:00-13:00 为午餐，13:00-24:00 为晚餐）</span>
                </li>
                <li class="flex items-start">
                  <span class="text-purple-500 mr-2">•</span>
                  <span><strong>手动调整：</strong>可点击手动选择午餐或晚餐</span>
                </li>
              </ul>
            </div>

            <!-- 订单备注 -->
            <div class="bg-orange-50 rounded-xl p-4">
              <h4 class="font-bold text-orange-800 mb-3 flex items-center">
                <span class="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm mr-2">4</span>
                订单备注
              </h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li class="flex items-start">
                  <span class="text-orange-500 mr-2">•</span>
                  <span><strong>整单备注：</strong>在备注栏输入整个订单的特殊要求</span>
                </li>
                <li class="flex items-start">
                  <span class="text-orange-500 mr-2">•</span>
                  <span><strong>示例：</strong>加快出菜、分开结账、生日宴布置等</span>
                </li>
              </ul>
            </div>

            <!-- 提交订单 -->
            <div class="bg-red-50 rounded-xl p-4">
              <h4 class="font-bold text-red-800 mb-3 flex items-center">
                <span class="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm mr-2">5</span>
                提交订单
              </h4>
              <ul class="space-y-2 text-sm text-gray-700">
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">•</span>
                  <span><strong>检查信息：</strong>提交前请仔细核对所有填写的信息</span>
                </li>
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">•</span>
                  <span><strong>必填项：</strong>总人数、桌数、台号、菜品为必填项</span>
                </li>
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">•</span>
                  <span><strong>提交后：</strong>订单将发送到后厨系统，各工位开始准备</span>
                </li>
                <li class="flex items-start">
                  <span class="text-red-500 mr-2">•</span>
                  <span><strong>取消操作：</strong>点击"取消"或关闭按钮将不保存任何信息</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="p-4 border-t bg-gray-50 flex justify-end">
          <button 
            @click="closeModal"
            class="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors">
            我知道了
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['update:visible', 'close']);

/**
 * 关闭弹窗
 */
const closeModal = () => {
  emit('update:visible', false);
  emit('close');
};
</script>