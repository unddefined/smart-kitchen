#!/bin/bash

# 云服务器环境准备脚本

set -e

echo "🔧 准备云服务器环境..."

# 更新系统包
echo "📦 更新系统包..."
sudo apt update && sudo apt upgrade -y

# 安装必要软件
echo "📥 安装必要软件..."
sudo apt install -y \
    curl \
    git \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx

# 启动并启用Docker服务
echo "🐳 配置Docker..."
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户添加到docker组
sudo usermod -aG docker $USER

# 配置防火墙
echo "🛡️ 配置防火墙..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# 创建swap空间（如果内存较小）
if [ $(free | grep Mem | awk '{print $2}') -lt 2000000 ]; then
    echo "💾 创建swap空间..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

# 设置时区
echo "🕐 设置时区..."
sudo timedatectl set-timezone Asia/Shanghai

echo "✅ 服务器环境准备完成！"
echo "请重新登录以使docker组权限生效"