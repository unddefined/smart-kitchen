# GitHub Secrets 配置指南

## 📋 概述

为了使GitHub Actions能够自动部署到您的服务器，需要配置相应的Secrets。

## 🔐 必需的Secrets

### 1. 服务器访问凭证

#### SERVER_HOST
```
值: 8.145.34.30
说明: 生产服务器IP地址
```

#### SERVER_USER
```
值: root
说明: 服务器用户名
```

#### SERVER_SSH_KEY
```
值: [您的私钥内容]
说明: 用于SSH连接的私钥
```

### 2. 可选的Secrets

#### STAGING_SERVER_HOST
```
值: [开发服务器IP]
说明: 开发环境服务器IP地址
```

#### STAGING_SERVER_USER
```
值: [开发服务器用户名]
说明: 开发服务器用户名
```

#### STAGING_SERVER_SSH_KEY
```
值: [开发环境私钥内容]
说明: 开发环境SSH私钥
```

## 🛠️ 配置步骤

### 1. 生成SSH密钥对

如果还没有SSH密钥对，在本地执行：

```bash
# 生成新的SSH密钥对
ssh-keygen -t rsa -b 4096 -C "github-actions@smart-kitchen" -f ~/.ssh/github_actions

# 查看公钥内容（用于添加到服务器）
cat ~/.ssh/github_actions.pub

# 查看私钥内容（用于GitHub Secrets）
cat ~/.ssh/github_actions
```

### 2. 配置服务器授权

将公钥添加到服务器的授权文件：

```bash
# 在服务器上执行
mkdir -p ~/.ssh
echo "ssh-rsa AAAAB3NzaC1yc2E... github-actions@smart-kitchen" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### 3. 在GitHub中配置Secrets

1. 进入您的GitHub仓库
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 依次添加以下Secrets：

#### 添加SERVER_HOST
- Name: `SERVER_HOST`
- Value: `8.145.34.30`

#### 添加SERVER_USER
- Name: `SERVER_USER`
- Value: `root`

#### 添加SERVER_SSH_KEY
- Name: `SERVER_SSH_KEY`
- Value: `[粘贴您的私钥内容]`

### 4. 验证配置

测试SSH连接是否正常：

```bash
# 在本地测试
ssh -i ~/.ssh/github_actions root@8.145.34.30

# 应该能够无密码登录
```

## 🧪 测试部署流程

### 1. 手动触发部署

推送一个测试提交到main分支：

```bash
# 修改任意文件
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: 部署测试"
git push origin main
```

### 2. 监控部署过程

在GitHub仓库中查看：
- `Actions` → 选择对应的workflow运行
- 查看每个步骤的执行日志
- 确认部署是否成功

### 3. 验证部署结果

```bash
# SSH连接到服务器验证
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30

# 检查服务状态
cd /root/smart-kitchen
docker-compose ps

# 检查应用是否正常运行
curl http://localhost:3001/api/health
curl http://localhost
```

## 🔧 故障排除

### 常见问题

#### 1. SSH连接失败
```
错误信息: Permission denied (publickey)
解决方案:
- 确认公钥已正确添加到服务器 ~/.ssh/authorized_keys
- 检查私钥格式是否正确（包含BEGIN/END行）
- 验证服务器SSH配置允许密钥认证
```

#### 2. 权限不足
```
错误信息: Permission denied
解决方案:
- 确认使用的是root用户或具有足够权限的用户
- 检查项目目录权限设置
- 验证Docker命令执行权限
```

#### 3. 端口占用
```
错误信息: port is already allocated
解决方案:
- 停止占用端口的服务
- 修改docker-compose.yml中的端口映射
- 使用不同的端口配置
```

### 调试命令

```bash
# 在服务器上查看详细错误日志
docker-compose logs --tail 100

# 检查容器状态详细信息
docker inspect smart-kitchen-backend-prod

# 查看系统资源使用
htop
df -h
```

## 📝 安全建议

### 1. 密钥管理
- 定期轮换SSH密钥
- 限制密钥使用权限
- 监控密钥使用情况

### 2. 访问控制
- 使用最低权限原则
- 启用服务器防火墙
- 配置SSH访问限制

### 3. 备份策略
- 定期备份重要数据
- 测试恢复流程
- 保留多个备份版本

## 🆘 技术支持

如遇到配置问题，请提供以下信息：
- 错误日志截图
- 相关配置文件内容
- 系统环境信息
- 已尝试的解决步骤

---
**配置完成时间**: 预计15-30分钟  
**下次审查时间**: 部署成功后