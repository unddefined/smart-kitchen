#!/bin/bash

# Smart Kitchen 自动化部署脚本
# 作者: Lingma
# 日期: 2026-02-27

set -e  # 遇到错误立即退出

# 配置变量
PROJECT_DIR="/root/smart-kitchen"
BACKUP_DIR="/root/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# 检查前提条件
check_prerequisites() {
    log "检查部署前提条件..."
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        error "Docker未安装"
        exit 1
    fi
    
    # 检查Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose未安装"
        exit 1
    fi
    
    # 检查项目目录
    if [ ! -d "$PROJECT_DIR" ]; then
        error "项目目录不存在: $PROJECT_DIR"
        exit 1
    fi
    
    log "前提条件检查通过"
}

# 备份当前版本
backup_current_version() {
    log "创建当前版本备份..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 备份数据库
    if docker ps | grep -q smart-kitchen-postgres; then
        log "备份数据库..."
        docker exec smart-kitchen-postgres pg_dump -U smart_kitchen smart_kitchen_prod > \
            "$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
    fi
    
    # 备份配置文件
    if [ -f "$PROJECT_DIR/.env" ]; then
        cp "$PROJECT_DIR/.env" "$BACKUP_DIR/env_backup_$TIMESTAMP"
    fi
    
    log "备份完成: $BACKUP_DIR"
}

# 拉取最新代码
pull_latest_code() {
    log "拉取最新代码..."
    
    cd "$PROJECT_DIR"
    
    # 获取当前commit hash
    CURRENT_COMMIT=$(git rev-parse HEAD)
    
    # 拉取最新代码
    git pull origin main
    
    # 获取新commit hash
    NEW_COMMIT=$(git rev-parse HEAD)
    
    if [ "$CURRENT_COMMIT" != "$NEW_COMMIT" ]; then
        log "代码已更新: $CURRENT_COMMIT -> $NEW_COMMIT"
    else
        log "代码已是最新版本"
    fi
}

# 构建和部署
build_and_deploy() {
    log "开始构建和部署..."
    
    cd "$PROJECT_DIR"
    
    # 停止旧服务
    log "停止旧服务..."
    docker-compose down || warn "停止服务时遇到问题"
    
    # 构建新镜像
    log "构建新镜像..."
    docker-compose build --no-cache
    
    # 启动服务
    log "启动新服务..."
    docker-compose up -d
    
    # 等待服务启动
    log "等待服务启动..."
    sleep 30
    
    # 运行数据库迁移
    log "运行数据库迁移..."
    docker-compose exec backend npx prisma migrate deploy
    
    # 重启后端服务以应用迁移
    log "重启后端服务..."
    docker-compose restart backend
}

# 验证部署
verify_deployment() {
    log "验证部署状态..."
    
    # 检查容器状态
    log "检查容器状态..."
    docker-compose ps
    
    # 检查后端API
    log "检查后端API..."
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log "后端API正常运行"
    else
        error "后端API无法访问"
        return 1
    fi
    
    # 检查前端
    log "检查前端服务..."
    if curl -f http://localhost > /dev/null 2>&1; then
        log "前端服务正常运行"
    else
        error "前端服务无法访问"
        return 1
    fi
    
    # 检查数据库连接
    log "检查数据库连接..."
    if docker-compose exec backend node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        prisma.\$connect().then(() => {
            console.log('数据库连接成功');
            prisma.\$disconnect();
        }).catch((err) => {
            console.error('数据库连接失败:', err);
            process.exit(1);
        });
    "; then
        log "数据库连接正常"
    else
        error "数据库连接异常"
        return 1
    fi
    
    log "部署验证通过"
    return 0
}

# 清理旧备份
cleanup_old_backups() {
    log "清理7天前的旧备份..."
    
    find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
    find "$BACKUP_DIR" -name "env_backup_*" -mtime +7 -delete
    
    log "备份清理完成"
}

# 发送通知
send_notification() {
    local status=$1
    local message=$2
    
    # 可以集成邮件、Slack、微信等通知服务
    log "部署$([ "$status" = "success" ] && echo "成功" || echo "失败"): $message"
    
    # 示例：发送到Slack webhook
    # if [ -n "$SLACK_WEBHOOK_URL" ]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"部署$([ "$status" = "success" ] && echo "成功" || echo "失败"): $message\"}" \
    #         $SLACK_WEBHOOK_URL
    # fi
}

# 主部署流程
main() {
    log "开始自动化部署流程"
    
    local deployment_success=false
    
    # 执行部署步骤
    if check_prerequisites && \
       backup_current_version && \
       pull_latest_code && \
       build_and_deploy && \
       verify_deployment; then
        deployment_success=true
        send_notification "success" "Smart Kitchen部署成功完成"
    else
        send_notification "failure" "Smart Kitchen部署失败，请检查日志"
        # 可以在这里添加回滚逻辑
    fi
    
    # 清理工作
    cleanup_old_backups
    
    log "部署流程结束"
    
    if [ "$deployment_success" = true ]; then
        exit 0
    else
        exit 1
    fi
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi