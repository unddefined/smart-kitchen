<template>
   <div
      :class="[
         'mb-2 break-inside-avoid p-2 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer',
         priorityClass,
      ]"
      @click="handleClick"
   >
      <div class="flex justify-between font-medium text-gray-800">
         <span class="text-xl">
            <span>{{ dishName }}</span>
            <span>×{{ quantity }}</span>
         </span>
         <span v-if="statusText" class="px-2 py-0.5 rounded-full text-base bg-gray-300">{{ statusText }}</span>
      </div>
      <div v-if="weight" class="text-xl text-gray-600 mt-1">
         {{ weight }}
      </div>
      <!-- 普通备注 -->
      <div v-else-if="remark" class="text-xl text-gray-600 mt-2 p-2 bg-gray-100 rounded">
         {{ remark }}
      </div>
      <div class="dish-meta"></div>
   </div>
</template>

<script setup>
import { computed } from "vue";

// Props
const props = defineProps({
   dish: {
      type: Object,
      required: true,
   },
   priorityClass: {
      type: String,
      default: "",
   },
   statusText: {
      type: String,
      default: "",
   },
});

// Emit
const emit = defineEmits(["click"]);

// 计算属性
const dishName = computed(() => props.dish.dish?.name || "未知菜品");
const quantity = computed(() => props.dish.quantity);
const weight = computed(() => props.dish.weight);
const remark = computed(() => props.dish.remark);

// 方法
const handleClick = () => {
   emit("click", props.dish);
};
</script>
