# CSS样式调试指南

## 🎨 样式配置说明

### 当前样式架构
```
frontend/
├── src/
│   ├── styles/
│   │   ├── main.css        # Tailwind CSS基础样式 + 自定义变量
│   │   └── mobile.css      # 移动端专用优化样式
│   └── main.js            # 样式文件引入入口
├── tailwind.config.js     # Tailwind配置文件
└── postcss.config.js      # PostCSS配置文件
```

### 样式文件引入顺序
```javascript
// main.js中的样式引入顺序
import './styles/main.css'    // Tailwind基础样式 + 自定义CSS变量
import './styles/mobile.css'  // 移动端优化样式（覆盖和补充）
```

## 🔍 常见样式问题排查

### 1. Tailwind样式不生效

**问题现象**: Tailwind的工具类（如`bg-blue-500`、`text-center`等）没有效果

**解决方案**:
```bash
# 1. 检查tailwind.config.js配置
# 确认content字段包含了所有Vue文件路径
content: [
  "./index.html",
  "./src/**/*.{vue,js,ts,jsx,tsx}",
]

# 2. 重启开发服务器
npm run dev

# 3. 检查PostCSS配置
# 确认postcss.config.js正确配置了tailwindcss插件
```

### 2. 自定义CSS变量不生效

**问题现象**: `var(--primary-color)`等CSS变量无法使用

**解决方案**:
```css
/* 确保在main.css中正确定义变量 */
:root {
  --primary-color: #4ade80;
  --secondary-color: #22c55e;
  /* ... 其他变量 */
}

/* 在组件中使用 */
.my-element {
  background-color: var(--primary-color);
}
```

### 3. 移动端样式覆盖问题

**问题现象**: 移动端特定样式被其他样式覆盖

**解决方案**:
```css
/* 在mobile.css中使用更高优先级的选择器 */
@media (max-width: 480px) {
  .mobile-app .btn-mobile {
    min-height: 44px !important;
  }
}
```

## 🛠️ 调试工具和方法

### 1. 浏览器开发者工具
```javascript
// 在控制台中检查样式计算结果
getComputedStyle(document.querySelector('.your-class'))

// 检查元素应用的样式规则
$0.classList  // 查看元素的CSS类
```

### 2. Tailwind CSS调试
```bash
# 生成完整的Tailwind CSS文件用于调试
npx tailwindcss -o ./debug-output.css --watch
```

### 3. 样式优先级检查
```css
/* CSS优先级规则 */
内联样式 > ID选择器 > 类选择器 > 元素选择器
!important声明具有最高优先级
```

## 📱 移动端样式优化

### 1. 触控目标大小
```css
/* 确保触控目标至少44px */
.btn-mobile {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}
```

### 2. 响应式断点
```css
/* Tailwind默认断点 */
sm: 640px
md: 768px  
lg: 1024px
xl: 1280px
2xl: 1536px

/* 自定义移动端断点 */
@media (max-width: 480px) {
  /* 手机竖屏样式 */
}
```

### 3. 安全区域适配
```css
/* iOS安全区域适配 */
.safe-area-top {
  padding-top: max(12px, env(safe-area-inset-top));
}

.safe-area-bottom {
  padding-bottom: max(12px, env(safe-area-inset-bottom));
}
```

## ⚡ 性能优化建议

### 1. CSS文件优化
```javascript
// vite.config.js中配置CSS优化
export default defineConfig({
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ]
    }
  },
  build: {
    cssCodeSplit: true,  // 启用CSS代码分割
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name].[hash].[ext]'  // 优化文件命名
      }
    }
  }
})
```

### 2. 样式按需加载
```javascript
// 避免引入不必要的Tailwind组件
// 在tailwind.config.js中精确配置content
content: [
  "./src/**/*.{vue,js}",  // 只包含实际使用的文件类型
],
```

## 🐛 已知问题和解决方案

### 问题1: 开发环境下样式闪烁
**原因**: HMR热更新导致的样式重新计算
**解决方案**: 
```javascript
// 在vite.config.js中优化HMR配置
export default defineConfig({
  server: {
    hmr: {
      overlay: false  // 禁用错误覆盖层
    }
  }
})
```

### 问题2: 生产环境样式丢失
**原因**: CSS代码分割或Tree Shaking过于激进
**解决方案**:
```javascript
// 确保关键样式不被摇树优化
// 在tailwind.config.js中明确保留必要样式
safelist: [
  'bg-red-500',
  'text-yellow-500',
  'border-green-500',
  // ... 其他关键样式类
]
```

### 问题3: 移动端1px边框模糊
**解决方案**:
```css
/* 使用transform缩放实现清晰的1px边框 */
.border-1px {
  position: relative;
}

.border-1px::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  transform: scale(0.5);
  transform-origin: 0 0;
  border: 1px solid #e5e5e5;
  pointer-events: none;
}
```

## 📋 样式规范检查清单

- [ ] Tailwind基础样式正确引入
- [ ] 自定义CSS变量定义完整
- [ ] 移动端响应式断点配置正确
- [ ] 触控目标大小符合44px标准
- [ ] 安全区域适配已实现
- [ ] CSS优先级设置合理
- [ ] 生产环境样式打包正常
- [ ] 性能优化配置到位

---
*如遇其他样式问题，请参考此指南进行排查，或联系技术支持团队。*