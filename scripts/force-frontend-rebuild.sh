#!/bin/bash

# 强制重新构建前端Docker镜像
# 用于解决服务导入相关的问题

set -e

echo "🚀 开始强制重新构建前端镜像..."

# 进入前端目录
cd frontend

# 清理node_modules和构建缓存
echo "🧹 清理构建缓存..."
rm -rf node_modules
rm -rf dist
rm -rf .vite

# 重新安装依赖
echo "📦 重新安装依赖..."
npm install

# 构建前端
echo "🏗️ 构建前端应用..."
npm run build

# 返回项目根目录
cd ..

# 构建新的Docker镜像（不使用缓存）
echo "🐳 构建新的Docker镜像..."
docker build --no-cache -t smart-kitchen-frontend ./frontend

# 停止并删除旧容器
echo "🛑 停止旧容器..."
docker stop smart-kitchen-frontend-prod 2>/dev/null || true
docker rm smart-kitchen-frontend-prod 2>/dev/null || true

# 启动新容器
echo "🚀 启动新容器..."
docker run -d \
  --name smart-kitchen-frontend-prod \
  --network app-network \
  -p 80:80 \
  --restart unless-stopped \
  smart-kitchen-frontend

echo "✅ 前端重新构建完成！"
echo "🔍 验证服务状态..."
sleep 5
docker ps | grep smart-kitchen-frontend-prod