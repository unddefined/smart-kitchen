import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: "智能厨房管理系统",
          short_name: "厨房助手",
          description: "专业的厨房订单管理和菜品制作系统",
          theme_color: "#3b82f6",
          background_color: "#ffffff",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          lang: "zh-CN",
          icons: [
            {
              src: "src/assets/icons/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "src/assets/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,ico}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./,
              handler: "CacheFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24, // 24 hours
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL || "http://localhost:3001", // 使用环境变量
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["vue", "vue-router", "pinia"],
            ui: ["@headlessui/vue"],
          },
        },
      },
    },
    css: {
      postcss: {
        plugins: [require("tailwindcss"), require("autoprefixer")],
      },
    },
  };
});
