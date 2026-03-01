#!/bin/bash

echo "🔧 修复前端部署问题"

# 切换到项目目录
cd /root/smart-kitchen

# 备份当前配置
cp docker-compose.prod.yml docker-compose.prod.yml.backup.$(date +%Y%m%d_%H%M%S)

# 重新拉取最新代码
git fetch origin main
git reset --hard origin/main

# 登录到 GHCR (使用环境变量中的token)
echo "🔐 登录到 GitHub Container Registry..."
if [ -n "$GITHUB_TOKEN" ]; then
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u undundefined --password-stdin
    if [ $? -eq 0 ]; then
        echo "✅ GHCR 登录成功"
    else
        echo "❌ GHCR 登录失败"
        exit 1
    fi
else
    echo "⚠️ 未找到 GITHUB_TOKEN 环境变量，跳过 GHCR 登录"
fi

# 检查可用的镜像标签
echo "🔍 检查可用的前端镜像..."
if [ -n "$GITHUB_TOKEN" ]; then
    curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
        https://ghcr.io/v2/undundefined/smart-kitchen-frontend/tags/list | jq '.' || echo "无法获取镜像列表"
fi

# 停止当前服务
echo "⏹️ 停止当前服务..."
docker compose down

# 如果有token则拉取最新镜像，否则使用本地构建
if [ -n "$GITHUB_TOKEN" ]; then
    echo "📥 拉取最新镜像..."
    docker pull ghcr.io/undundefined/smart-kitchen-frontend:latest
    docker pull ghcr.io/undundefined/smart-kitchen-backend:latest
    
    # 查看拉取的镜像
    echo "📋 拉取的镜像状态:"
    docker images | grep smart-kitchen
else
    echo "🔨 使用本地构建..."
    docker compose build frontend backend
fi

# 启动服务
echo "🚀 启动服务..."
docker compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "📋 服务状态检查:"
docker compose ps

# 健康检查
echo "🏥 健康检查..."
if curl -f http://localhost:3001/api/health; then 
    echo " ✅ 后端健康"
else
    echo " ❌ 后端健康检查失败"
    docker compose logs backend
fi

if curl -f http://localhost; then 
    echo " ✅ 前端健康"
else
    echo " ❌ 前端健康检查失败"
    docker compose logs frontend
fi

echo "✅ 前端部署修复完成！"