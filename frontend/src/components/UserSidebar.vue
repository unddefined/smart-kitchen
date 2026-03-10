<!-- eslint-disable prettier/prettier -->
<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-start transition-opacity duration-300" @click="handleClose">
    <div
      class="w-75 h-full bg-white shadow-lg transform transition-transform duration-300 ease-out"
      @click.stop
      role="dialog"
      aria-modal="true"
      aria-labelledby="sidebar-title">
      <!-- 头部 -->
      <div class="flex justify-between items-center p-5 border-b border-gray-200">
        <h3 id="sidebar-title" class="text-gray-800 m-0 text-xl font-semibold">{{ title }}</h3>
        <button
          class="bg-none border-none text-2xl cursor-pointer text-gray-400 hover:text-gray-600 transition-colors duration-200"
          @click="handleClose"
          aria-label="关闭侧边栏">
          ×
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="p-5 overflow-y-auto">
        <!-- 用户基本信息 -->
        <slot name="user-info">
          <div class="flex gap-4 mb-6">
            <div class="w-15 h-15 rounded-full bg-gray-300 flex items-center justify-center text-2xl flex-shrink-0">
              {{ userInfo?.avatar || "👤" }}
            </div>
            <div class="user-basic-info flex-1 min-w-0">
              <p class="my-2 text-gray-600 text-base truncate"><strong>姓名：</strong>{{ userInfo?.name || "张师傅" }}</p>
              <p class="my-2 text-gray-600 text-base truncate"><strong>工位：</strong>{{ userInfo?.station || "打荷" }}</p>
              <p class="my-2 text-gray-600 text-base truncate"><strong>手机号：</strong>{{ userInfo?.phone || "138****8888" }}</p>
            </div>
          </div>
        </slot>

        <!-- 工作统计 -->
        <slot name="work-stats">
          <div class="work-stats">
            <h4 class="text-gray-800 my-0 mb-4 text-lg font-medium">今日工作统计</h4>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-gray-100 rounded-lg">
                <span class="block text-xs text-gray-600 mb-1">处理订单</span>
                <span class="block text-xl font-bold text-blue-500">{{ stats?.processedOrders ?? 24 }}</span>
              </div>
              <div class="text-center p-3 bg-gray-100 rounded-lg">
                <span class="block text-xs text-gray-600 mb-1">完成菜品</span>
                <span class="block text-xl font-bold text-blue-500">{{ stats?.completedDishes ?? 86 }}</span>
              </div>
            </div>
          </div>
        </slot>

        <!-- 额外插槽：可插入其他内容 -->
        <slot name="extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  /**
   * 控制侧边栏显示/隐藏
   */
  visible: {
    type: Boolean,
    required: true,
  },
  /**
   * 侧边栏标题
   */
  title: {
    type: String,
    default: "员工信息",
  },
  /**
   * 用户信息对象
   */
  userInfo: {
    type: Object,
    default: () => ({
      name: "张师傅",
      station: "打荷",
      phone: "138****8888",
      avatar: "👤",
    }),
  },
  /**
   * 工作统计数据
   */
  stats: {
    type: Object,
    default: () => ({
      processedOrders: 24,
      completedDishes: 86,
    }),
  },
});

const emit = defineEmits(["update:visible"]);

/**
 * 关闭侧边栏
 */
const handleClose = () => {
  emit("update:visible", false);
};
</script>

<style scoped>
/* 响应式调整：小屏幕适配 */
@media (max-width: 640px) {
  .w-75 {
    width: 85vw;
  }
}
</style>
