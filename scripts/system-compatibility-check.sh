#!/bin/bash

# Alibaba Cloud Linux 系统兼容性检查脚本
# 适用于: Alibaba Cloud Linux 3.2104 LTS 64位
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

# 系统信息检查
check_system_info() {
    log "检查系统基本信息..."
    
    # 操作系统版本
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        info "操作系统: $NAME $VERSION"
        info "ID: $ID $VERSION_ID"
    fi
    
    # 内核版本
    info "内核版本: $(uname -r)"
    
    # 系统架构
    info "系统架构: $(uname -m)"
    
    # 检查是否为阿里云Linux
    if grep -q "Alibaba Cloud Linux" /etc/os-release 2>/dev/null; then
        log "✅ 确认为阿里云Linux系统"
    else
        warn "⚠️  非阿里云Linux系统，可能存在兼容性问题"
    fi
}

# Docker兼容性检查
check_docker_compatibility() {
    log "检查Docker兼容性..."
    
    # 检查Docker是否安装
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version | cut -d' ' -f3 | sed 's/,//')
        info "Docker版本: $docker_version"
        
        # 检查Docker Compose
        if command -v docker-compose &> /dev/null; then
            local compose_version=$(docker-compose --version | cut -d' ' -f3 | sed 's/,//')
            info "Docker Compose版本: $compose_version"
        else
            warn "Docker Compose未安装"
        fi
        
        # 检查用户权限
        if groups $USER | grep -q docker; then
            log "✅ 当前用户具有Docker权限"
        else
            warn "当前用户可能没有Docker权限，建议添加到docker组"
        fi
    else
        error "❌ Docker未安装"
        return 1
    fi
}

# SELinux检查
check_selinux() {
    log "检查SELinux状态..."
    
    if command -v getenforce &> /dev/null; then
        local selinux_status=$(getenforce)
        info "SELinux状态: $selinux_status"
        
        if [ "$selinux_status" = "Enforcing" ]; then
            warn "SELinux处于强制模式，可能影响容器运行"
            info "建议临时设置为Permissive模式进行测试:"
            info "sudo setenforce 0"
        elif [ "$selinux_status" = "Permissive" ]; then
            log "✅ SELinux处于宽容模式"
        else
            log "✅ SELinux已禁用"
        fi
    else
        log "✅ SELinux未安装或不可用"
    fi
}

# 防火墙检查
check_firewall() {
    log "检查防火墙配置..."
    
    # 检查firewalld
    if systemctl is-active --quiet firewalld; then
        info "Firewalld状态: 运行中"
        info "开放端口:"
        firewall-cmd --list-all | grep ports || echo "  无开放端口"
    elif systemctl is-active --quiet iptables; then
        info "iptables状态: 运行中"
        info "当前规则:"
        iptables -L INPUT -n | grep -E "(ACCEPT|DROP)" | head -5
    else
        log "✅ 未检测到活动的防火墙服务"
    fi
}

# 系统资源检查
check_system_resources() {
    log "检查系统资源..."
    
    # 内存使用
    local mem_info=$(free -h | grep Mem)
    local mem_total=$(echo $mem_info | awk '{print $2}')
    local mem_used=$(echo $mem_info | awk '{print $3}')
    local mem_free=$(echo $mem_info | awk '{print $4}')
    info "内存: 总计$mem_total, 已用$mem_used, 可用$mem_free"
    
    # 磁盘空间
    local disk_info=$(df -h / | tail -1)
    local disk_total=$(echo $disk_info | awk '{print $2}')
    local disk_used=$(echo $disk_info | awk '{print $3}')
    local disk_avail=$(echo $disk_info | awk '{print $4}')
    local disk_percent=$(echo $disk_info | awk '{print $5}')
    info "磁盘(/): 总计$disk_total, 已用$disk_used, 可用$disk_avail ($disk_percent)"
    
    # CPU信息
    local cpu_cores=$(nproc)
    local cpu_model=$(cat /proc/cpuinfo | grep "model name" | head -1 | cut -d':' -f2 | xargs)
    info "CPU: $cpu_cores核心, $cpu_model"
    
    # 负载平均值
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | xargs)
    info "系统负载: $load_avg"
}

# 网络配置检查
check_network_config() {
    log "检查网络配置..."
    
    # IP地址
    info "网络接口信息:"
    ip addr show | grep -E "inet.*scope global" | while read line; do
        echo "  $line"
    done
    
    # DNS配置
    if [ -f /etc/resolv.conf ]; then
        info "DNS服务器:"
        grep "^nameserver" /etc/resolv.conf | while read line; do
            echo "  $line"
        done
    fi
    
    # 网络连通性测试
    log "测试网络连通性..."
    if ping -c 3 8.8.8.8 >/dev/null 2>&1; then
        log "✅ 外网连接正常"
    else
        warn "⚠️  外网连接可能存在问题"
    fi
}

# 依赖软件检查
check_dependencies() {
    log "检查必需依赖..."
    
    local required_packages=(
        "git:Git版本控制系统"
        "curl:HTTP客户端工具"
        "wget:下载工具"
        "vim:文本编辑器"
        "nano:简易文本编辑器"
        "tar:归档工具"
        "gzip:压缩工具"
        "unzip:解压工具"
    )
    
    for pkg_info in "${required_packages[@]}"; do
        local pkg_name=${pkg_info%%:*}
        local pkg_desc=${pkg_info#*:}
        
        if command -v $pkg_name &> /dev/null; then
            local version=$($pkg_name --version 2>/dev/null | head -1 | cut -d' ' -f1-3)
            if [ -z "$version" ]; then
                version="已安装"
            fi
            log "✅ $pkg_desc: $version"
        else
            warn "❌ $pkg_desc: 未安装"
        fi
    done
}

# 系统优化建议
provide_optimization_suggestions() {
    log "系统优化建议..."
    
    echo ""
    echo "=== 针对Alibaba Cloud Linux的优化建议 ==="
    echo ""
    echo "1. 系统更新:"
    echo "   sudo yum update -y"
    echo ""
    echo "2. 安装常用工具:"
    echo "   sudo yum install -y git curl wget vim nano tar gzip unzip"
    echo ""
    echo "3. Docker安装 (如果未安装):"
    echo "   sudo yum install -y docker"
    echo "   sudo systemctl enable docker"
    echo "   sudo systemctl start docker"
    echo "   sudo usermod -aG docker $USER"
    echo ""
    echo "4. Docker Compose安装:"
    echo "   sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "   sudo chmod +x /usr/local/bin/docker-compose"
    echo ""
    echo "5. 防火墙配置:"
    echo "   sudo firewall-cmd --permanent --add-port=80/tcp"
    echo "   sudo firewall-cmd --permanent --add-port=3001/tcp"
    echo "   sudo firewall-cmd --permanent --add-port=5432/tcp"
    echo "   sudo firewall-cmd --reload"
    echo ""
    echo "6. 系统调优:"
    echo "   # 增加文件描述符限制"
    echo "   echo '* soft nofile 65536' | sudo tee -a /etc/security/limits.conf"
    echo "   echo '* hard nofile 65536' | sudo tee -a /etc/security/limits.conf"
    echo ""
    echo "   # 优化内核参数"
    echo "   echo 'net.core.somaxconn = 65535' | sudo tee -a /etc/sysctl.conf"
    echo "   echo 'net.ipv4.tcp_max_syn_backlog = 65535' | sudo tee -a /etc/sysctl.conf"
    echo "   sudo sysctl -p"
}

# 生成兼容性报告
generate_compatibility_report() {
    local report_file="/tmp/system-compatibility-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "=== Alibaba Cloud Linux 系统兼容性报告 ==="
        echo "生成时间: $(date)"
        echo "系统版本: $(cat /etc/os-release | grep PRETTY_NAME | cut -d'"' -f2)"
        echo ""
        echo "=== 检查结果摘要 ==="
        echo "系统信息: PASSED"
        echo "Docker兼容性: $(if command -v docker &> /dev/null; then echo "PASSED"; else echo "FAILED"; fi)"
        echo "SELinux状态: $(if getenforce &> /dev/null; then getenforce; else echo "NOT INSTALLED"; fi)"
        echo "防火墙状态: $(if systemctl is-active firewalld &> /dev/null; then echo "ACTIVE"; else echo "INACTIVE/NOT FOUND"; fi)"
        echo "网络连通性: $(if ping -c 1 8.8.8.8 >/dev/null 2>&1; then echo "OK"; else echo "PROBLEMATIC"; fi)"
        echo ""
        echo "=== 资源使用情况 ==="
        free -h | grep Mem
        df -h / | tail -1
        echo "CPU核心数: $(nproc)"
        echo ""
        echo "=== 建议操作 ==="
        echo "请根据上述检查结果执行相应的优化操作"
    } > "$report_file"
    
    log "兼容性报告已生成: $report_file"
    return 0
}

# 主函数
main() {
    log "开始Alibaba Cloud Linux系统兼容性检查"
    log "目标系统: Alibaba Cloud Linux 3.2104 LTS 64位"
    
    echo ""
    
    # 执行各项检查
    check_system_info
    echo ""
    
    check_docker_compatibility
    echo ""
    
    check_selinux
    echo ""
    
    check_firewall
    echo ""
    
    check_system_resources
    echo ""
    
    check_network_config
    echo ""
    
    check_dependencies
    echo ""
    
    provide_optimization_suggestions
    echo ""
    
    generate_compatibility_report
    
    log "系统兼容性检查完成"
    log "请根据检查结果和优化建议进行相应配置"
}

# 脚本入口点
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi