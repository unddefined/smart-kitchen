# 环境变量配置指南

本文档说明 Smart Kitchen System 的环境变量配置方法。

## 📁 文件结构

```
smart-kitchen/
├── .env.example              # 根目录配置模板（可提交到 Git）
├── .env                      # 本地开发配置（不提交）
├── .env.production           # 生产环境配置（不提交，通过安全方式管理）
├── .gitignore                # Git 忽略规则
├── backend/
│   ├── .env.example          # Backend 配置模板
│   ├── .env                  # Backend 本地配置
│   └── .env.production       # Backend 生产配置
└── frontend/
    ├── .env.example          # Frontend 配置模板
    ├── .env                  # Frontend 默认配置
    ├── .env.development      # Frontend 开发配置
    └── .env.production       # Frontend 生产配置
```

## 🔐 安全规范

### ✅ 可以提交到 Git 的文件
- `.env.example` - 配置模板，包含占位符
- `backend/.env.example`
- `frontend/.env.example`

### ❌ 禁止提交到 Git 的文件
- `.env` - 本地配置
- `.env.production` - 生产环境配置（包含敏感信息）
- `backend/.env*` - 后端配置
- `frontend/.env*` - 前端配置（除示例外）

## 🚀 快速开始

### 1. 本地开发配置

**步骤 1：** 复制示例模板
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**步骤 2：** 修改数据库配置
```bash
# .env 文件
DB_HOST=localhost          # 或远程数据库地址
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=smart_kitchen
```

**步骤 3：** 启动服务
```bash
# 后端
cd backend && npm run dev

# 前端
cd frontend && npm run dev
```

### 2. 生产环境部署

**⚠️ 重要：** 生产环境配置应通过以下方式之一管理：
- 服务器环境变量
- Docker secrets
- 密钥管理服务（如 AWS Secrets Manager）
- 加密的 CI/CD 变量

**步骤 1：** 在服务器上创建配置文件
```bash
# SSH 登录服务器
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30

# 创建生产环境配置
cd /path/to/smart-kitchen
nano .env.production
```

**步骤 2：** 配置必要变量
```bash
# 数据库配置
DB_HOST=8.145.34.30
DB_USER=smart_admin
DB_PASSWORD=<真实密码>
DB_NAME=smart_kitchen

# 应用密钥（必须修改！）
APP_SECRET=<随机生成的 32+ 字符密钥>
JWT_SECRET=<随机生成的 JWT 密钥>

# CORS 配置
ALLOWED_ORIGINS=http://your-domain.com
```

## 📋 配置项说明

### 核心配置

| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `DB_HOST` | 数据库主机地址 | - | ✅ |
| `DB_PORT` | 数据库端口 | `5432` | ✅ |
| `DB_USER` | 数据库用户名 | - | ✅ |
| `DB_PASSWORD` | 数据库密码 | - | ✅ |
| `DB_NAME` | 数据库名称 | `smart_kitchen` | ✅ |
| `DATABASE_URL` | Prisma 连接字符串（自动构建） | - | ✅ |
| `NODE_ENV` | 运行环境 | `development` | ✅ |
| `PORT` | 后端服务端口 | `3001` | ✅ |
| `APP_SECRET` | 应用密钥（32+ 字符） | - | ✅ |

### 数据库连接池配置

| 变量名 | 说明 | 推荐值（开发） | 推荐值（生产） |
|--------|------|----------------|----------------|
| `DB_POOL_MAX` | 最大连接数 | `10` | `20-50` |
| `DB_POOL_MIN` | 最小连接数 | `2` | `5-10` |
| `DB_CONNECT_TIMEOUT` | 连接超时 (ms) | `5000` | `5000` |
| `DB_IDLE_TIMEOUT` | 空闲超时 (ms) | `30000` | `30000` |

### 日志配置

| 变量名 | 说明 | 开发环境 | 生产环境 |
|--------|------|----------|----------|
| `LOG_LEVEL` | 日志级别 | `debug` | `info` 或 `warn` |
| `QUERY_LOGGING` | 是否记录 SQL 查询 | `true` | `false` |

### 前端特定配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | API 基础地址 | `http://localhost:3001` |
| `VITE_APP_TITLE` | 应用标题 | `Smart Kitchen System` |
| `VITE_PWA_ENABLED` | 是否启用 PWA | `true` |
| `VITE_SOURCE_MAP` | 是否生成 Source Map | `true`(开发) / `false`(生产) |
| `VITE_LOG_LEVEL` | 前端日志级别 | `debug` |

## 🔧 高级配置

### SSL/TLS 配置（生产环境推荐）

```bash
# 启用数据库 SSL 连接
DB_SSL_ENABLED=true
DB_SSL_REJECT_UNAUTHORIZED=true

# 如果需要自定义 CA 证书
# DB_SSL_CA_PATH=/path/to/ca-cert.pem
```

### 健康检查配置

```bash
HEALTH_CHECK_ENABLED=true
MONITOR_INTERVAL=30000  # 30 秒
PERFORMANCE_THRESHOLD_WARNING=1000   # 1s 警告
PERFORMANCE_THRESHOLD_ERROR=3000     # 3s 错误
```

### CORS 配置

```bash
# 允许多个来源
ALLOWED_ORIGINS=https://example.com,https://admin.example.com

# 开发环境（仅限本地）
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## 🛡️ 安全最佳实践

### 1. 密钥生成

使用以下命令生成安全的随机密钥：

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32

# Linux/Mac
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
```

### 2. 权限管理

确保生产环境配置文件权限正确：
```bash
chmod 600 .env.production
chown root:root .env.production
```

### 3. 定期轮换密钥

建议每 90 天更换一次：
- `APP_SECRET`
- `JWT_SECRET`
- 数据库密码

### 4. 审计日志

定期检查谁访问了环境变量文件：
```bash
# Linux 审计日志
auditctl -w /path/to/.env.production -p rwa -k env_file_access
```

## 🐛 故障排查

### 问题：Prisma 无法连接数据库

**检查清单：**
1. 确认 `DATABASE_URL` 格式正确
2. 验证数据库凭据（用户名、密码）
3. 检查防火墙是否允许连接
4. 确认数据库服务正在运行
5. 测试网络连接：`telnet DB_HOST DB_PORT`

### 问题：前端无法调用 API

**检查清单：**
1. 确认 `VITE_API_BASE_URL` 地址正确
2. 检查后端 CORS 配置
3. 验证网络连通性
4. 查看浏览器控制台错误信息

### 问题：环境变量未生效

**可能原因：**
1. 文件命名错误（应为 `.env` 而非 `.env.txt`）
2. 文件路径不正确
3. 需要重启服务才能加载新变量
4. Docker 容器需要重建

**解决方法：**
```bash
# 查看当前环境变量
printenv | grep DB_

# 重启服务
npm run dev
# 或
docker-compose restart
```

## 📚 相关文档

- [Prisma 数据库配置](https://prisma.org.cn/docs/getting-started/prisma-orm/quickstart/prisma-postgres)
- [NestJS 配置模块](https://docs.nestjs.com/techniques/configuration)
- [Vite 环境变量](https://cn.vitejs.dev/guide/env-and-mode.html)
- [Docker Secrets 管理](https://docs.docker.com/engine/swarm/secrets/)

---

**最后更新：** 2026-03-16  
**维护者：** Smart Kitchen Team
