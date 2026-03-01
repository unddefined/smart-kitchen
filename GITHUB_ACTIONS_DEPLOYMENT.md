# GitHub Actions 自动部署配置

## 🚀 部署流程概述

本项目配置了完整的 CI/CD 流水线，确保每次代码提交都能自动构建、测试和部署到相应环境。

## 📋 工作流文件

### 1. 主部署流水线 (`deploy.yml`)
**触发条件：**
- 推送到 `main` 或 `develop` 分支
- 文件变更包括：`backend/**`, `frontend/**`, `docker-compose.yml`

**主要步骤：**
1. **代码质量检查**
   - 安全性检查（seed脚本验证）
   - 前后端构建验证
   - 代码规范检查
   - 单元测试运行

2. **镜像构建与推送**
   - 构建后端 Docker 镜像
   - 构建前端 Docker 镜像
   - 推送到 GitHub Container Registry

3. **生产环境部署** (`main` 分支)
   - 数据保护快照
   - 代码同步
   - 服务更新
   - 数据库迁移
   - 健康检查

4. **开发环境部署** (`develop` 分支)
   - 类似生产环境流程但部署到开发服务器

### 2. 前端自动更新 (`frontend-auto-update.yml`)
**触发条件：**
- 前端代码变更推送到 `main` 分支
- 每6小时定时检查
- 手动触发 (`workflow_dispatch`)

**特点：**
- 专门针对前端变更的快速部署
- 独立于主部署流程
- 更频繁的更新检查

## 🔧 配置要求

### Secrets 配置
在 GitHub Repository Settings → Secrets 中配置：

```bash
# 生产环境
SSH_HOST=your-production-server-ip
SSH_USER=root
SSH_PRIVATE_KEY=your-private-key

# 开发环境
STAGING_SERVER_HOST=your-staging-server-ip
STAGING_SERVER_USER=root
STAGING_SERVER_SSH_KEY=your-staging-private-key

# 通知配置（可选）
TELEGRAM_CHAT_ID=your-chat-id
TELEGRAM_BOT_TOKEN=your-bot-token
```

### 环境变量
确保服务器上有正确的 `.env` 文件：
- `.env.production` - 生产环境配置
- `.env.staging` - 开发环境配置

## 🛡️ 安全措施

### 1. 数据保护
- 部署前自动创建数据库快照
- 验证数据完整性
- 监控关键数据表记录数变化

### 2. 代码安全检查
- Seed 脚本危险操作检测
- 依赖安全扫描
- 敏感信息检查

### 3. 部署安全
- 环境隔离
- 权限最小化
- 回滚机制

## 📊 监控与通知

### 健康检查
部署完成后自动执行：
- 服务状态检查
- API 响应验证
- 数据库连接测试
- 前端构建时间验证

### 通知机制
- Telegram 机器人通知
- 部署状态报告
- 异常情况告警

## 🔄 自动化特性

### 智能触发
```yaml
# 只在相关文件变更时触发
paths:
  - 'backend/**'
  - 'frontend/**'
  - 'docker-compose.yml'

# 忽略文档变更
paths-ignore:
  - '**/*.md'
  - 'docs/**'
```

### 并行处理
- 构建和测试并行执行
- 多环境同时部署
- 独立的前端更新流程

### 缓存优化
- Docker 层缓存
- NPM 依赖缓存
- 构建产物缓存

## 🚨 故障处理

### 常见问题
1. **部署失败**
   - 检查 Action 日志
   - 验证 SSH 连接
   - 确认环境变量

2. **服务启动失败**
   - 查看容器日志
   - 检查依赖服务状态
   - 验证配置文件

3. **数据问题**
   - 检查数据库快照
   - 验证迁移脚本
   - 确认连接参数

### 回滚方案
- 使用 Git 标签回滚代码
- 通过 Docker 镜像版本回滚
- 数据库快照恢复

## 📈 最佳实践

### 代码提交
```bash
# 提交前验证
npm run lint
npm run test

# 有意义的提交信息
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复bug描述"
```

### 分支策略
- `main` - 生产环境
- `develop` - 开发环境
- 功能分支 - 个人开发

### 部署验证
```bash
# 本地验证构建
cd frontend && npm run build
cd backend && npm run build

# 测试部署脚本
./scripts/test-deployment.sh
```

## 📞 支持与维护

### 日常维护
- 定期更新依赖
- 清理过期镜像
- 监控资源使用

### 性能优化
- 构建缓存优化
- 镜像大小优化
- 部署速度优化

这个配置确保了：
✅ 每次 Git 更新都会触发自动部署
✅ 前端变更会得到快速响应
✅ 完善的安全检查机制
✅ 详细的监控和通知系统
✅ 可靠的回滚方案