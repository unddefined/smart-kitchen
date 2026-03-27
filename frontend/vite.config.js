import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig(({ mode }) => {
   // 加载环境变量
   const env = loadEnv(mode, process.cwd(), "");

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
                     src: "pwa.png",
                     sizes: "336x336",
                     type: "image/png",
                  },
               ],
            },
            workbox: {
               globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,ico}"],
               runtimeCaching: [
                  {
                     urlPattern: /^https:\/\/api\./i,
                     handler: "NetworkFirst", // API 请求优先网络
                     options: {
                        cacheName: "api-cache",
                        expiration: {
                           maxEntries: 100,
                           maxAgeSeconds: 300, // 5 分钟缓存
                        },
                        networkTimeoutSeconds: 10, // 网络超时 10 秒
                     },
                  },
                  {
                     urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
                     handler: "CacheFirst", // 静态图片资源优先缓存
                     options: {
                        cacheName: "static-images",
                        expiration: {
                           maxEntries: 60,
                           maxAgeSeconds: 30 * 24 * 60 * 60, // 30 天缓存
                        },
                     },
                  },
                  {
                     urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*$/i,
                     handler: "CacheFirst", // Google 字体优先缓存
                     options: {
                        cacheName: "google-fonts-cache",
                        expiration: {
                           maxEntries: 10,
                           maxAgeSeconds: 60 * 60 * 24 * 365, // 365 天缓存
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
               target: env.VITE_API_BASE_URL || "http://8.145.34.30:3001", // 修改默认值为生产环境地址
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
                  "vue-vendor": ["vue", "vue-router", "pinia"],
                  "utils-vendor": ["lodash-es", "axios"],
                  "ui-vendor": ["@headlessui/vue"],
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
