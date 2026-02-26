#!/bin/bash

echo "=== Smart Kitchen 前端部署脚本 ==="
echo

# 设置工作目录
FRONTEND_DIR="/root/smart-kitchen/frontend"
NGINX_STATIC_DIR="/var/www/smart-kitchen"

echo "1. 准备部署环境..."
cd $FRONTEND_DIR

# 检查Node.js和npm
if ! command -v node &> /dev/null; then
    echo "❌ 未找到Node.js，请先安装Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 未找到npm，请先安装npm"
    exit 1
fi

echo "Node.js版本: $(node --version)"
echo "npm版本: $(npm --version)"

echo
echo "2. 安装前端依赖..."
npm ci --prefer-offline --no-audit --no-fund

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi

echo
echo "3. 构建前端应用..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo
echo "4. 准备Nginx静态文件目录..."
sudo mkdir -p $NGINX_STATIC_DIR
sudo chown -R www-data:www-data $NGINX_STATIC_DIR

echo
echo "5. 部署构建产物..."
# 清理旧文件
sudo rm -rf $NGINX_STATIC_DIR/*
# 复制新文件
sudo cp -r dist/* $NGINX_STATIC_DIR/
# 设置权限
sudo chown -R www-data:www-data $NGINX_STATIC_DIR
sudo chmod -R 755 $NGINX_STATIC_DIR

echo
echo "6. 配置Nginx..."
# 创建前端配置文件
sudo tee /etc/nginx/conf.d/smart-kitchen-frontend.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name 8.145.34.30;
    
    # 静态文件根目录
    root /var/www/smart-kitchen;
    index index.html;
    
    # 日志配置
    access_log /var/log/nginx/frontend_access.log;
    error_log /var/log/nginx/frontend_error.log;
    
    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理到后端
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 健康检查
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

echo
echo "7. 测试Nginx配置..."
sudo nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx配置测试失败"
    exit 1
fi

echo
echo "8. 重启Nginx服务..."
sudo systemctl reload nginx

echo
echo "9. 验证部署..."
sleep 5

# 测试静态文件访问
STATIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
if [ "$STATIC_STATUS" = "200" ]; then
    echo "✅ 静态文件服务正常"
else
    echo "❌ 静态文件服务异常 (状态码: $STATIC_STATUS)"
fi

# 测试API代理
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)
if [ "$API_STATUS" = "200" ]; then
    echo "✅ API代理正常"
else
    echo "❌ API代理异常 (状态码: $API_STATUS)"
fi

echo
echo "=== 部署完成 ==="
echo "前端应用已部署到: http://8.145.34.30"
echo "构建时间: $(date)"
