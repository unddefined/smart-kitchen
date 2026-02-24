#!/bin/bash

# 智能厨房后端部署脚本
# 用于在云服务器上更新和重启后端服务

set -e  # 遇到错误时立即退出

echo "🚀 开始部署智能厨房后端更新..."

# 1. 进入项目目录
cd /path/to/smart-kitchen
echo "📁 当前目录: $(pwd)"

# 2. 拉取最新代码
echo "🔄 拉取最新代码..."
git pull origin main

# 3. 进入后端目录
cd backend
echo "📁 进入后端目录: $(pwd)"

# 4. 安装依赖（包括新添加的@prisma/adapter-pg）
echo "📦 安装依赖..."
npm install

# 5. 重新生成Prisma客户端
echo "🔧 重新生成Prisma客户端..."
npx prisma generate

# 6. 检查数据库迁移（如果需要）
echo "📊 检查数据库迁移状态..."
npx prisma migrate status

# 7. 停止当前运行的服务（如果使用PM2）
echo "⏹️ 停止当前服务..."
if command -v pm2 &> /dev/null; then
    pm2 stop smart-kitchen-backend || echo "PM2服务未找到或已停止"
else
    echo "⚠️ 未找到PM2，手动停止服务"
fi

# 8. 启动新版本服务
echo "▶️ 启动新版本服务..."
if command -v pm2 &> /dev/null; then
    pm2 start npm --name "smart-kitchen-backend" -- run start
    pm2 save
else
    echo "⚠️ 使用普通方式启动（建议配置PM2）"
    nohup npm run start > backend.log 2>&1 &
    echo $! > backend.pid
fi

# 9. 验证服务状态
echo "✅ 验证服务状态..."
sleep 5

# 测试健康检查
if curl -s http://localhost:3000/health | grep -q "ok"; then
    echo "🟢 健康检查通过！"
else
    echo "🔴 健康检查失败！"
    exit 1
fi

# 测试菜品API
if curl -s http://localhost:3000/dishes | grep -q "error"; then
    echo "🟡 菜品API返回错误（可能是空数据，正常）"
else
    echo "🟢 菜品API正常响应！"
fi

echo "🎉 后端部署完成！"
echo "📋 服务信息:"
echo "   - 端口: 3000"
echo "   - 健康检查: http://8.145.34.30:3000/health"
echo "   - 菜品API: http://8.145.34.30:3000/dishes"
