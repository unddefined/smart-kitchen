# 前端部署最佳实践指南

## 问题背景
在开发过程中，经常遇到前端代码更新后页面没有及时反映最新改动的问题。这是因为前端采用了构建-部署的工作流程，代码修改后需要重新构建才能生效。

## 常见问题场景

### 1. 代码更新但页面未刷新
**现象**: 修改了Vue组件或JavaScript文件，但浏览器页面显示的仍是旧版本

**原因**: 
- 前端使用Vite构建工具，源代码需要编译成生产环境的静态文件
- Docker容器运行的是构建后的文件，不是源代码
- 构建文件未及时更新导致显示旧版本

### 2. 容器状态异常
**现象**: `docker compose ps`显示前端容器状态为"unhealthy"

**原因**:
- Nginx配置或静态文件存在问题
- 健康检查失败
- 文件权限或路径配置错误

## 解决方案

### 手动部署流程

1. **拉取最新代码**
```bash
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen && git pull origin main"
```

2. **重新构建前端**
```bash
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen/frontend && npm run build"
```

3. **重启前端容器**
```bash
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen && docker compose restart frontend"
```

4. **验证部署**
```bash
# 检查容器状态
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen && docker compose ps frontend"

# 测试页面访问
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "curl -I http://localhost"
```

### 自动化部署脚本

使用提供的自动化脚本简化部署流程：
```bash
# 在本地执行
./scripts/frontend-deploy-update.sh 8.145.34.30
```

## 部署验证清单

### ✅ 部署前检查
- [ ] 确认代码已推送到GitHub
- [ ] 检查是否有未提交的本地更改
- [ ] 确认服务器SSH连接正常

### ✅ 部署过程中
- [ ] 观察构建过程是否有错误
- [ ] 确认构建完成时间是最新的
- [ ] 检查容器重启是否成功

### ✅ 部署后验证
- [ ] 容器状态显示为"healthy"
- [ ] 页面能够正常访问（HTTP 200）
- [ ] 页面内容反映最新代码更改
- [ ] 功能测试通过

## 故障排除

### 1. 构建失败
```bash
# 查看详细错误信息
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen/frontend && npm run build"
```

常见问题：
- 依赖包缺失：运行 `npm install`
- TypeScript错误：检查代码语法
- 资源文件找不到：确认文件路径正确

### 2. 容器无法启动
```bash
# 查看容器日志
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen && docker compose logs frontend"
```

### 3. 页面访问异常
```bash
# 检查Nginx配置
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen && docker compose exec frontend nginx -t"

# 检查文件权限
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 "cd /root/smart-kitchen && ls -la frontend/dist/"
```

## 预防措施

### 1. 建立部署规范
- 每次前端代码修改后都要重新构建
- 建立代码审查和部署检查清单
- 使用版本标签管理发布版本

### 2. 监控和告警
- 设置容器健康检查监控
- 建立页面可用性监控
- 配置部署失败告警

### 3. 自动化改进
- 考虑集成CI/CD流程
- 实现自动构建和部署
- 建立回滚机制

## 相关文档
- [DEPLOYMENT.md](DEPLOYMENT.md) - 完整部署指南
- [DOCKER_BUILD_FIX.md](DOCKER_BUILD_FIX.md) - Docker构建问题解决
- [Nginx问题排查指南.md](Nginx问题排查指南.md) - Nginx配置问题

---
**最后更新**: 2026年2月28日
**适用版本**: Smart Kitchen v1.0