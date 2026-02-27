#!/bin/bash

# Alibaba Cloud Linux 系统优化脚本
# 专门为Smart Kitchen项目优化阿里云Linux 3.2104 LTS系统
# 作者: Lingma
# 日期: 2026-02-27

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        error "请以root用户身份运行此脚本"
        exit 1
    fi
}

# 系统基础优化
optimize_system_base() {
    log "执行系统基础优化..."
    
    # 更新系统
    log "更新系统包..."
    yum update -y
    
    # 安装必要工具
    log "安装必要工具..."
    yum install -y nano htop iotop iftop sysstat
    
    # 启用必要的服务
    systemctl enable chronyd
    systemctl start chronyd
    
    log "✅ 系统基础优化完成"
}

# Docker优化
optimize_docker() {
    log "优化Docker配置..."
    
    # 创建Docker配置目录
    mkdir -p /etc/docker
    
    # 配置Docker daemon
    cat > /etc/docker/daemon.json << EOF
{
    "registry-mirrors": [
        "https://hub-mirror.c.163.com",
        "https://mirror.baidubce.com"
    ],
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "storage-opts": [
        "overlay2.override_kernel_check=true"
    ],
    "live-restore": true
}
EOF
    
    # 重启Docker服务
    systemctl restart docker
    
    log "✅ Docker优化完成"
}

# 网络优化
optimize_network() {
    log "优化网络配置..."
    
    # 配置网络参数
    cat >> /etc/sysctl.conf << EOF

# 网络优化参数
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.core.rmem_default = 262144
net.core.wmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 1024 65535
EOF
    
    # 应用网络优化
    sysctl -p
    
    log "✅ 网络优化完成"
}

# 文件系统优化
optimize_filesystem() {
    log "优化文件系统配置..."
    
    # 增加文件描述符限制
    cat >> /etc/security/limits.conf << EOF

# Smart Kitchen 项目文件描述符限制
root soft nofile 100000
root hard nofile 100000
* soft nofile 100000
* hard nofile 100000
EOF
    
    # 创建系统服务限制
    mkdir -p /etc/systemd/system.conf.d
    cat > /etc/systemd/system.conf.d/limits.conf << EOF
[Manager]
DefaultLimitNOFILE=100000
DefaultLimitNPROC=100000
EOF
    
    log "✅ 文件系统优化完成"
}

# 防火墙配置
configure_firewall() {
    log "配置防火墙规则..."
    
    # 开放必要端口
    local ports=(80 3001 5432 22)
    
    for port in "${ports[@]}"; do
        firewall-cmd --permanent --add-port=${port}/tcp 2>/dev/null || {
            warn "端口 $port 已存在或添加失败"
        }
    done
    
    # 重载防火墙配置
    firewall-cmd --reload
    
    log "✅ 防火墙配置完成"
}

# 创建项目专用用户（可选）
create_project_user() {
    local username="smartkitchen"
    
    log "检查项目用户..."
    
    if id "$username" &>/dev/null; then
        log "用户 $username 已存在"
    else
        log "创建项目用户 $username..."
        useradd -m -s /bin/bash "$username"
        usermod -aG docker "$username"
        log "✅ 用户创建完成"
    fi
}

# 设置日志轮转
configure_log_rotation() {
    log "配置日志轮转..."
    
    # 为应用日志配置轮转
    cat > /etc/logrotate.d/smart-kitchen << EOF
/var/log/smart-kitchen/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF
    
    log "✅ 日志轮转配置完成"
}

# 性能监控设置
setup_monitoring() {
    log "设置性能监控..."
    
    # 安装监控工具
    yum install -y atop
    
    # 配置atop开机自启
    systemctl enable atop
    systemctl start atop
    
    log "✅ 性能监控设置完成"
}

# 创建系统状态检查脚本
create_status_check_script() {
    log "创建系统状态检查脚本..."
    
    cat > /usr/local/bin/system-status-check << 'EOF'
#!/bin/bash

echo "=== Smart Kitchen 系统状态检查 ==="
echo "检查时间: $(date)"
echo ""

echo "1. 系统负载:"
uptime
echo ""

echo "2. 内存使用:"
free -h
echo ""

echo "3. 磁盘使用:"
df -h
echo ""

echo "4. Docker容器状态:"
docker ps
echo ""

echo "5. 服务端口监听:"
ss -tulnp | grep -E ':(80|3001|5432)'
echo ""

echo "6. 防火墙状态:"
firewall-cmd --list-all
echo ""

echo "=== 检查完成 ==="
EOF
    
    chmod +x /usr/local/bin/system-status-check
    
    log "✅ 状态检查脚本创建完成"
}

# 主优化流程
main_optimization() {
    log "开始Alibaba Cloud Linux系统优化"
    
    optimize_system_base
    echo ""
    
    optimize_docker
    echo ""
    
    optimize_network
    echo ""
    
    optimize_filesystem
    echo ""
    
    configure_firewall
    echo ""
    
    create_project_user
    echo ""
    
    configure_log_rotation
    echo ""
    
    setup_monitoring
    echo ""
    
    create_status_check_script
    echo ""
    
    log "🎉 系统优化完成！"
    log "建议重启系统以应用所有优化配置"
    log "使用 'system-status-check' 命令查看系统状态"
}

# 显示帮助信息
show_help() {
    echo "Alibaba Cloud Linux 系统优化脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  --all        执行所有优化项目（默认）"
    echo "  --system     仅执行系统基础优化"
    echo "  --docker     仅优化Docker配置"
    echo "  --network    仅优化网络配置"
    echo "  --firewall   仅配置防火墙"
    echo "  --status     仅创建状态检查脚本"
    echo "  --help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --all     # 执行完整优化"
    echo "  $0 --docker  # 仅优化Docker"
    echo "  $0 --status  # 仅创建检查脚本"
}

# 参数解析
parse_arguments() {
    case "${1:-"--all"}" in
        "--all")
            main_optimization
            ;;
        "--system")
            optimize_system_base
            ;;
        "--docker")
            optimize_docker
            ;;
        "--network")
            optimize_network
            ;;
        "--firewall")
            configure_firewall
            ;;
        "--status")
            create_status_check_script
            ;;
        "--help"|"-h")
            show_help
            ;;
        *)
            error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 主函数
main() {
    check_root
    
    if [ $# -eq 0 ]; then
        main_optimization
    else
        parse_arguments "$1"
    fi
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi