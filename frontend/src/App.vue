<template>
  <div id="app" class="mobile-app">
    <div class="app-container">
      <!-- 测试导航（仅在开发环境显示） -->
      <TestNavigation v-if="isDevelopment" />

      <!-- 主要内容区域 -->
      <main class="main-content" :class="{ 'with-test-nav': isDevelopment }">
        <router-view />
      </main>
      <!-- 模态框容器 - 用于Teleport目标 -->
      <div id="modal-container" class="fixed inset-0 pointer-events-none"></div>

      <!-- 全局底部导航栏 - 烹调/库存/待办/历史 -->
      <nav class="global-bottom-nav safe-area-bottom">
        <button
          :class="{ active: activeModule === 'cooking' }"
          @click="switchToModule('cooking')"
          class="nav-item"
        >
          <span class="nav-text">烹调</span>
        </button>
        <button
          :class="{ active: activeModule === 'store' }"
          @click="switchToModule('store')"
          class="nav-item"
        >
          <span class="nav-text">库存</span>
        </button>
        <button
          :class="{ active: activeModule === 'todo' }"
          @click="switchToModule('todo')"
          class="nav-item"
        >
          <span class="nav-text">待办</span>
        </button>
        <button
          :class="{ active: activeModule === 'history' }"
          @click="switchToModule('history')"
          class="nav-item"
        >
          <span class="nav-text">历史</span>
        </button>
      </nav>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import TestNavigation from "./components/TestNavigation.vue";

const router = useRouter();
const route = useRoute();

// 开发环境检测
const isDevelopment = import.meta.env.DEV;

// 根据当前路由确定激活模块
const activeModule = ref("cooking");

// 监听路由变化更新激活模块
watch(
  () => route.path,
  (newPath) => {
    if (newPath === "/" || newPath === "/cooking") {
      activeModule.value = "cooking";
    } else if (newPath === "/store") {
      activeModule.value = "store";
    } else if (newPath === "/todo") {
      activeModule.value = "todo";
    } else if (newPath === "/history") {
      activeModule.value = "history";
    }
  },
  { immediate: true },
);

// 模块路由映射
const moduleRoutes = {
  cooking: "/cooking",
  store: "/store",
  todo: "/todo",
  history: "/history",
};

const switchToModule = (module) => {
  activeModule.value = module;
  const routePath = moduleRoutes[module];
  if (routePath && route.path !== routePath) {
    router.push(routePath);
  }
};
</script>

<style>
/* 移动端基础样式重置 */
.mobile-app {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  touch-action: manipulation; /* 优化触摸体验 */
  height: 100vh;
  overflow: hidden;
}

.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.main-content {
  flex: 1;
  overflow-y: auto;
}

.main-content.with-test-nav {
  margin-top: 50px; /* 为测试导航留出空间 */
}

/* 全局底部导航栏 - 烹调/库存/待办/历史 */
.global-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
  /* z-index: 100; */
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  /* padding: 8px 4px; */
  background: none;
  border: none;
  color: #666;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item.active {
  color: #3b82f6;
}

.nav-text {
  font-size: 18px;
}

/* 安全区域适配 */
.safe-area-bottom {
  padding-bottom: max(10px, env(safe-area-inset-bottom));
}

/* 禁用文本选择，提升移动端体验 */
* {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* 允许输入框选择文本 */
input,
textarea {
  -webkit-user-select: auto;
  -moz-user-select: auto;
  -ms-user-select: auto;
  user-select: auto;
}

/* 移动端点击效果优化 */
button,
.clickable {
  -webkit-tap-highlight-color: transparent;
  outline: none;
}

/* 滚动条优化 */
::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

/* PWA安装提示样式 */
.pwa-install-prompt {
  position: fixed;
  /* bottom: 70px; */
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  /* padding: 16px; */
  max-width: 90%;
  z-index: 1000;
}

/* 模态框容器样式 */
#modal-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  pointer-events: none;
}

#modal-container > * {
  pointer-events: auto;
}

/* 移动端特定优化 */
@media (max-width: 480px) {
  body {
    font-size: 18px; /* 防止iOS缩放 */
  }

  /* 优化输入框 */
  input,
  textarea,
  select {
    font-size: 16px; /* 防止iOS自动缩放 */
  }

  .main-content.with-test-nav {
    margin-top: 44px; /* 移动端较小的导航高度 */
  }
}
</style>
