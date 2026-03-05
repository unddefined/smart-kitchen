<!-- eslint-disable prettier/prettier -->
<template>
  <div class="flex space-x-2">
    <input
      v-model.number="internalValue"
      type="number"
      :step="step"
      :min="min"
      :placeholder="placeholder"
      :disabled="disabled"
      class="w-2 flex-1 px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" />
    <div class="flex rounded-lg overflow-hidden border border-gray-200">
      <button
        :class="[
          'px-2 py-2 text-xl font-medium transition-all duration-200',
          internalUnit === '两' ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          disabled && 'opacity-50 cursor-not-allowed'
        ]"
        :disabled="disabled"
        @click="handleUnitClick('两')">
        两
      </button>
      <button
        :class="[
          'px-2 py-2 text-xl font-medium border-l border-gray-200 transition-all duration-200',
          internalUnit === '斤' ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          disabled && 'opacity-50 cursor-not-allowed'
        ]"
        :disabled="disabled"
        @click="handleUnitClick('斤')">
        斤
      </button>
      <button
        :class="[
          'px-2 py-2 text-xl font-medium border-l border-gray-200 transition-all duration-200',
          internalUnit === '只' ? 'bg-blue-500 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100',
          disabled && 'opacity-50 cursor-not-allowed'
        ]"
        :disabled="disabled"
        @click="handleUnitClick('只')">
        只
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

// Props
const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
  unit: {
    type: String,
    default: "两",
    validator: (value) => ["两", "斤", "只"].includes(value),
  },
  step: {
    type: Number,
    default: 0.5,
  },
  min: {
    type: Number,
    default: 0.5,
  },
  placeholder: {
    type: String,
    default: "数值",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(["update:modelValue", "update:unit"]);

// 内部状态
const internalValue = ref(props.modelValue);
const internalUnit = ref(props.unit);

// 监听外部 prop 变化
watch(
  () => props.modelValue,
  (newVal) => {
    internalValue.value = newVal;
  },
);

watch(
  () => props.unit,
  (newVal) => {
    internalUnit.value = newVal;
  },
);

// 处理单位点击
const handleUnitClick = (unit) => {
  if (props.disabled) return;
  internalUnit.value = unit;
  emit("update:unit", unit);
};

// 处理数值变化
watch(internalValue, (newVal) => {
  emit("update:modelValue", newVal);
});

// 计算属性：组合重量字符串（供父组件使用）
const weightString = computed(() => {
  if (internalValue.value === null || internalValue.value === undefined) return "";
  return `${internalValue.value}${internalUnit.value}`;
});

// 暴露给父组件使用
defineExpose({
  weightString,
});
</script>
