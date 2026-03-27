<template>
   <div class="flex flex-col items-center justify-center h-full p-5">
      <!-- 动态大小的加载动画 -->
      <div :class="[spinnerClass, borderClass]"></div>
      <p v-if="message" :class="messageClass">{{ message }}</p>
   </div>
</template>

<script setup>
import { computed } from "vue";

// Props
const props = defineProps({
   message: {
      type: String,
      default: "",
   },
   size: {
      type: String,
      default: "md",
      validator: (value) => ["sm", "md", "lg", "xl"].includes(value),
   },
});

// 计算属性 - 加载动画大小
const spinnerClass = computed(() => {
   const sizeMap = {
      sm: "w-6 h-6",
      md: "w-10 h-10",
      lg: "w-12 h-12",
      xl: "w-16 h-16",
   };
   return sizeMap[props.size] || sizeMap.md;
});

// 计算属性 - 边框粗细
const borderClass = computed(() => {
   const borderWidthMap = {
      sm: "border-2",
      md: "border-4",
      lg: "border-4",
      xl: "border-8",
   };
   return `border-gray-300 border-t-blue-500 rounded-full animate-spin ${borderWidthMap[props.size] || borderWidthMap.md}`;
});

// 计算属性 - 消息文本大小
const messageClass = computed(() => {
   const textSizeMap = {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
   };
   return `text-gray-600 mt-4 ${textSizeMap[props.size] || textSizeMap.md}`;
});
</script>
