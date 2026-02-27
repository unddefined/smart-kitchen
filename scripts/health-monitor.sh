#!/bin/bash

# Smart Kitchen 服务健康监控脚本
# 作者: Lingma
# 日期: 2026-02-27

set -e

# 配置
CHECK_INTERVAL=60  # 检查间隔（秒）
ALERT_THRESHOLD=3  # 连续失败次数阈值
LOG_FILE="/var/log/smart-kitchen-health.log"

# 服务端点
BACKEND_URL="http://localhost:3001/api/health"
FRONTEND_URL="http://localhost"
DB_CONTAINER="smart-kitchen-postgres"

# 通知配置（可根据需要配置）
# SLACK_WEBHOOK_URL=""
# EMAIL_RECIPIENTS="admin@example.com"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 全局变量
backend_failures=0
frontend_failures=0
db_failures=0

log() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

alert() {
    local message="$1"
    log "🚨 ALERT: $message"
    
    # 发送Slack通知
    # if [ -n "$SLACK_WEBHOOK_URL" ]; then
    #     curl -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"🚨 Smart Kitchen Alert: $message\"}" \
    #         "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    # fi
    
    # 发送邮件通知
    # if [ -n "$EMAIL_RECIPIENTS" ]; then
    #     echo "$message" | mail -s "Smart Kitchen Alert" "$EMAIL_RECIPIENTS"
    # fi
}

check_backend() {
    if curl -f -s "$BACKEND_URL" >/dev/null 2>&1; then
        if [ $backend_failures -gt 0 ]; then
            log "✅ 后端服务恢复正常"
            alert "后端服务已恢复正常"
        fi
        backend_failures=0
        return 0
    else
        ((backend_failures++))
        log "❌ 后端服务检查失败 ($backend_failures/$ALERT_THRESHOLD)"
        
        if [ $backend_failures -ge $ALERT_THRESHOLD ]; then
            alert "后端服务连续失败 $backend_failures 次"
            # 可以在这里添加自动重启逻辑
            # restart_backend_service
        fi
        return 1
    fi
}

check_frontend() {
    if curl -f -s "$FRONTEND_URL" >/dev/null 2>&1; then
        if [ $frontend_failures -gt 0 ]; then
            log "✅ 前端服务恢复正常"
            alert "前端服务已恢复正常"
        fi
        frontend_failures=0
        return 0
    else
        ((frontend_failures++))
        log "❌ 前端服务检查失败 ($frontend_failures/$ALERT_THRESHOLD)"
        
        if [ $frontend_failures -ge $ALERT_THRESHOLD ]; then
            alert "前端服务连续失败 $frontend_failures 次"
        fi
        return 1
    fi
}

check_database() {
    if docker ps --format '{{.Names}}' | grep -q "^$DB_CONTAINER$"; then
        if docker exec "$DB_CONTAINER" pg_isready -U smart_kitchen >/dev/null 2>&1; then
            if [ $db_failures -gt 0 ]; then
                log "✅ 数据库服务恢复正常"
                alert "数据库服务已恢复正常"
            fi
            db_failures=0
            return 0
        else
            ((db_failures++))
            log "❌ 数据库连接检查失败 ($db_failures/$ALERT_THRESHOLD)"
            
            if [ $db_failures -ge $ALERT_THRESHOLD ]; then
                alert "数据库服务连续失败 $db_failures 次"
            fi
            return 1
        fi
    else
        log "❌ 数据库容器未运行"
        ((db_failures++))
        return 1
    fi
}

check_docker_containers() {
    local unhealthy_containers=$(docker ps --filter "status=unhealthy" --format '{{.Names}}')
    
    if [ -n "$unhealthy_containers" ]; then
        log "⚠️  发现不健康的容器: $unhealthy_containers"
        alert "发现不健康的容器: $unhealthy_containers"
        return 1
    fi
    
    local stopped_containers=$(docker ps --filter "status=exited" --format '{{.Names}}')
    
    if [ -n "$stopped_containers" ]; then
        log "⚠️  发现已停止的容器: $stopped_containers"
        alert "发现已停止的容器: $stopped_containers"
        return 1
    fi
    
    return 0
}

check_system_resources() {
    # 检查内存使用率
    local memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    if (( $(echo "$memory_usage > 85" | bc -l) )); then
        log "⚠️  内存使用率过高: ${memory_usage}%"
        alert "内存使用率过高: ${memory_usage}%"
    fi
    
    # 检查磁盘使用率
    local disk_usage=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 85 ]; then
        log "⚠️  磁盘使用率过高: ${disk_usage}%"
        alert "磁盘使用率过高: ${disk_usage}%"
    fi
    
    # 检查CPU负载
    local cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if (( $(echo "$cpu_load > 5.0" | bc -l) )); then
        log "⚠️  CPU负载过高: $cpu_load"
        alert "CPU负载过高: $cpu_load"
    fi
}

restart_backend_service() {
    log "🔄 尝试重启后端服务..."
    cd /root/smart-kitchen
    docker-compose restart backend
    
    # 等待服务重启
    sleep 15
    
    # 验证重启结果
    if check_backend; then
        log "✅ 后端服务重启成功"
        alert "后端服务已自动重启并恢复正常"
    else
        log "❌ 后端服务重启失败"
        alert "后端服务重启失败，需要人工干预"
    fi
}

perform_health_check() {
    log "=== 开始健康检查 ==="
    
    local overall_status="healthy"
    
    # 检查各项服务
    check_backend || overall_status="unhealthy"
    check_frontend || overall_status="unhealthy"
    check_database || overall_status="unhealthy"
    check_docker_containers || overall_status="degraded"
    check_system_resources
    
    log "=== 健康检查完成 (状态: $overall_status) ==="
    
    return 0
}

# 后台运行模式
run_daemon() {
    log "🚀 启动健康监控守护进程"
    log "检查间隔: ${CHECK_INTERVAL}秒"
    log "告警阈值: ${ALERT_THRESHOLD}次连续失败"
    
    while true; do
        perform_health_check
        sleep "$CHECK_INTERVAL"
    done
}

# 单次检查模式
run_once() {
    log "🔍 执行单次健康检查"
    perform_health_check
}

# 显示当前状态
show_status() {
    echo "=== Smart Kitchen 服务状态 ==="
    echo ""
    
    # Docker容器状态
    echo "🐳 Docker容器状态:"
    docker-compose ps
    
    echo ""
    echo "🌐 服务可用性检查:"
    
    # 后端检查
    if curl -f -s "$BACKEND_URL" >/dev/null 2>&1; then
        echo "✅ 后端API: 正常运行"
        # 获取后端版本信息
        local version=$(curl -s "$BACKEND_URL" | jq -r '.version // "unknown"' 2>/dev/null || echo "unknown")
        echo "   版本: $version"
    else
        echo "❌ 后端API: 无法访问"
    fi
    
    # 前端检查
    if curl -f -s "$FRONTEND_URL" >/dev/null 2>&1; then
        echo "✅ 前端服务: 正常运行"
    else
        echo "❌ 前端服务: 无法访问"
    fi
    
    # 数据库检查
    if docker exec "$DB_CONTAINER" pg_isready -U smart_kitchen >/dev/null 2>&1; then
        echo "✅ 数据库: 正常运行"
        # 获取数据库统计信息
        local db_stats=$(docker exec "$DB_CONTAINER" psql -U smart_kitchen -d smart_kitchen_prod -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';" -t 2>/dev/null | xargs)
        echo "   表数量: $db_stats"
    else
        echo "❌ 数据库: 无法连接"
    fi
    
    echo ""
    echo "📊 系统资源使用:"
    free -h | grep Mem
    df -h / | grep /
    echo "CPU负载: $(uptime | awk -F'load average:' '{print $2}')"
}

# 显示帮助
show_help() {
    echo "Smart Kitchen 健康监控工具"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  daemon    - 以后台守护进程模式运行（默认）"
    echo "  once      - 执行单次检查"
    echo "  status    - 显示当前服务状态"
    echo "  help      - 显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 daemon     # 启动持续监控"
    echo "  $0 once       # 执行一次检查"
    echo "  $0 status     # 查看当前状态"
}

# 主函数
main() {
    local mode=${1:-"daemon"}
    
    case $mode in
        "daemon")
            run_daemon
            ;;
        "once")
            run_once
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            echo "未知选项: $mode"
            show_help
            exit 1
            ;;
    esac
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi