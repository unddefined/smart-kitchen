#!/bin/bash

# 智能厨房完整部署脚本（前后端一体化）
# 支持生产环境部署，无需CORS配置

set -e

echo "🚀 开始智能厨房完整部署..."

# 配置变量
PROJECT_NAME="smart-kitchen"
SERVER_IP="8.145.34.30"
DEPLOY_PATH="/var/www/$PROJECT_NAME"
BACKEND_PORT="3000"

# 1. 系统环境检查
check_environment() {
    echo "🔍 检查系统环境..."
    
    # 检查必要软件
    for cmd in git node npm nginx pm2; do
        if ! command -v $cmd &> /dev/null; then
            echo "❌ 缺少必要软件: $cmd"
            case $cmd in
                "nginx") echo "💡 安装命令: yum install nginx 或 apt install nginx" ;;
                "pm2") echo "💡 安装命令: npm install -g pm2" ;;
                *) echo "💡 请先安装 $cmd" ;;
            esac
            exit 1
        fi
    done
    
    echo "✅ 环境检查通过"
}

# 2. 项目部署
deploy_project() {
    echo "📦 部署项目文件..."
    
    # 创建部署目录
    sudo mkdir -p $DEPLOY_PATH
    sudo chown $USER:$USER $DEPLOY_PATH
    
    # 克隆或更新代码
    if [ -d "$DEPLOY_PATH/.git" ]; then
        cd $DEPLOY_PATH
        git pull origin main
    else
        git clone https://github.com/your-repo/smart-kitchen.git $DEPLOY_PATH
        cd $DEPLOY_PATH
    fi
    
    echo "✅ 代码部署完成"
}

# 3. 后端部署
deploy_backend() {
    echo "⚙️ 部署后端服务..."
    
    cd $DEPLOY_PATH/backend
    
    # 安装依赖
    npm install --production
    
    # 生成Prisma客户端
    npx prisma generate
    
    # 构建应用
    npm run build
    
    # 停止旧服务
    pm2 stop $PROJECT_NAME-backend 2>/dev/null || echo "服务未运行"
    
    # 启动新服务
    pm2 start dist/main.js --name "$PROJECT_NAME-backend" --env production
    pm2 save
    
    echo "✅ 后端部署完成"
}

# 4. 前端部署
deploy_frontend() {
    echo "🎨 部署前端应用..."
    
    cd $DEPLOY_PATH/frontend
    
    # 安装依赖
    npm install --production
    
    # 构建生产版本
    npm run build
    
    # 复制构建文件到Web目录
    sudo mkdir -p /var/www/html/$PROJECT_NAME
    sudo cp -r dist/* /var/www/html/$PROJECT_NAME/
    
    echo "✅ 前端部署完成"
}

# 5. Nginx配置
configure_nginx() {
    echo "🌐 配置Nginx..."
    
    # 复制配置文件
    sudo cp $DEPLOY_PATH/nginx.conf /etc/nginx/sites-available/$PROJECT_NAME
    sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/
    
    # 测试配置
    sudo nginx -t
    
    # 重启Nginx
    sudo systemctl restart nginx
    
    echo "✅ Nginx配置完成"
}

# 6. 防火墙配置
configure_firewall() {
    echo "🛡️ 配置防火墙..."
    
    # 开放必要端口
    if command -v ufw &> /dev/null; then
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw reload
    elif command -v firewall-cmd &> /dev/null; then
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
    fi
    
    echo "✅ 防火墙配置完成"
}

# 7. 服务状态检查
check_status() {
    echo "📋 检查服务状态..."
    
    # 检查PM2状态
    echo "应用查看:"
    pm2 list | grep $PROJECT_NAME
    
    # 检查Nginx状态
    echo "Nginx状态:"
    sudo systemctl status nginx --no-pager
    
    # 测试服务访问
    echo "服务测试:"
    curl -s http://localhost:$BACKEND_PORT/health && echo " - 后端健康检查通过"
    curl -s http://localhost/health && echo " - 前端代理通过"
    
    echo "✅ 服务状态检查完成"
}

# 8. 创建监控脚本
create_monitoring() {
    echo "📊 创建监控脚本..."
    
    cat > $DEPLOY_PATH/monitor.sh << 'EOF'
#!/bin/bash
# 服务监控脚本

echo "=== 智能厨房服务监控 ==="
echo "时间: $(date)"

# 检查后端服务
if pm2 list | grep -q "smart-kitchen-backend.*online"; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务异常"
fi

# 检查Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx运行正常"
else
    echo "❌ Nginx服务异常"
fi

# 检查磁盘空间
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️ 磁盘使用率过高: ${DISK_USAGE}%"
else
    echo "✅ 磁盘使用率正常: ${DISK_USAGE}%"
fi

# 检查内存使用
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.2f", $3*100/$2}')
echo "📝 内存使用率: ${MEMORY_USAGE}%"
EOF

    chmod +x $DEPLOY_PATH/monitor.sh
    echo "✅ 监控脚本创建完成"
}

# 执行部署流程
main() {
    check_environment
    deploy_project
    deploy_backend
    deploy_frontend
    configure_nginx
    configure_firewall
    check_status
    create_monitoring
    
    echo ""
    echo "🎉 部署完成！"
    echo "📋 访问地址:"
    echo "   前端应用: http://$SERVER_IP"
    echo "   后端API: http://$SERVER_IP/api/"
    echo "   健康检查: http://$SERVER_IP/health"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看日志: pm2 logs $PROJECT_NAME-backend"
    echo "   重启服务: pm2 restart $PROJECT_NAME-backend"
    echo "   监控状态: $DEPLOY_PATH/monitor.sh"
}

# 执行主函数
main "$@"