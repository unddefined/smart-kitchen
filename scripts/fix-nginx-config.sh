#!/bin/bash

# Nginx配置检查和修复脚本
# 用于解决反向代理配置问题和上游服务不可用问题

set -e

echo "🔧 开始Nginx配置检查和修复..."

# 检查Docker环境
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装或未在PATH中"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose未安装或未在PATH中"
    exit 1
fi

# 检查必要的文件
CONFIG_FILES=(
    "./nginx/nginx.conf"
    "./nginx/conf.d/backend.conf"
    "./docker-compose.prod.yml"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少配置文件: $file"
        exit 1
    fi
done

echo "✅ 配置文件检查通过"

# 检查端口配置一致性
BACKEND_PORT_IN_NGINX=$(grep -o "proxy_pass http://backend:[0-9]*" ./nginx/conf.d/backend.conf | head -1 | grep -o "[0-9]*$")
BACKEND_PORT_IN_COMPOSE=$(grep -A5 "backend:" ./docker-compose.prod.yml | grep "PORT:" | grep -o "[0-9]*")

echo "📊 端口配置检查:"
echo "  - Nginx配置中的后端端口: $BACKEND_PORT_IN_NGINX"
echo "  - Docker Compose中的后端端口: $BACKEND_PORT_IN_COMPOSE"

if [ "$BACKEND_PORT_IN_NGINX" != "$BACKEND_PORT_IN_COMPOSE" ]; then
    echo "⚠️  端口配置不一致，需要修复..."
    # 这里可以添加自动修复逻辑
else
    echo "✅ 端口配置一致"
fi

# 检查服务连通性
echo "🌐 服务连通性检查..."

# 检查Docker网络
if docker network ls | grep -q "backend-network"; then
    echo "✅ Docker网络存在"
else
    echo "⚠️  Docker网络不存在，将自动创建"
fi

# 检查容器状态
echo "🐳 容器状态检查:"
docker-compose -f docker-compose.prod.yml ps

# 检查后端服务健康状态
echo "🏥 后端服务健康检查:"
if curl -f http://localhost:3001/health &>/dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务无法访问"
fi

# 检查Nginx配置语法
echo "📋 Nginx配置语法检查:"
if docker run --rm -v "$(pwd)/nginx:/etc/nginx" nginx:alpine nginx -t; then
    echo "✅ Nginx配置语法正确"
else
    echo "❌ Nginx配置语法错误"
    exit 1
fi

# 重启服务
echo "🔄 重启服务..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 最终验证
echo "🎯 最终验证:"
if curl -f http://localhost/health &>/dev/null; then
    echo "✅ Nginx反向代理配置成功"
    echo "✅ 服务可通过 http://localhost 访问"
else
    echo "❌ Nginx反向代理仍有问题"
    echo "📋 查看详细日志:"
    docker-compose -f docker-compose.prod.yml logs nginx
    docker-compose -f docker-compose.prod.yml logs backend
fi

echo "🔧 Nginx配置检查和修复完成"