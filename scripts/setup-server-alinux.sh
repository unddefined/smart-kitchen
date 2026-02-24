#!/bin/bash

# 阿里云Linux服务器环境准备脚本

set -e

echo "🔧 准备阿里云Linux服务器环境..."

# 更新系统包
echo "📦 更新系统包..."
sudo yum update -y

# 安装必要软件
echo "📥 安装必要软件..."
sudo yum install -y \
    curl \
    git \
    nginx \
    python3-certbot-nginx

# 安装Docker
echo "🐳 安装Docker..."
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# 安装Docker Compose
echo "🐳 安装Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将当前用户添加到docker组
sudo usermod -aG docker $USER

# 配置防火墙
echo "🛡️ 配置防火墙..."
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

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