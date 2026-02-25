# Smart Kitchen 部署修复指南

## 当前问题
访问 http://8.145.34.30 显示 "Welcome to HTTP Server Test Page!" 而不是应用页面。

## 问题分析
这是典型的Nginx默认页面显示问题，说明：
1. Nginx正在运行
2. 但没有正确配置到您的应用
3. 可能存在配置冲突或容器未正确启动

## 快速修复步骤

### 方法一：使用自动化脚本（推荐）

```bash
# 连接到服务器
ssh root@8.145.34.30

# 进入项目目录
cd /home/smart-kitchen

# 给脚本执行权限
chmod +x scripts/fix-deployment.sh

# 执行修复脚本
./scripts/fix-deployment.sh
```

### 方法二：手动修复

1. **停止现有服务**
```bash
cd /home/smart-kitchen
docker-compose -f docker-compose.prod.yml down
```

2. **清理残留容器**
```bash
docker rm -f smart-kitchen-nginx-prod smart-kitchen-backend-prod smart-kitchen-postgres-prod
```

3. **重建并启动**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

4. **检查状态**
```bash
docker ps
```

5. **测试服务**
```bash
# 测试后端
curl http://localhost:3001/api/health

# 测试Nginx代理
curl http://localhost/
```

## 验证修复结果

执行以下命令验证修复是否成功：

```bash
# 检查容器状态
docker ps --format "table {{.Names}}\t{{.Status}}"

# 测试外部访问
curl -I http://8.145.34.30/

# 应该返回200或404状态码，而不是默认欢迎页面
```

## 常见问题排查

### 1. 如果仍然显示默认页面

```bash
# 检查是否有系统级Nginx配置冲突
sudo netstat -tlnp | grep :80

# 如果发现冲突，停止系统Nginx
sudo systemctl stop nginx
sudo systemctl disable nginx
```

### 2. 如果容器无法启动

```bash
# 查看详细错误信息
docker-compose -f docker-compose.prod.yml logs

# 检查端口占用
netstat -tlnp | grep -E ":(80|3001|5432)"

# 强制释放端口
sudo fuser -k 80/tcp
sudo fuser -k 3001/tcp
```

### 3. 如果数据库连接失败

```bash
# 重新初始化数据库
./deploy-database.sh

# 或手动执行
docker exec smart-kitchen-postgres-prod psql -U postgres -d smart_kitchen -f /docker-entrypoint-initdb.d/init.sql
```

## 监控和维护

### 实时监控脚本
```bash
./scripts/check-and-fix-deployment.sh
```

### 查看服务日志
```bash
# 查看所有服务日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看特定服务
docker logs smart-kitchen-backend-prod -f
docker logs smart-kitchen-nginx-prod -f
```

## 预防措施

1. **定期备份配置**
```bash
cp -r nginx/conf.d nginx/conf.d.backup.$(date +%Y%m%d)
```

2. **设置健康检查**
在 `docker-compose.prod.yml` 中已包含健康检查配置

3. **监控脚本**
可以设置定时任务定期检查服务状态

## 紧急回滚方案

如果修复失败，可以快速回滚：

```bash
# 停止所有服务
docker-compose -f docker-compose.prod.yml down

# 启动基础服务验证
docker run -d --name test-nginx -p 80:80 nginx:alpine
curl http://8.145.34.30/  # 应该显示nginx默认页面

# 确认基础环境正常后再重新部署
docker rm -f test-nginx
```

通过以上步骤，应该能够解决您遇到的部署问题。如果仍有问题，请提供具体的错误信息以便进一步诊断。
