<template>
  <div ref="waterfallContainer" class="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-1.5">
    <div
      v-for="dish in props.dishes"
      :key="`pending-${dish.itemId}`"
      :class="[
        'break-inside-avoid mb-2 rounded-xl p-1 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:scale-105 hover:shadow-xl cursor-pointer relative',
        getPriorityClass(dish.priority),
        dish.needsProcessing ? 'border-4 border-blue-500' : '',
      ]"
      @click="handleClick(dish)"
      @dblclick="handleDblClick(dish)"
      @contextmenu="handleContextMenu(dish, $event)">
      <!-- 待切配/待处理提示 -->
      <div
        v-if="dish.needsProcessing"
        class="absolute -top-2 left-1/2 transform -translate-x-1/2 text-blue-700 text-xl font-light z-10 whitespace-nowrap">
        <span class="">{{ dish.processType }}</span>
      </div>

      <!-- 菜品主信息 -->
      <div class="flex items-center justify-center text-xl font-bold text-gray-800 leading-tight w-full mb-1 text-center">
        <span class="text-center">{{ truncateDishName(dish.name) }}</span>
        <span class="text-black mx-1">×</span>
        <span class="font-bold text-gray-900">{{ dish.totalQuantity }}</span>
      </div>

      <!-- 菜品详细标注 - 使用 generateDisplayDetails 生成 -->
      <div class="text-lg text-gray-800 leading-relaxed font-medium flex flex-col items-center justify-center">
        <div v-for="(detail, idx) in generateDisplayDetails(dish)" :key="idx" class="text-center break-all min-w-[80px]">
          {{ detail }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useDishManager } from "@/composables/useDishManager";

const props = defineProps({
  dishes: {
    type: Array,
    required: true,
    validator: (dishes) => {
      return Array.isArray(dishes) && dishes.every((dish) => dish.itemId && dish.name && dish.totalQuantity !== undefined);
    },
  },
});

// 接收父组件传递的事件处理函数
const emit = defineEmits(["click", "dblclick", "contextmenu"]);
const dishManager = useDishManager({
  onStatusChange: (dish, newStatus, newPriority) => {
    // 兼容两种数据结构
    const dishName = dish.name || dish.dish?.name || "未知菜品";
    console.log("状态变更回调:", dishName, newStatus, newPriority);
  },
  onPriorityAdjust: (dish, quantity, priority) => {
    // 兼容两种数据结构
    const dishName = dish.name || dish.dish?.name || "未知菜品";
    console.log("优先级调整回调:", dishName, quantity, priority);
  },
});
const { getPriorityClass } = dishManager;

// 三、生成显示详情 - UI 渲染辅助函数
const formatDetailItem = (dish) => {
  const remark = dish.remark ? `(${dish.remark})` : "";
  const weight = dish.weight !== null && dish.weight !== undefined && dish.weight !== "" ? `(${dish.weight})` : "";
  return `${remark}${weight}`;
};

// 四、生成显示详情 - UI 渲染辅助函数
const generateDisplayDetails = (dish) => {
  const details = [];

  // countable 菜
  if (dish.countable && dish.perTableGroups?.length) {
    for (const group of dish.perTableGroups) {
      details.push(`${group.quantityPerTable}个×${group.tableCount}份`);
    }
    return details;
  }

  // 普通菜
  let text = "";

  if (dish.remark) {
    text += `${dish.remark}`;
  }

  // 修复：weight 是字符串，需要检查是否为空字符串而不仅是 truthy/falsy
  if (dish.weight !== null && dish.weight !== undefined && dish.weight !== "") {
    text += text ? ` · ${dish.weight}` : `${dish.weight}`;
  }

  if (dish.totalQuantity && (dish.remark || (dish.weight !== null && dish.weight !== undefined && dish.weight !== ""))) {
    text += ` · ${dish.totalQuantity}份`;
  }

  if (text) {
    details.push(text);
  }

  return details;
};

// 辅助函数 - 截取菜名，保留前2后2字符，中间省略
const truncateDishName = (name) => {
  return name;
  if (!name || typeof name !== "string") return "";

  const screenWidth = window.innerWidth;

  // 根据屏幕宽度估算可显示字符数
  let maxChars;

  if (screenWidth < 400) {
    maxChars = 3; // 小手机
  } else if (screenWidth < 768) {
    maxChars = 5; // 大手机
  } else if (screenWidth < 1200) {
    maxChars = 8; // 平板
  } else {
    maxChars = 16; // 大屏
  }

  if (name.length <= maxChars) return name;

  return name.slice(0, maxChars - 3) + "..." + name.slice(-2);
};

// Ref 引用（如果需要）
const cardRef = (el) => {
  // 可以由父组件通过 ref 访问
};

// 事件处理 - 转发给父组件
const handleClick = (dish) => {
  emit("click", dish);
};

const handleDblClick = (dish) => {
  emit("dblclick", dish);
};

const handleContextMenu = (dish, event) => {
  if (event) {
    event.preventDefault();
  }
  emit("contextmenu", dish);
};
</script>
