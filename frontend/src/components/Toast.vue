<template>
  <div v-if="visible && message" class="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300">
    <div
      class="px-6 py-3 rounded-lg shadow-lg text-white text-base flex items-center gap-2"
      :class="{
        'bg-green-500': type === 'success',
        'bg-red-500': type === 'error',
        'bg-blue-500': type === 'info',
      }">
      <span class="text-xl">
        {{ icon }}
      </span>
      <span>{{ message }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "success",
    validator: (value) => ["success", "error", "info"].includes(value),
  },
  duration: {
    type: Number,
    default: 3000,
  },
});

const emit = defineEmits(["update:visible"]);

// 根据类型显示对应图标
const icon = computed(() => {
  const icons = {
    success: "✓",
    error: "✗",
    info: "ℹ",
  };
  return icons[props.type] || "✓";
});

// 自动关闭逻辑
let timer = null;
watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.duration > 0) {
      timer = setTimeout(() => {
        emit("update:visible", false);
      }, props.duration);
    } else {
      clearTimeout(timer);
    }
  },
  { immediate: true },
);
</script>
