#!/bin/bash

# Smart Kitchen 前端部署脚本
# 作者: Lingma
# 日期: 2026-02-26

set -e  # 遇到错误立即退出

echo "🚀 开始部署Smart Kitchen前端应用..."

# 配置变量
PROJECT_DIR="/root/smart-kitchen"
FRONTEND_DIR="$PROJECT_DIR/frontend"
STATIC_DIR="/var/www/smart-kitchen"
NGINX_CONTAINER="smart-kitchen-frontend"

# 1. 构建前端应用
echo "1. 构建前端应用..."
cd $FRONTEND_DIR

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "安装前端依赖..."
    npm install
fi

# 执行构建
echo "执行构建..."
npm run build

# 检查构建结果
if [ ! -d "dist" ]; then
    echo "❌ 构建失败：未找到dist目录"
    exit 1
fi

echo "✅ 前端构建完成"

# 2. 准备静态文件目录
echo "2. 准备静态文件目录..."
sudo mkdir -p $STATIC_DIR
sudo rm -rf $STATIC_DIR/*
sudo cp -r dist/* $STATIC_DIR/

# 设置正确的权限（nginx用户ID为101）
sudo chown -R 101:101 $STATIC_DIR
sudo chmod -R 755 $STATIC_DIR

echo "✅ 静态文件准备完成"

# 3. 停止现有nginx容器
echo "3. 停止现有nginx容器..."
docker stop $NGINX_CONTAINER 2>/dev/null || true
docker rm $NGINX_CONTAINER 2>/dev/null || true

# 4. 创建nginx配置
echo "4. 创建nginx配置..."
cat > /tmp/nginx-frontend.conf << 'EOF'
server {
    listen 80;
    server_name 8.145.34.30 localhost;
    
    # 静态文件配置
    root /usr/share/nginx/html;
    index index.html;
    
    # API代理配置
    location /api/ {
        proxy_pass http://smart-kitchen-backend-prod:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://smart-kitchen-backend-prod:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

echo "✅ nginx配置创建完成"

# 5. 启动nginx容器
echo "5. 启动nginx容器..."
docker run -d \
    --name $NGINX_CONTAINER \
    --network smart-kitchen_backend-network \
    -p 80:80 \
    -v $STATIC_DIR:/usr/share/nginx/html:ro \
    -v /tmp/nginx-frontend.conf:/etc/nginx/conf.d/default.conf \
    nginx:alpine

# 等待容器启动
sleep 5

# 6. 验证部署
echo "6. 验证部署..."
if docker ps | grep -q $NGINX_CONTAINER; then
    echo "✅ nginx容器运行正常"
else
    echo "❌ nginx容器启动失败"
    docker logs $NGINX_CONTAINER
    exit 1
fi

# 测试访问
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ 前端页面访问正常"
else
    echo "❌ 前端页面访问异常 (状态码: $HTTP_CODE)"
    docker logs $NGINX_CONTAINER --tail 20
    exit 1
fi

# 测试API代理
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health 2>/dev/null || echo "000")
if [ "$API_CODE" = "200" ]; then
    echo "✅ API代理正常"
else
    echo "⚠️  API代理异常 (状态码: $API_CODE)"
fi

echo ""
echo "🎉 Smart Kitchen前端部署完成！"
echo "应用查看地址: http://8.145.34.30"
echo "API接口地址: http://8.145.34.30/api/health"
echo "部署时间: $(date)"
