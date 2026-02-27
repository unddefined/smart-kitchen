#!/bin/bash

# Smart Kitchen 部署回滚脚本
# 作者: Lingma
# 日期: 2026-02-27

set -e

PROJECT_DIR="/root/smart-kitchen"
BACKUP_DIR="/root/backups"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# 查找最新的备份
find_latest_backup() {
    local backup_type=$1
    local latest_backup=""
    
    case $backup_type in
        "db")
            latest_backup=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -n1)
            ;;
        "env")
            latest_backup=$(ls -t "$BACKUP_DIR"/env_backup_* 2>/dev/null | head -n1)
            ;;
        *)
            error "未知的备份类型: $backup_type"
            return 1
            ;;
    esac
    
    if [ -z "$latest_backup" ]; then
        error "未找到$backup_type类型的备份文件"
        return 1
    fi
    
    echo "$latest_backup"
    return 0
}

# 回滚数据库
rollback_database() {
    log "开始数据库回滚..."
    
    local db_backup=$(find_latest_backup "db")
    if [ $? -ne 0 ]; then
        error "找不到数据库备份文件"
        return 1
    fi
    
    log "使用备份文件: $db_backup"
    
    # 停止应用服务
    log "停止应用服务..."
    cd "$PROJECT_DIR"
    docker-compose stop backend frontend
    
    # 恢复数据库
    log "恢复数据库..."
    docker exec -i smart-kitchen-postgres psql -U smart_kitchen smart_kitchen_prod < "$db_backup"
    
    if [ $? -eq 0 ]; then
        log "数据库回滚成功"
        return 0
    else
        error "数据库回滚失败"
        return 1
    fi
}

# 回滚代码版本
rollback_code() {
    log "开始代码回滚..."
    
    cd "$PROJECT_DIR"
    
    # 获取当前commit
    local current_commit=$(git rev-parse HEAD)
    log "当前commit: $current_commit"
    
    # 回退到上一个commit
    git reset --hard HEAD~1
    local rollback_commit=$(git rev-parse HEAD)
    log "回滚到commit: $rollback_commit"
    
    # 重新构建和部署
    log "重新部署回滚版本..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    
    # 等待服务启动
    sleep 30
    
    # 运行必要的迁移（如果需要）
    # docker-compose exec backend npx prisma migrate deploy
    
    log "代码回滚完成"
}

# 回滚环境配置
rollback_env() {
    log "开始环境配置回滚..."
    
    local env_backup=$(find_latest_backup "env")
    if [ $? -ne 0 ]; then
        warn "找不到环境配置备份，跳过环境回滚"
        return 0
    fi
    
    log "恢复环境配置: $env_backup"
    cp "$env_backup" "$PROJECT_DIR/.env"
    
    log "环境配置回滚完成"
}

# 验证回滚结果
verify_rollback() {
    log "验证回滚结果..."
    
    # 检查服务状态
    cd "$PROJECT_DIR"
    docker-compose ps
    
    # 检查API可用性
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        log "后端API恢复正常"
    else
        error "后端API仍然不可用"
        return 1
    fi
    
    # 检查前端
    if curl -f http://localhost > /dev/null 2>&1; then
        log "前端服务恢复正常"
    else
        error "前端服务仍然不可用"
        return 1
    fi
    
    log "回滚验证通过"
    return 0
}

# 主回滚流程
main() {
    log "开始部署回滚流程"
    
    local rollback_type=${1:-"full"}  # 默认完全回滚
    
    case $rollback_type in
        "db")
            if rollback_database && verify_rollback; then
                log "数据库回滚成功"
                exit 0
            else
                error "数据库回滚失败"
                exit 1
            fi
            ;;
        "code")
            if rollback_code && verify_rollback; then
                log "代码回滚成功"
                exit 0
            else
                error "代码回滚失败"
                exit 1
            fi
            ;;
        "env")
            if rollback_env; then
                log "环境配置回滚成功"
                exit 0
            else
                error "环境配置回滚失败"
                exit 1
            fi
            ;;
        "full"|*)
            if rollback_database && rollback_code && rollback_env && verify_rollback; then
                log "完全回滚成功"
                exit 0
            else
                error "完全回滚失败"
                exit 1
            fi
            ;;
    esac
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  db     - 仅回滚数据库"
    echo "  code   - 仅回滚代码版本"
    echo "  env    - 仅回滚环境配置"
    echo "  full   - 完全回滚（默认）"
    echo "  help   - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 full    # 完全回滚到最后一个稳定版本"
    echo "  $0 db      # 仅回滚数据库到最新备份"
    echo "  $0 code    # 回滚代码到上一个commit"
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    if [[ "$1" == "help" ]] || [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
        show_help
        exit 0
    fi
    main "$@"
fi