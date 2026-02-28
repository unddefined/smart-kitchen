# GitHub Actions 自动部署配置说明

## 🎯 配置目标
实现代码推送后自动构建、测试、部署到生产环境的完整CI/CD流程，确保前端代码更新后能自动部署最新版本。

## 🚀 自动部署流程

### 触发条件
- **主分支推送** (`main`): 触发完整生产环境部署
- **开发分支推送** (`develop`): 触发开发环境部署
- **路径过滤**: 仅当前端、后端或配置文件变更时触发

### 完整部署流程

```mermaid
graph TD
    A[代码推送] --> B[代码质量检查]
    B --> C[安全检查]
    B --> D[前端构建验证]
    B --> E[代码规范检查]
    B --> F[单元测试]
    C --> G{安全检查通过?}
    D --> H{前端构建成功?}
    E --> I{代码规范通过?}
    F --> J{测试通过?}
    G -->|否| K[部署中止]
    H -->|否| K
    I -->|否| K
    J -->|否| K
    G -->|是| L[构建Docker镜像]
    H -->|是| L
    I -->|是| L
    J -->|是| L
    L --> M[推送到镜像仓库]
    M --> N[生产环境部署]
    N --> O[数据安全检查]
    N --> P[服务更新]
    N --> Q[健康检查]
    N --> R[前端更新验证]
    O --> S[部署完成]
    P --> S
    Q --> S
    R --> S
```

## 🔧 配置详解

### 1. 代码质量检查阶段
```yaml
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - 代码检出
      - Node.js环境设置
      - 依赖安装
      - 安全检查（seed脚本）
      - 前端构建验证
      - 代码规范检查
      - 单元测试
```

### 2. 镜像构建阶段
```yaml
jobs:
  build-and-push:
    needs: lint-and-test
    steps:
      - 代码检出
      - Docker Buildx设置
      - 镜像仓库登录
      - 后端镜像构建推送
      - 前端镜像构建推送
```

### 3. 生产环境部署阶段
```yaml
jobs:
  deploy-production:
    needs: build-and-push
    steps:
      - 代码检出
      - 数据安全检查
      - SSH远程部署
      - 数据库快照
      - 服务更新
      - 健康检查
      - 前端更新验证
```

## 🛡️ 安全保障机制

### 1. Seed脚本安全检查
```bash
# 检查未注释的危险操作
grep -v "^[[:space:]]*//" ./backend/prisma/seed.ts | grep -E "deleteMany\(\)|truncate|drop table"
```

### 2. 数据保护措施
- 部署前自动创建数据库快照
- 监控关键数据表记录数变化
- 生产环境数据只读保护
- 部署后数据完整性验证

### 3. 环境隔离
- 独立的生产/开发环境配置
- 不同的环境变量文件
- 分离的服务器部署

## 🌐 前端自动更新机制

### 构建集成
前端构建过程完全集成到Docker镜像构建阶段：
```dockerfile
# 前端Dockerfile关键步骤
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # 👈 关键：每次构建都执行
```

### 部署验证
```bash
# 部署后验证前端更新
FRONTEND_BUILD_TIME=$(docker compose exec -T frontend stat -c %y /usr/share/nginx/html/index.html)
echo "前端构建时间: $FRONTEND_BUILD_TIME"
```

### 自动更新检查
定时检查前端构建时间，超过24小时自动触发更新：
```bash
CURRENT_BUILD_TIME=$(docker compose exec -T frontend stat -c %Y /usr/share/nginx/html/index.html)
TIME_DIFF=$((CURRENT_TIME - CURRENT_BUILD_TIME))
HOURS_DIFF=$((TIME_DIFF / 3600))

if [ $HOURS_DIFF -gt 24 ]; then
  # 触发自动更新
  docker compose build frontend
  docker compose up -d frontend
fi
```

## 🔧 环境配置要求

### GitHub Secrets配置
需要在仓库设置中配置以下Secrets：
```bash
# 生产环境
SSH_HOST=8.145.34.30
SSH_USER=root
SSH_PRIVATE_KEY=***你的SSH私钥***

# 开发环境（可选）
STAGING_SERVER_HOST=your-staging-server
STAGING_SERVER_USER=your-user
STAGING_SERVER_SSH_KEY=***开发环境SSH私钥***
```

### 环境变量文件
```bash
# .env.production (生产环境)
NODE_ENV=production
DATABASE_URL=postgresql://smart_kitchen:password@postgres:5432/smart_kitchen_prod

# .env.staging (开发环境)
NODE_ENV=development
DATABASE_URL=postgresql://smart_kitchen:password@postgres:5432/smart_kitchen_staging
```

## 📊 监控与验证

### 部署状态检查
```bash
# 检查容器状态
docker compose ps

# 检查服务健康
curl -f http://localhost:3001/api/health
curl -f http://localhost

# 检查前端构建时间
docker compose exec frontend stat /usr/share/nginx/html/index.html
```

### 日志监控
```bash
# 查看部署日志
docker compose logs backend
docker compose logs frontend
docker compose logs postgres
```

## 🚨 故障处理

### 常见问题及解决方案

1. **部署失败**
   - 检查GitHub Actions日志
   - 验证SSH连接配置
   - 确认Docker镜像构建成功

2. **前端未更新**
   - 手动执行：`docker compose build frontend && docker compose up -d frontend`
   - 检查构建时间戳
   - 验证Nginx配置

3. **数据异常**
   - 检查部署前快照
   - 验证数据库迁移
   - 执行数据恢复脚本

## 📈 最佳实践

### 1. 代码提交规范
- 前端修改后确保能通过构建验证
- 后端修改需通过所有测试
- 重要变更先在develop分支测试

### 2. 部署策略
- 小步快跑，频繁部署
- 保持主分支始终可部署
- 建立回滚机制

### 3. 监控告警
- 设置部署失败告警
- 监控服务健康状态
- 跟踪关键业务指标

---
**最后更新**: 2026年2月28日
**版本**: v2.0
**状态**: ✅ 已配置并验证