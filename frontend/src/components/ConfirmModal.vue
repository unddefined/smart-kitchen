<template>
  <div v-if="visible" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" @click.self="handleClose">
    <div class="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl transform transition-all" :class="customClass">
      <!-- 图标和标题 -->
      <div class="text-center mb-6">
        <div class="text-5xl mb-4">{{ icon }}</div>
        <h3 class="text-xl font-bold text-gray-800 mb-2">{{ title }}</h3>
        <p class="text-gray-600 whitespace-pre-line">{{ message }}</p>

        <!-- 警告提示（可选） -->
        <div v-if="warningText" :class="['mt-4 p-3 rounded-lg', warningBgClass]">
          <p :class="['text-sm font-medium', warningTextClass]">
            {{ warningText }}
          </p>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="flex gap-3">
        <button
          @click="handleCancel"
          :disabled="loading"
          class="flex-1 py-3 px-4 border border-gray-300 rounded-lg bg-white text-gray-800 text-base cursor-pointer transition-all duration-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
          {{ cancelText || "取消" }}
        </button>
        <button
          @click="handleConfirm"
          :disabled="loading"
          :class="[
            'flex-1 py-3 px-4 rounded-lg text-white text-base cursor-pointer transition-all duration-200',
            loading ? 'bg-gray-300 cursor-not-allowed' : buttonClass,
          ]">
          {{ loading ? loadingText : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: "info",
    validator: (value) => ["info", "success", "warning", "error", "delete"].includes(value),
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    default: "",
  },
  warningText: {
    type: String,
    default: "",
  },
  confirmText: {
    type: String,
    default: "确认",
  },
  cancelText: {
    type: String,
    default: "取消",
  },
  loadingText: {
    type: String,
    default: "处理中...",
  },
  loading: {
    type: Boolean,
    default: false,
  },
  customClass: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:visible", "confirm", "cancel"]);

// 根据类型显示对应图标
const icon = computed(() => {
  const icons = {
    info: "ℹ️",
    success: "✓",
    warning: "⚠️",
    error: "✗",
    delete: "🗑️",
  };
  return icons[props.type] || "ℹ️";
});

// 按钮颜色
const buttonClass = computed(() => {
  const classes = {
    info: "bg-blue-500 hover:bg-blue-600 hover:-translate-y-0.5",
    success: "bg-green-500 hover:bg-green-600 hover:-translate-y-0.5",
    warning: "bg-yellow-500 hover:bg-yellow-600 hover:-translate-y-0.5",
    error: "bg-red-500 hover:bg-red-600 hover:-translate-y-0.5",
    delete: "bg-red-500 hover:bg-red-600 hover:-translate-y-0.5",
  };
  return classes[props.type] || "bg-blue-500";
});

// 警告背景色
const warningBgClass = computed(() => {
  const backgrounds = {
    info: "bg-blue-50",
    success: "bg-green-50",
    warning: "bg-yellow-50",
    error: "bg-red-50",
    delete: "bg-red-50",
  };
  return backgrounds[props.type] || "bg-gray-50";
});

// 警告文字颜色
const warningTextClass = computed(() => {
  const colors = {
    info: "text-blue-700",
    success: "text-green-700",
    warning: "text-yellow-700",
    error: "text-red-700",
    delete: "text-red-700",
  };
  return colors[props.type] || "text-gray-700";
});

// 处理方法
const handleClose = () => {
  if (!props.loading) {
    emit("update:visible", false);
  }
};

const handleCancel = () => {
  emit("cancel");
  emit("update:visible", false);
};

const handleConfirm = () => {
  if (!props.loading) {
    emit("confirm");
    // 如果不是 loading 状态，确认后自动关闭弹窗
    emit("update:visible", false);
  }
};
</script>
