# Smart Kitchen 自动化部署配置指南

## 📋 概述

本文档详细介绍Smart Kitchen项目的自动化部署配置，包括CI/CD流水线、部署脚本和监控方案。

## 🏗️ 架构设计

### 部署架构图
```
GitHub Repository
    ↓ (Push/PR)
GitHub Actions (CI/CD)
    ↓ (Build & Test)
Docker Registry (GHCR)
    ↓ (Deploy)
Production Server
    ↓ (Monitor)
Health Monitoring & Alerts
```

### 技术栈
- **CI/CD**: GitHub Actions
- **容器化**: Docker + Docker Compose
- **镜像仓库**: GitHub Container Registry
- **部署方式**: SSH远程执行
- **监控**: 自定义健康检查脚本

## 🚀 CI/CD流水线配置

### 1. GitHub Actions工作流 (.github/workflows/deploy.yml)

#### 触发条件
- `main` 分支推送: 部署到生产环境
- `develop` 分支推送: 部署到开发环境
- Pull Request: 运行代码检查和测试

#### 工作流阶段

##### 阶段1: 代码质量检查
```yaml
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - 代码检出
      - Node.js环境设置
      - 依赖安装
      - 代码风格检查
      - 运行测试
```

##### 阶段2: Docker镜像构建
```yaml
jobs:
  build-and-push:
    steps:
      - 构建后端Docker镜像
      - 构建前端Docker镜像
      - 推送到GitHub Container Registry
      - 添加元数据标签
```

##### 阶段3: 生产环境部署
```yaml
jobs:
  deploy-production:
    steps:
      - SSH连接到生产服务器
      - 拉取最新代码
      - 停止旧服务
      - 拉取新镜像
      - 启动新服务
      - 运行数据库迁移
      - 验证部署状态
```

## 🛠️ 部署脚本详解

### 1. 自动化部署脚本 (scripts/automated-deploy.sh)

#### 主要功能
- 前提条件检查
- 版本备份
- 代码更新
- 服务构建和部署
- 部署验证
- 通知发送

#### 使用方法
```bash
# 在服务器上执行
chmod +x scripts/automated-deploy.sh
./scripts/automated-deploy.sh
```

#### 配置参数
```bash
PROJECT_DIR="/root/smart-kitchen"    # 项目目录
BACKUP_DIR="/root/backups"           # 备份目录
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")  # 时间戳格式
```

### 2. 回滚脚本 (scripts/rollback-deploy.sh)

#### 回滚类型
- `full`: 完全回滚（默认）
- `db`: 仅回滚数据库
- `code`: 仅回滚代码版本
- `env`: 仅回滚环境配置

#### 使用方法
```bash
# 完全回滚
./scripts/rollback-deploy.sh full

# 仅回滚数据库
./scripts/rollback-deploy.sh db

# 仅回滚代码
./scripts/rollback-deploy.sh code
```

### 3. 健康监控脚本 (scripts/health-monitor.sh)

#### 监控项
- 后端API可用性
- 前端服务状态
- 数据库连接状态
- Docker容器健康状态
- 系统资源使用率

#### 运行模式
```bash
# 后台守护进程模式（默认）
./scripts/health-monitor.sh daemon

# 单次检查
./scripts/health-monitor.sh once

# 查看当前状态
./scripts/health-monitor.sh status
```

## 🔧 服务器配置要求

### 1. 环境变量配置

在服务器上创建 `.env` 文件：
```bash
# 数据库配置
DATABASE_URL=postgresql://smart_kitchen:password@localhost:5432/smart_kitchen_prod

# 应用配置
NODE_ENV=production
PORT=3001

# JWT密钥
JWT_SECRET=your-jwt-secret-key

# 其他配置...
```

### 2. SSH密钥配置

GitHub Actions需要SSH访问权限：
```bash
# 生成SSH密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions@smart-kitchen"

# 将公钥添加到服务器 ~/.ssh/authorized_keys
# 将私钥添加到GitHub Secrets
```

### 3. GitHub Secrets配置

在仓库Settings → Secrets中添加：
```
SERVER_HOST: 8.145.34.30
SERVER_USER: root
SERVER_SSH_KEY: [私钥内容]
```

## 📊 监控和告警

### 1. 健康检查端点

#### 后端健康检查
```bash
curl http://localhost:3001/api/health
```

响应示例：
```json
{
  "status": "healthy",
  "timestamp": "2026-02-27T10:30:00Z",
  "version": "1.0.0"
}
```

#### 前端健康检查
```bash
curl http://localhost
```

### 2. 告警配置

在 `health-monitor.sh` 中配置通知方式：

#### Slack通知
```bash
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

#### 邮件通知
```bash
EMAIL_RECIPIENTS="admin@company.com"
```

### 3. 日志管理

日志文件位置：
```bash
/var/log/smart-kitchen-health.log  # 健康检查日志
/root/backups/                     # 备份文件目录
```

## 🔒 安全考虑

### 1. 访问控制
- 使用SSH密钥认证而非密码
- 限制GitHub Actions的权限范围
- 定期轮换敏感配置

### 2. 数据保护
- 自动备份数据库
- 加密敏感环境变量
- 保留历史备份版本

### 3. 网络安全
- 配置防火墙规则
- 使用HTTPS加密传输
- 定期安全扫描

## 📈 性能优化

### 1. Docker优化
```dockerfile
# 使用多阶段构建
FROM node:20-alpine AS builder
# ... 构建步骤

FROM node:20-alpine AS runtime
# ... 运行时优化
```

### 2. 缓存策略
- Docker层缓存
- NPM依赖缓存
- GitHub Actions缓存

### 3. 资源限制
```yaml
# docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

## 🆘 故障排除

### 常见问题

#### 1. 部署失败
```bash
# 检查部署日志
tail -f /var/log/smart-kitchen-health.log

# 手动执行部署
./scripts/automated-deploy.sh

# 查看容器日志
docker-compose logs backend
docker-compose logs frontend
```

#### 2. 数据库连接问题
```bash
# 检查数据库状态
docker-compose exec postgres pg_isready -U smart_kitchen

# 查看数据库日志
docker-compose logs postgres
```

#### 3. 回滚操作
```bash
# 执行完全回滚
./scripts/rollback-deploy.sh full

# 查看可用备份
ls -la /root/backups/
```

## 📅 维护计划

### 定期任务
- **每日**: 健康检查和监控
- **每周**: 日志清理和备份验证
- **每月**: 安全更新和性能评估
- **每季度**: 架构评审和优化

### 版本管理
- 遵循语义化版本控制
- 维护详细的变更日志
- 建立版本回滚预案

## 📞 支持联系

如有部署相关问题，请联系：
- 技术负责人: [姓名]
- 邮箱: [邮箱地址]
- Slack频道: #smart-kitchen-deploy

---
**文档版本**: 1.0  
**最后更新**: 2026-02-27  
**适用版本**: Smart Kitchen v1.0+