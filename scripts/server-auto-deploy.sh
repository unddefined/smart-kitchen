#!/bin/bash

# 服务器自动部署脚本
# 用于一键更新和部署智能厨房项目

set -e

PROJECT_DIR="/root/smart-kitchen"
BACKUP_DIR="/root/backups/smart-kitchen"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚀 开始自动部署流程..."

# 1. 创建备份
create_backup() {
    echo "📦 创建备份..."
    sudo mkdir -p $BACKUP_DIR
    if [ -d "$PROJECT_DIR" ]; then
        sudo tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C /var/www smart-kitchen
        echo "✅ 备份创建完成: $BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
    fi
}

# 2. 更新代码
update_code() {
    echo "🔄 更新代码..."
    cd $PROJECT_DIR
    
    # 拉取最新代码
    git pull origin main
    
    # 检查是否有更新
    if [ "$(git rev-parse HEAD)" != "$(git rev-parse @{u})" ]; then
        echo "✅ 代码已更新"
    else
        echo "ℹ️  代码已是最新版本"
    fi
}

# 3. 后端部署
deploy_backend() {
    echo "⚙️ 部署后端服务..."
    cd $PROJECT_DIR/backend
    
    # 安装依赖
    npm install --production
    
    # 生成Prisma客户端
    npx prisma generate
    
    # 重启服务
    if pm2 list | grep -q "smart-kitchen-backend"; then
        pm2 restart smart-kitchen-backend
        echo "✅ 后端服务已重启"
    else
        pm2 start dist/main.js --name "smart-kitchen-backend"
        echo "✅ 后端服务已启动"
    fi
}

# 4. 前端部署
deploy_frontend() {
    echo "🎨 部署前端应用..."
    cd $PROJECT_DIR/frontend
    
    # 安装依赖
    npm install --production
    
    # 构建生产版本
    npm run build
    
    # 部署到Web目录
    sudo mkdir -p /www/html/smart-kitchen
    sudo cp -r dist/* /www/html/smart-kitchen/
    
    echo "✅ 前端部署完成"
}

# 5. 验证部署
verify_deployment() {
    echo "✅ 验证部署结果..."
    
    # 检查后端健康
    sleep 3
    if curl -s http://localhost:3000/health | grep -q "ok"; then
        echo "🟢 后端服务正常"
    else
        echo "🔴 后端服务异常"
        exit 1
    fi
    
    # 检查前端访问
    if curl -s http://localhost/ | grep -q "smart"; then
        echo "🟢 前端服务正常"
    else
        echo "🟡 前端服务可能存在异常"
    fi
}

# 6. 清理旧备份
cleanup_backups() {
    echo "🧹 清理旧备份..."
    find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete
    echo "✅ 旧备份清理完成"
}

# 7. 发送通知（可选）
send_notification() {
    echo "📢 发送部署通知..."
    # 可以集成企业微信、钉钉等通知
    echo "部署完成时间: $(date)" | logger -t smart-kitchen-deploy
}

# 主执行流程
main() {
    create_backup
    update_code
    deploy_backend
    deploy_frontend
    verify_deployment
    cleanup_backups
    send_notification
    
    echo ""
    echo "🎉 部署完成！"
    echo "📋 部署信息:"
    echo "   时间: $(date)"
    echo "   版本: $(cd $PROJECT_DIR && git rev-parse --short HEAD)"
    echo "   访问: http://8.145.34.30"
    echo ""
    echo "🔧 管理命令:"
    echo "   查看日志: pm2 logs smart-kitchen-backend"
    echo "   重启服务: pm2 restart smart-kitchen-backend"
    echo "   回滚版本: git reset --hard <commit-hash>"
}

# 执行主函数
main "$@"