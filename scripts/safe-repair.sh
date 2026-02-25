#!/bin/bash

echo "=== Smart Kitchen 安全修复脚本 ==="
echo

cd /root/smart-kitchen

echo "1. 检查Docker版本和状态..."
docker --version
systemctl status docker --no-pager || echo "Docker服务状态异常"

echo
echo "2. 清理现有资源..."
# 安全地停止所有相关容器
docker ps -aq --filter "name=smart-kitchen" | xargs -r docker stop
docker ps -aq --filter "name=smart-kitchen" | xargs -r docker rm

# 清理网络和卷
docker network ls | grep smart-kitchen | awk '{print $1}' | xargs -r docker network rm
docker volume ls | grep smart-kitchen | awk '{print $2}' | xargs -r docker volume rm

echo
echo "3. 清理端口占用..."
# 查找并杀死占用端口的进程
for port in 80 3001 5432; do
    echo "清理端口 $port..."
    lsof -ti:$port | xargs -r kill -9
    sleep 2
done

echo
echo "4. 验证Docker Compose文件..."
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ 错误: 找不到 docker-compose.prod.yml"
    exit 1
fi

# 验证YAML语法
python3 -c "import yaml; yaml.safe_load(open('docker-compose.prod.yml'))" 2>/dev/null && echo "✅ docker-compose.prod.yml 语法正确" || echo "⚠️  YAML文件可能存在语法问题"

echo
echo "5. 分步启动服务..."

# 先启动数据库
echo "启动PostgreSQL数据库..."
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 10

# 检查数据库状态
echo "检查数据库状态..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep postgres

# 启动后端
echo "启动后端服务..."
docker-compose -f docker-compose.prod.yml up -d backend
sleep 15

# 检查后端状态
echo "检查后端状态..."
docker ps --format "table {{.Names}}\t{{.Status}}" | grep backend

# 最后启动Nginx
echo "启动Nginx服务..."
docker-compose -f docker-compose.prod.yml up -d nginx
sleep 10

echo
echo "6. 最终状态检查..."
echo "=== 容器状态 ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "=== 端口占用 ==="
netstat -tlnp | grep -E ":(80|3001|5432)"

echo
echo "=== 服务测试 ==="
echo "后端健康检查:"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:3001/api/health || echo "后端服务不可达"

echo "数据库连接测试:"
docker exec smart-kitchen-postgres-prod pg_isready -U postgres && echo "✅ 数据库连接正常" || echo "❌ 数据库连接异常"

echo "Nginx代理测试:"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost/ || echo "Nginx代理不可达"

echo "外部访问测试:"
curl -s -I http://8.145.34.30/ || echo "外部访问失败"

echo
echo "=== 修复完成 ==="
echo "如果仍有问题，请检查:"
echo "1. Docker服务状态: systemctl status docker"
echo "2. 系统资源: free -h, df -h"
echo "3. Docker日志: journalctl -u docker"
