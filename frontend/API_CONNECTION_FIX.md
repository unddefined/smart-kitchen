# API 连接错误修复说明

## 问题描述

在 OrderView 页面操作起菜或暂停后，出现以下错误：

```
GET http://localhost:3001/api/orders/79 net::ERR_CONNECTION_REFUSED
```

## 根本原因

1. **Vite 代理配置问题**：
   - `vite.config.js` 中的代理配置默认指向 `http://localhost:3001`
   - 实际后端服务运行在 `http://8.145.34.30:3001`（生产环境）

2. **自动刷新机制触发**：
   - OrderView 组件使用了 `useOrderAutoRefresh` composable
   - 当操作起菜或暂停时，WebSocket 收到更新事件
   - 触发 `loadOrderDetail()` 函数重新加载订单详情

3. **Watch 立即执行**：
   - OrderView 中有监听 `props.orderId` 的 watch
   - 配置了 `{ immediate: true }`，组件加载时立即执行
   - Vite 热重载时会触发组件重新渲染，导致 watch 再次执行

4. **API 地址错误**：
   - 请求通过 Vite 代理尝试访问 `http://localhost:3001`
   - 本地没有运行后端服务，导致连接被拒绝

## 解决方案

### 1. 创建环境配置文件

创建了三个环境变量配置文件：

#### `.env.development` - 开发环境配置
```env
VITE_API_BASE_URL=http://localhost:3001
```

#### `.env.production` - 生产环境配置
```env
VITE_API_BASE_URL=http://8.145.34.30:3001
```

#### `.env` - 默认环境配置
```env
VITE_API_BASE_URL=http://8.145.34.30:3001
```

### 2. 修改 Vite 配置

修改了 `vite.config.js` 中的默认后端地址：

```javascript
proxy: {
  "/api": {
    target: env.VITE_API_BASE_URL || "http://8.145.34.30:3001", // 修改默认值为生产环境地址
    changeOrigin: true,
    secure: false,
  },
}
```

## 使用方式

### 本地开发模式

启动开发服务器时会自动使用 `.env.development`：

```bash
cd frontend
npm run dev
```

此时 API 请求会代理到 `http://localhost:3001`

### 生产构建模式

构建时会自动使用 `.env.production`：

```bash
cd frontend
npm run build
```

构建后的文件会使用 `http://8.145.34.30:3001` 作为后端地址

### 指定模式启动

可以显式指定运行模式：

```bash
# 开发模式
npm run dev -- --mode development

# 生产模式（本地测试用）
npm run dev -- --mode production
```

## 技术细节

### 环境变量加载机制

1. Vite 在项目启动时自动加载 `.env.*` 文件
2. 使用 `loadEnv(mode, process.cwd(), '')` 加载对应模式的配置
3. 只有以 `VITE_` 前缀的环境变量才会暴露到客户端代码中
4. 在代码中通过 `import.meta.env.VITE_API_BASE_URL` 访问

### API 请求流程

```
前端组件调用 API
    ↓
orderService.getOrderDetail()
    ↓
api.orders.get()
    ↓
request() 函数
    ↓
fetch(API_BASE_URL + url)
    ↓
Vite 代理拦截 /api 路径
    ↓
转发到 target 配置的地址
```

### WebSocket 自动刷新

OrderView 组件通过 `useOrderAutoRefresh` 实现了自动刷新：

```javascript
useOrderAutoRefresh({
  refreshFn: loadOrderDetail,
  mode: 'detail',
  orderId: props.orderId,
});
```

这会在以下情况触发刷新：
- 订单状态变更（order-updated）
- 菜品状态变更（item-updated）
- 菜品新增（item-created）
- 菜品删除（item-deleted）

## 验证修复

1. 重启 Vite 开发服务器
2. 打开 OrderView 页面
3. 执行起菜或暂停操作
4. 检查浏览器开发者工具 Network 面板
5. 确认 API 请求地址为 `http://8.145.34.30:3001/api/orders/xx`

## 注意事项

1. **不要提交 .env 文件到 Git**（如果项目有敏感配置）
2. 确保后端服务在生产环境正常运行
3. 如果需要在本地调试，需要同时启动后端服务
4. 环境变量变更后需要重启开发服务器才能生效

## 相关文件

- `frontend/.env` - 默认环境配置
- `frontend/.env.development` - 开发环境配置
- `frontend/.env.production` - 生产环境配置
- `frontend/vite.config.js` - Vite 配置文件
- `frontend/src/views/OrderView.vue` - 订单详情页面
- `frontend/src/composables/useOrderAutoRefresh.js` - 订单自动刷新逻辑
- `frontend/src/services/api.js` - API 基础配置
