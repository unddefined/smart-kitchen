#!/bin/bash

# 后端部署脚本
set -e

echo "🚀 开始部署后端服务..."

# 1. 上传编译后的代码
echo "📦 上传编译后的代码到服务器..."
scp -i "C:/Users/66948/.ssh/PWA应用密钥.pem" -r \
  ./dist/* \
  root@8.145.34.30:/root/smart-kitchen/backend/dist/

echo "✅ 代码上传完成"

# 2. 重启后端服务
echo "🔄 重启后端服务..."
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 << 'EOF'
  cd /root/smart-kitchen/backend
  
  # 停止现有进程
  echo "停止现有 Node.js 进程..."
  pkill -f "node dist/main.js" || true
  
  # 等待端口释放
  sleep 2
  
  # 启动新进程
  echo "启动新的后端服务..."
  cd dist/src
  nohup node main.js > /var/log/backend.log 2>&1 &
  
  # 等待服务启动
  sleep 3
  
  # 检查服务状态
  if pgrep -f "node main.js" > /dev/null; then
    echo "✅ 后端服务已成功启动"
    netstat -tlnp | grep $(pgrep -f "node main.js")
  else
    echo "❌ 后端服务启动失败"
    exit 1
  fi
EOF

echo "🎉 部署完成！"
