#!/bin/bash

# 前端自动部署更新脚本
# 用于在代码更新后自动重新构建和部署前端

set -e  # 遇到错误时退出

echo "🚀 开始前端自动部署更新..."

# 检查参数
if [ $# -eq 0 ]; then
    echo "使用方法: $0 <服务器IP>"
    echo "例如: $0 8.145.34.30"
    exit 1
fi

SERVER_IP=$1
SSH_KEY="C:/Users/66948/.ssh/PWA应用密钥.pem"
PROJECT_PATH="/root/smart-kitchen"

echo "📡 连接到服务器: $SERVER_IP"

# 1. 拉取最新代码
echo "📥 拉取最新代码..."
ssh -i "$SSH_KEY" root@$SERVER_IP "cd $PROJECT_PATH && git pull origin main"

# 2. 重新构建前端
echo "🏗️  重新构建前端..."
ssh -i "$SSH_KEY" root@$SERVER_IP "cd $PROJECT_PATH/frontend && npm run build"

# 3. 重启前端容器
echo "🔄 重启前端容器..."
ssh -i "$SSH_KEY" root@$SERVER_IP "cd $PROJECT_PATH && docker compose restart frontend"

# 4. 等待容器启动
echo "⏳ 等待容器启动..."
sleep 15

# 5. 验证部署状态
echo "✅ 验证部署状态..."
CONTAINER_STATUS=$(ssh -i "$SSH_KEY" root@$SERVER_IP "cd $PROJECT_PATH && docker compose ps frontend --format json | jq -r '.[].Status'")
echo "容器状态: $CONTAINER_STATUS"

# 6. 测试页面访问
echo "🌐 测试页面访问..."
HTTP_STATUS=$(ssh -i "$SSH_KEY" root@$SERVER_IP "curl -s -o /dev/null -w '%{http_code}' http://localhost")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 页面访问正常 (HTTP $HTTP_STATUS)"
else
    echo "❌ 页面访问异常 (HTTP $HTTP_STATUS)"
    exit 1
fi

# 7. 显示构建文件信息
echo "📄 构建文件信息:"
ssh -i "$SSH_KEY" root@$SERVER_IP "cd $PROJECT_PATH && stat frontend/dist/index.html"

echo "🎉 前端部署更新完成！"