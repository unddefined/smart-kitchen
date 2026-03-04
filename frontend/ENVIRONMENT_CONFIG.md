# 前端环境配置说明

## 环境文件说明

项目支持通过环境变量配置不同的后端 API 地址，已创建以下配置文件：

### 1. `.env.development` - 本地开发环境
- API 地址：`http://localhost:3001`
- 用途：本地前后端联调开发
- 使用方式：
  ```bash
  # 启动开发服务器（自动使用 .env.development）
  npm run dev
  ```

### 2. `.env.production` - 生产环境
- API 地址：`http://8.145.34.30:3001`
- 用途：部署到服务器时使用
- 使用方式：
  ```bash
  # 构建生产版本
  npm run build
  ```

### 3. `.env` - 默认配置
- API 地址：`http://localhost:3001`
- 用途：作为默认配置和模板

## 快速切换环境

### 开发模式
```bash
# 本地开发（连接本地后端）
npm run dev

# 或指定环境
npm run dev -- --mode development
```

### 生产构建
```bash
# 生产构建（自动使用 .env.production）
npm run build

# 或指定环境
npm run build -- --mode production
```

## 自定义环境

如需连接其他后端地址，可以：

1. 修改对应环境文件的 `VITE_API_BASE_URL` 值
2. 或创建新的环境文件，如 `.env.staging`：
   ```
   VITE_API_BASE_URL=http://your-staging-server.com:3001
   ```
3. 使用时指定环境：
   ```bash
   npm run dev -- --mode staging
   ```

## 注意事项

- 所有以 `VITE_` 开头的环境变量才会被 Vite 识别并注入到客户端代码
- 修改环境文件后需要重启开发服务器才能生效
- 生产环境构建时，环境变量会被固化到构建产物中
