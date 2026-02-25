# Nginx反向代理配置问题排查指南

## 🎯 常见问题现象

1. **502 Bad Gateway** - 上游服务不可用
2. **404 Not Found** - 路由配置错误
3. **Connection refused** - 端口或服务未启动
4. **Timeout errors** - 代理超时设置不当

## 🔍 问题诊断步骤

### 1. 检查服务状态

```bash
# 查看所有容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看特定服务日志
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs nginx
docker-compose -f docker-compose.prod.yml logs postgres
```

### 2. 验证端口配置

检查配置文件中的端口是否一致：

```bash
# 检查Nginx配置中的端口
grep "proxy_pass" nginx/conf.d/backend.conf

# 检查Docker Compose中的端口
grep "PORT:" docker-compose.prod.yml
grep "ports:" docker-compose.prod.yml
```

### 3. 网络连通性测试

```bash
# 测试后端服务是否可访问
curl http://localhost:3001/health

# 测试Nginx代理是否工作
curl http://localhost/health

# 检查Docker网络
docker network ls
docker network inspect backend-network
```

## 🛠️ 常见问题解决方案

### 问题1: 端口配置不匹配

**现象**: `502 Bad Gateway` 错误

**原因**: Nginx配置中的端口号与后端服务实际监听端口不一致

**解决方案**:
1. 确认后端服务实际监听端口（查看 `backend/src/main.ts`）
2. 更新Nginx配置文件中的 `proxy_pass` 地址
3. 重启服务

```bash
# 修复示例：如果后端监听3001端口
sed -i 's/proxy_pass http:\/\/backend:3000/proxy_pass http:\/\/backend:3001/g' nginx/conf.d/backend.conf
```

### 问题2: Docker网络问题

**现象**: 容器间无法通信

**解决方案**:
```bash
# 重建Docker网络
docker-compose -f docker-compose.prod.yml down
docker network prune -f
docker-compose -f docker-compose.prod.yml up -d
```

### 问题3: Nginx配置语法错误

**现象**: Nginx无法启动或配置不生效

**验证方法**:
```bash
# 语法检查
docker run --rm -v "$(pwd)/nginx:/etc/nginx" nginx:alpine nginx -t

# 重新加载配置
docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 问题4: SSL证书问题

**现象**: HTTPS访问失败

**解决方案**:
```bash
# 临时禁用SSL重定向（开发环境）
# 注释掉backend.conf中的SSL相关配置

# 生成自签名证书（测试用）
mkdir -p ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/privkey.pem -out ssl/fullchain.pem \
    -subj "/CN=localhost"
```

## 🚀 标准修复流程

### 1. 运行自动检查脚本

```bash
# Linux/macOS
chmod +x scripts/fix-nginx-config.sh
./scripts/fix-nginx-config.sh

# Windows
scripts\fix-nginx-config.bat
```

### 2. 手动验证步骤

```bash
# 1. 检查配置文件
cat nginx/conf.d/backend.conf
cat docker-compose.prod.yml

# 2. 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 3. 测试服务连通性
curl -v http://localhost:3001/health  # 直接访问后端
curl -v http://localhost/health       # 通过Nginx访问

# 4. 查看日志
docker-compose -f docker-compose.prod.yml logs --tail=50 nginx
docker-compose -f docker-compose.prod.yml logs --tail=50 backend
```

### 3. 重启服务

```bash
# 完全重启
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 或者单独重启Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 📋 配置检查清单

- [ ] Nginx配置文件语法正确
- [ ] 后端端口配置一致（main.ts vs docker-compose.yml vs nginx.conf）
- [ ] Docker网络正常创建
- [ ] 所有服务容器正常运行
- [ ] 健康检查端点可访问
- [ ] SSL证书配置正确（如启用HTTPS）
- [ ] 防火墙端口开放（80, 443, 3001等）

## 🔧 高级调试技巧

### 1. 启用详细日志

在 `nginx.conf` 中添加：
```nginx
error_log /var/log/nginx/error.log debug;
```

### 2. 实时监控请求

```bash
# 监控Nginx访问日志
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/access.log

# 监控错误日志
docker-compose -f docker-compose.prod.yml exec nginx tail -f /var/log/nginx/error.log
```

### 3. 网络调试

```bash
# 进入容器内部测试
docker-compose -f docker-compose.prod.yml exec backend sh
docker-compose -f docker-compose.prod.yml exec nginx sh

# 在容器内测试网络连通性
ping backend
telnet backend 3001
```

## 📞 应急处理

如果常规方法无效，可以尝试：

1. **完全清理重建**:
```bash
docker-compose -f docker-compose.prod.yml down -v
docker system prune -af
docker-compose -f docker-compose.prod.yml up -d
```

2. **降级到简单配置**:
暂时使用最基本的Nginx配置，逐步添加功能

3. **直接端口暴露**:
临时绕过Nginx，直接访问后端端口验证服务可用性

## 📚 参考资料

- [Nginx官方文档](http://nginx.org/en/docs/)
- [Docker Compose网络配置](https://docs.docker.com/compose/networking/)
- [反向代理最佳实践](https://www.nginx.com/resources/admin-guide/reverse-proxy/)