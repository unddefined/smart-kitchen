import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";

// 引入Tailwind CSS基础样式
import "./styles/main.css";
// 引入移动端优化样式
import "./styles/mobile.css";

// 移动端PWA优化
const initMobileOptimizations = () => {
  // 禁止双击缩放
  let lastTouchEnd = 0;
  document.addEventListener(
    "touchend",
    function (event) {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    false,
  );

  // 禁止长按选择文本
  document.addEventListener("selectstart", function (e) {
    if (!e.target.matches("input, textarea")) {
      e.preventDefault();
    }
  });

  // 添加移动端meta标签
  const metaViewport = document.createElement("meta");
  metaViewport.name = "viewport";
  metaViewport.content =
    "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover";
  document.head.appendChild(metaViewport);

  // 添加主题色
  const themeColor = document.createElement("meta");
  themeColor.name = "theme-color";
  themeColor.content = "#3b82f6";
  document.head.appendChild(themeColor);

  // 添加移动设备兼容性meta标签
  const appleMobileWebAppCapable = document.createElement("meta");
  appleMobileWebAppCapable.name = "apple-mobile-web-app-capable";
  appleMobileWebAppCapable.content = "yes";
  document.head.appendChild(appleMobileWebAppCapable);

  const appleMobileWebAppStatusBarStyle = document.createElement("meta");
  appleMobileWebAppStatusBarStyle.name =
    "apple-mobile-web-app-status-bar-style";
  appleMobileWebAppStatusBarStyle.content = "black-translucent";
  document.head.appendChild(appleMobileWebAppStatusBarStyle);
};

// 初始化移动端优化
initMobileOptimizations();

// 添加一个注释来触发前端部署
// 2026-03-01 16:30: 前端样式更新部署测试

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount("#app");
