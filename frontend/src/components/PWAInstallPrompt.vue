<template>
  <div class="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl max-w-[90%] w-80 z-[1000] animate-slide-up">
    <div class="p-5">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold text-gray-900 text-lg">安装智能厨房</h3>
        <button
          @click="closePrompt"
          class="w-7 h-7 border-none bg-gray-100 rounded-full text-gray-600 cursor-pointer flex items-center justify-center text-xl transition-all hover:bg-gray-200 hover:text-gray-800">
          ×
        </button>
      </div>
      <p class="text-sm text-gray-600 mt-2 mb-4">添加到主屏幕以获得更好的体验</p>
      <div class="flex gap-3">
        <button
          @click="installPWA"
          class="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white border-none rounded-xl text-base font-semibold cursor-pointer transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0">
          <span>📲</span> 立即安装
        </button>
      </div>
    </div>
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

<style scoped>
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translate(-50%, 20px);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
