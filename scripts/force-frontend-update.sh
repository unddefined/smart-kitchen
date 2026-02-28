#!/bin/bash

# 强制前端更新脚本
# 用于解决GitHub Actions部署延迟或失败的情况

set -e

echo "🚀 开始强制前端更新..."

# 检查参数
if [ $# -eq 0 ]; then
    echo "使用方法: $0 <server_ip>"
    echo "示例: $0 8.145.34.30"
    exit 1
fi

SERVER_IP=$1
PROJECT_PATH="/root/smart-kitchen"

echo "目标服务器: $SERVER_IP"
echo "项目路径: $PROJECT_PATH"

# SSH连接并执行更新
ssh -i "~/.ssh/PWA应用密钥.pem" root@$SERVER_IP << EOF
cd $PROJECT_PATH

echo "📥 拉取最新代码..."
git pull origin main

echo "🏗️ 重建前端镜像..."
docker compose build frontend

echo "🔄 重启前端服务..."
docker compose up -d frontend

echo "⏳ 等待服务启动..."
sleep 10

echo "📋 检查容器状态..."
docker compose ps

echo "🔍 检查前端文件更新时间..."
docker compose exec frontend stat /usr/share/nginx/html/index.html

echo "✅ 前端更新完成！"
EOF

echo "🎉 前端强制更新脚本执行完毕！"
