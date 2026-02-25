#!/bin/bash

# 智能厨房系统云服务器部署脚本
# 适用于阿里云ECS服务器 8.145.34.30

set -e

echo "🚀 开始部署到云服务器..."

# 服务器配置
SERVER_IP="8.145.34.30"
SSH_KEY="C:/Users/66948/.ssh/PWA应用密钥.pem"
PROJECT_PATH="/root/smart-kitchen"

# 1. 同步本地代码到服务器
echo "🔄 同步代码到云服务器..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' ./ root@$SERVER_IP:$PROJECT_PATH/

# 2. SSH连接并执行部署
echo "🔗 连接到云服务器执行部署..."

ssh -i "$SSH_KEY" root@$SERVER_IP << 'EOF'
cd /root/smart-kitchen

echo "📥 拉取最新代码..."
git pull origin main

echo "📦 安装后端依赖..."
cd backend
npm install --production

echo "🔧 生成Prisma客户端..."
npx prisma generate

echo "🏗️ 构建后端应用..."
npm run build

echo "🐳 重启Docker服务..."
cd ..
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

echo "⏳ 等待服务启动..."
sleep 30

echo "🩺 执行健康检查..."
curl -f http://localhost:3001/health || echo "⚠️ 健康检查失败"
curl -f http://localhost/health || echo "⚠️ Nginx代理检查失败"

echo "📋 查看服务状态..."
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=20 backend
EOF

echo "✅ 部署完成！"

# 3. 本地验证
echo "🔍 本地验证服务..."
echo "测试HTTP访问 (推荐):"
curl -v http://8.145.34.30:3001/health
echo ""
curl -v http://8.145.34.30/health

echo ""
echo "🚫 避免使用HTTPS访问，因为SSL证书配置不完整"
echo "✅ 建议使用HTTP访问进行测试"