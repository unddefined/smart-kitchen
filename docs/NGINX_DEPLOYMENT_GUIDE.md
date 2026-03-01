# Nginx配置部署指南

## 问题背景

在执行GitHub Actions后，nginx配置没有被复制到服务器上的根本原因是：

1. **配置文件路径不一致**：docker-compose.yml引用了`nginx.conf`，但Dockerfile复制的是`nginx/default.conf`
2. **部署流程缺陷**：GitHub Actions只拉取现有镜像而不重新构建
3. **服务架构混乱**：同时存在独立nginx服务和前端内置nginx

## 解决方案

### 1. 统一配置文件结构

**使用前端Dockerfile内置的nginx配置**：
```
frontend/
├── Dockerfile          # 内置nginx配置
├── nginx/
│   └── default.conf    # nginx站点配置
└── nginx.conf         # 主nginx配置（可选）
```

### 2. 简化docker-compose配置

移除独立的nginx服务，让前端容器直接暴露80端口：

```yaml
services:
  frontend:
    image: ghcr.io/username/smart-kitchen-frontend:latest
    ports:
      - "80:80"  # 直接暴露前端容器的80端口
    depends_on:
      - backend
```

### 3. 确保配置正确打包

前端Dockerfile应该包含：
```dockerfile
# 生产阶段
FROM nginx:alpine

# 复制 nginx 配置
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html
```

## 验证步骤

### 本地验证
```bash
# 1. 验证配置文件存在
ls -la frontend/nginx/default.conf

# 2. 构建测试镜像
cd frontend
docker build -t nginx-test .

# 3. 启动测试容器
docker run -d --name test -p 8080:80 nginx-test

# 4. 验证配置
docker exec test nginx -t
curl http://localhost:8080

# 5. 清理
docker stop test && docker rm test
```

### 部署后验证
```bash
# 1. 检查服务状态
docker compose ps

# 2. 验证nginx配置
docker exec smart-kitchen-frontend-prod nginx -t

# 3. 查看配置内容
docker exec smart-kitchen-frontend-prod cat /etc/nginx/conf.d/default.conf

# 4. 检查服务连通性
curl http://localhost
curl http://localhost:3001/api/health
```

## 常见问题排查

### 1. 配置文件未生效
```bash
# 检查容器内的配置文件
docker exec container_name ls -la /etc/nginx/conf.d/
docker exec container_name cat /etc/nginx/conf.d/default.conf

# 检查nginx是否重新加载配置
docker exec container_name nginx -s reload
```

### 2. API代理不工作
检查配置中是否包含正确的代理设置：
```nginx
location /api/ {
    proxy_pass http://backend:3001;
    # ... 其他代理配置
}
```

### 3. SPA路由问题
确保包含正确的try_files配置：
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 最佳实践

1. **配置集中管理**：所有nginx配置放在`frontend/nginx/`目录
2. **构建时打包**：确保配置文件在镜像构建阶段就被包含
3. **单一职责**：每个容器只负责一个服务
4. **自动化验证**：在CI/CD流程中加入配置验证步骤

## 相关脚本

- `scripts/verify-nginx-config.js` - 本地配置验证
- `scripts/post-deployment-check.js` - 部署后验证

运行验证脚本：
```bash
node scripts/verify-nginx-config.js
node scripts/post-deployment-check.js
```