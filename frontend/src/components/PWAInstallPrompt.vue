<template>
  <div class="pwa-install-prompt">
    <div class="flex-1">
      <h3 class="font-semibold text-gray-900">安装智能厨房</h3>
      <p class="text-sm text-gray-600 mt-1">添加到主屏幕以获得更好的体验</p>
    </div>
    <button @click="installPWA" class="pwa-install-btn">安装</button>
    <button @click="closePrompt" class="pwa-close-btn">×</button>
  </div>
</template>

<script setup>
const emit = defineEmits(["close"]);

const installPWA = () => {
  if (window.installPWA) {
    window.installPWA();
  }
};

const closePrompt = () => {
  emit("close");
};
</script>
