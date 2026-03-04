# 快速启动指南

## 🎯 本地开发（推荐）

### 方式一：使用默认配置（最简单）

```bash
# 1. 启动后端（新终端窗口）
cd backend
npm run dev:backend

# 2. 启动前端（新终端窗口）
cd frontend
npm run dev
```

访问 http://localhost:5173

---

### 方式二：明确指定环境

```bash
# 后端
cd backend && npm run dev:backend

# 前端（明确使用本地环境）
cd frontend && npm run dev:local
```

---

## 🌐 测试生产环境

### 本地开发模式连接服务器后端

```bash
cd frontend
npm run dev:prod
```

**注意**：需要确保服务器后端正在运行。

---

## 📦 构建生产版本

### 标准构建（使用生产环境配置）

```bash
cd frontend
npm run build
```

### 构建本地测试版本

```bash
cd frontend
npm run build:local
```

---

## 🔍 验证当前环境

打开浏览器 Console，检查 API 地址：

```javascript
// 应该显示当前使用的 API 基础地址
console.log(import.meta.env.VITE_API_BASE_URL);
```

---

## ⚠️ 注意事项

1. **修改环境后必须重启**：修改 `.env` 文件后，需要停止并重新启动开发服务器
2. **构建产物固化环境**：`npm run build` 后，API 地址就固定在代码中了
3. **端口占用问题**：如果 3001 或 5173 端口被占用，需要在对应配置文件中修改

---

## 🛠️ 故障排查

### 后端无法连接

**症状**：前端请求失败，控制台显示网络错误

**解决**：
1. 确认后端已启动：访问 http://localhost:3001/health
2. 检查端口是否正确：`netstat -ano | findstr 3001`
3. 查看后端日志是否有错误

### 前端页面空白

**解决**：
1. 清除浏览器缓存
2. 硬刷新页面（Ctrl+Shift+R）
3. 检查浏览器 Console 错误信息

### API 返回 500 错误

**可能原因**：
- 数据库连接失败
- 后端代码错误
- 环境变量配置错误

**解决步骤**：
1. 查看后端日志
2. 检查数据库连接状态
3. 验证环境变量值

---

**提示**：遇到问题时，优先查看后端的日志输出，大部分错误信息都会在那里显示。
