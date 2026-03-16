# 环境变量继承机制说明

## 📌 核心原理

### 1. 后端 (NestJS) - 手动加载 + 变量展开

**加载位置：** [`backend/src/main.ts`](file://d:\walker-11572\smart-kitchen\backend\src\main.ts:8-37)

```typescript
// 从项目根目录加载 .env 文件
const envPath = path.resolve(__dirname, '../../.env');
const dotenvResult = dotenv.config({ path: envPath });

// 手动展开 ${VAR} 引用
Object.keys(dotenvResult.parsed).forEach((key) => {
  let value = dotenvResult.parsed[key] || '';
  
  // 递归替换所有 ${VAR_NAME} 引用
  while (value.includes('${') && iterations < 10) {
    const newValue = value.replace(/\$\{([^}]+)\}/g, (_, varName) => {
      return process.env[varName] || dotenvResult.parsed?.[varName] || '';
    });
    value = newValue;
  }
  
  process.env[key] = value; // 注入到 Node.js 进程环境
});
```

**继承流程：**
```
┌──────────────────────┐
│  ../../.env 文件     │
│  (根目录统一配置)    │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│ backend/src/main.ts  │
│ 加载并展开变量引用   │
└─────────┬────────────┘
          │
          ▼
┌──────────────────────┐
│  process.env         │
│ (全局可访问)         │
└──────────────────────┘
```

**示例：**
```bash
# 根目录 .env
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=secret
DB_NAME=mydb

# 变量引用会自动展开
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
# ↓ 展开后存储在 process.env.DATABASE_URL
DATABASE_URL=postgresql://admin:secret@localhost:5432/mydb
```

---

### 2. 前端 (Vite) - 自动加载 + 优先级机制

**加载位置：** [`frontend/vite.config.js`](file://d:\walker-11572\smart-kitchen\frontend\vite.config.js:6-8)

```javascript
export default defineConfig(({ mode }) => {
  // Vite 自动按优先级加载 .env 文件
  const env = loadEnv(mode, process.cwd(), '');
  
  // 使用方式
  target: env.VITE_API_BASE_URL
});
```

**加载优先级（mode = development）：**

| 优先级 | 文件 | 说明 |
|--------|------|------|
| 1 (最高) | `.env.development.local` | 开发环境本地配置（不提交 Git） |
| 2 | `.env.development` | 开发环境配置 |
| 3 | `.env.local` | 本地覆盖配置（不提交 Git） |
| 4 (最低) | `.env` | 基础配置 |

**重要限制：**
- ❌ **不支持** `${VAR}` 变量嵌套引用
- ✅ 只有 `VITE_` 前缀的变量会暴露给前端代码
- ✅ 在浏览器中通过 `import.meta.env.VITE_XXX` 访问

**示例：**
```bash
# frontend/.env.development
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_TITLE=厨房系统 - 开发版

# ❌ 错误：不会展开
# API_HOST=localhost
# VITE_API_URL=http://${API_HOST}:3001  # 字面值，不会替换！

# ✅ 正确：直接定义完整值
VITE_API_BASE_URL=http://localhost:3001
```

---

## 🔗 跨目录继承方案

### 问题场景
前端需要访问数据库配置吗？不需要！但可能需要知道 API 地址。

### 当前项目的解决方案

#### 方案 A：根目录统一管理（推荐）✅

```
smart-kitchen/
├── .env                      # 统一配置所有环境变量
│   ├── DB_HOST=...
│   ├── DB_PASSWORD=...
│   └── VITE_API_BASE_URL=...  # 前端也用这个
│
├── backend/
│   └── src/main.ts           # 加载 ../../.env
│
└── frontend/
    └── vite.config.js        # Vite 自动加载父目录的 .env
```

**优点：**
- ✅ 单一数据源，避免重复
- ✅ 后端和前端使用相同的 API 地址配置
- ✅ 易于维护

**缺点：**
- ⚠️ 前端会暴露一些不必要的变量（但只有 `VITE_` 开头的会被打包）

---

#### 方案 B：前后端分离（当前采用）

```
smart-kitchen/
├── .env                      # 后端数据库配置
│   ├── DB_HOST=...
│   └── DATABASE_URL=...
│
├── frontend/
│   ├── .env                  # 前端基础配置
│   ├── .env.development      # 开发环境特定配置
│   └── .env.production       # 生产环境特定配置
│       └── VITE_API_BASE_URL=...
```

**优点：**
- ✅ 职责清晰，前后端配置分离
- ✅ 前端不会加载后端的敏感变量

**缺点：**
- ❌ 需要在多个文件中维护相同的配置（如 API 地址）
- ❌ 容易不一致

---

## 🎯 最佳实践建议

### 1. 根目录 `.env` 包含什么？

```bash
# ✅ 应该包含：
# - 数据库配置（仅后端使用）
DB_HOST=...
DB_PASSWORD=...
DATABASE_URL=...

# - 应用通用配置
NODE_ENV=development
PORT=3001
APP_SECRET=...

# - 前端需要的 API 地址（可选）
# 如果前后端地址需要保持一致，建议在这里定义
VITE_API_BASE_URL=http://localhost:3001
```

### 2. 前端 `frontend/.env.development` 包含什么？

```bash
# ✅ 应该包含：
# - 前端特有的配置
VITE_APP_TITLE=厨房系统 - 开发版
VITE_LOG_LEVEL=debug

# - 覆盖根目录的配置（如果需要不同）
# VITE_API_BASE_URL=http://custom-dev-api:3001

# ❌ 不应该包含：
# - 数据库密码等后端敏感信息（虽然不会被打包，但保持清洁）
```

### 3. 如何实现"继承"效果？

**方法 1：利用 Vite 的优先级**

```bash
# 根目录 .env（作为默认值）
VITE_API_BASE_URL=http://localhost:3001

# frontend/.env.development（开发环境覆盖）
# 如果需要不同的地址，在这里覆盖
# VITE_API_BASE_URL=http://dev-api.example.com
```

**方法 2：完全分离（推荐）**

```bash
# 根目录 .env - 只管后端
DB_HOST=...
DATABASE_URL=...

# frontend/.env.development - 只管前端
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_TITLE=开发版
```

---

## 🐛 常见问题排查

### Q1: 为什么修改 `.env` 后没生效？

**A:** 需要重启服务！

```bash
# 后端
Ctrl+C
npm run dev

# 前端
Ctrl+C
npm run dev
```

### Q2: 如何在代码中查看已加载的变量？

**后端 (Node.js):**
```typescript
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('All env vars:', Object.keys(process.env));
```

**前端 (浏览器控制台):**
```javascript
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
console.log('All env:', import.meta.env);
```

### Q3: 为什么 `${VAR}` 在前端不工作？

**A:** Vite 不支持变量嵌套！这是设计决策。

**解决方法：**
```bash
# ❌ 错误
API_HOST=localhost
VITE_API_URL=http://${API_HOST}:3001

# ✅ 正确 - 直接写完整值
VITE_API_URL=http://localhost:3001

# ✅ 或者在后端定义，通过 API 返回给前端
```

---

## 📊 继承关系总结表

| 配置项 | 定义位置 | 加载方式 | 支持嵌套 | 最终访问 |
|--------|----------|----------|----------|----------|
| 数据库 URL | 根目录 `.env` | `dotenv` | ✅ 支持 | `process.env.DATABASE_URL` |
| API 地址 | `frontend/.env.development` | `loadEnv` | ❌ 不支持 | `import.meta.env.VITE_API_BASE_URL` |
| 应用密钥 | 根目录 `.env` | `dotenv` + 手动展开 | ✅ 支持 | `process.env.APP_SECRET` |
| PWA 配置 | `frontend/.env` | `loadEnv` | ❌ 不支持 | `import.meta.env.VITE_PWA_ENABLED` |

---

**最后更新：** 2026-03-16  
**相关文档：** [environment-variables.md](./environment-variables.md)
