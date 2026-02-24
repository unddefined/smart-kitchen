#!/bin/bash

# 智能厨房完整服务器部署脚本
# 请在服务器上直接执行此脚本

echo "🚀 开始智能厨房后端完整部署..."

# 1. 确认当前目录和用户
echo "👤 当前用户: $(whoami)"
echo "📁 当前目录: $(pwd)"

# 2. 查找项目目录（常见路径）
PROJECT_PATH=""
if [ -d "/root/smart-kitchen" ]; then
    PROJECT_PATH="/root/smart-kitchen"
elif [ -d "/home/root/smart-kitchen" ]; then
    PROJECT_PATH="/home/root/smart-kitchen"
elif [ -d "/opt/smart-kitchen" ]; then
    PROJECT_PATH="/opt/smart-kitchen"
else
    echo "❌ 未找到项目目录，请手动指定路径"
    read -p "请输入项目完整路径: " PROJECT_PATH
fi

echo "📂 项目路径: $PROJECT_PATH"

# 3. 进入项目目录
if [ ! -d "$PROJECT_PATH" ]; then
    echo "❌ 项目目录不存在: $PROJECT_PATH"
    exit 1
fi

cd "$PROJECT_PATH"
echo "📁 已进入项目目录: $(pwd)"

# 4. 拉取最新代码
echo "🔄 拉取最新代码..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git拉取失败"
    exit 1
fi

# 5. 进入后端目录
cd backend
echo "📁 进入后端目录: $(pwd)"

# 6. 安装依赖
echo "📦 安装依赖..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

# 7. 检查并安装@prisma/adapter-pg
echo "🔧 检查Prisma适配器..."
if ! npm list @prisma/adapter-pg >/dev/null 2>&1; then
    echo "📥 安装@prisma/adapter-pg..."
    npm install @prisma/adapter-pg --save
fi

# 8. 重新生成Prisma客户端
echo "🔨 重新生成Prisma客户端..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma客户端生成失败"
    exit 1
fi

# 9. 停止当前服务
echo "⏹️ 停止当前服务..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 stop smart-kitchen-backend 2>/dev/null || echo "服务未运行"
else
    echo "⚠️ PM2未安装，查找Node.js进程..."
    pkill -f "node.*smart-kitchen" 2>/dev/null || echo "未找到相关进程"
fi

# 10. 启动新服务
echo "▶️ 启动新服务..."
if command -v pm2 >/dev/null 2>&1; then
    pm2 start npm --name "smart-kitchen-backend" -- run start
    pm2 save
    echo "✅ 服务已通过PM2启动"
else
    echo "⚠️ PM2不可用，使用nohup启动..."
    nohup npm run start > backend.log 2>&1 &
    echo $! > backend.pid
    echo "✅ 服务已启动，PID: $(cat backend.pid)"
fi

# 11. 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 12. 验证服务状态
echo "✅ 验证服务状态..."

# 测试健康检查
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "🟢 健康检查通过！"
else
    echo "🔴 健康检查失败！"
    curl -s http://localhost:3000/health
fi

# 测试菜品API
if curl -s http://localhost:3000/dishes | jq '.' >/dev/null 2>&1; then
    echo "🟢 菜品API正常响应！"
else
    echo "🟡 菜品API可能返回错误（正常情况）"
fi

# 13. 显示最终状态
echo ""
echo "🎉 部署完成！"
echo "📋 服务信息:"
echo "   - 端口: 3000" 
echo "   - 健康检查: http://8.145.34.30:3000/health"
echo "   - 菜品API: http://8.145.34.30:3000/dishes"
echo "   - CORS源: http://localhost:5173"

if command -v pm2 >/dev/null 2>&1; then
    echo "📊 PM2状态:"
    pm2 status
fi

echo ""
echo "💡 前端验证步骤:"
echo "   1. 在本地启动前端: cd frontend && npm run dev"
echo "   2. 访问: http://localhost:5173"
echo "   3. 应该不再出现CORS错误"
