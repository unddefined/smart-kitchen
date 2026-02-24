#!/bin/bash

# SSL证书申请和续期脚本

set -e

DOMAIN="your-domain.com"  # 请替换为实际域名
EMAIL="your-email@example.com"  # 请替换为实际邮箱

echo "🔐 申请SSL证书..."

# 停止可能占用80端口的服务
sudo systemctl stop nginx

# 使用Let's Encrypt申请证书
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email $EMAIL --agree-tos --non-interactive

# 启动Nginx
sudo systemctl start nginx

# 设置自动续期
echo "⏰ 设置证书自动续期..."
sudo crontab -l > mycron 2>/dev/null || true
echo "0 12 * * * /usr/bin/certbot renew --quiet" >> mycron
sudo crontab mycron
rm mycron

# 复制证书到项目目录
sudo mkdir -p /opt/smart-kitchen/ssl
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/smart-kitchen/ssl/
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/smart-kitchen/ssl/
sudo chown -R $USER:$USER /opt/smart-kitchen/ssl/

echo "✅ SSL证书配置完成！"