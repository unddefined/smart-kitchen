#!/bin/bash

# Smart Kitchen SSH修复脚本
# 可以直接通过SSH执行: ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30 'bash -s' < scripts/ssh-repair.sh

echo "=== Smart Kitchen SSH 修复执行 ==="
echo

# 设置项目目录
PROJECT_DIR="/root/smart-kitchen"
cd $PROJECT_DIR

echo "当前目录: $(pwd)"
echo "项目目录: $PROJECT_DIR"
echo

# 1. 检查基础环境
echo "1. 检查基础环境..."
echo "Docker版本: $(docker --version 2>/dev/null || echo 'Docker未安装')"
echo "Docker Compose版本: $(docker-compose --version 2>/dev/null || echo 'Docker Compose未安装')"
echo "内存使用: $(free -h | grep Mem)"
echo "磁盘使用: $(df -h / | tail -1)"

# 2. 清理现有资源
echo
echo "2. 清理现有资源..."
# 安全停止容器
docker ps -aq --filter "name=smart-kitchen" | xargs -r docker stop 2>/dev/null
docker ps -aq --filter "name=smart-kitchen" | xargs -r docker rm 2>/dev/null

# 清理网络和卷
docker network ls | grep smart-kitchen | awk '{print $1}' | xargs -r docker network rm 2>/dev/null
docker volume ls | grep smart-kitchen | awk '{print $2}' | xargs -r docker volume rm 2>/dev/null

# 清理端口占用
echo "清理端口占用..."
for port in 80 3001 5432; do
    lsof -ti:$port | xargs -r kill -9 2>/dev/null
    sleep 1
done

# 3. 检查配置文件
echo
echo "3. 检查配置文件..."
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ 错误: 找不到 docker-compose.prod.yml"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "❌ 错误: 找不到 .env 文件"
    exit 1
fi

echo "✅ 配置文件检查通过"

# 4. 分步启动服务
echo
echo "4. 分步启动服务..."

# 启动数据库
echo "启动PostgreSQL数据库..."
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 15

# 检查数据库
if docker ps | grep -q smart-kitchen-postgres-prod; then
    echo "✅ 数据库启动成功"
else
    echo "❌ 数据库启动失败"
    docker logs smart-kitchen-postgres-prod --tail 10 2>/dev/null || echo "无法获取数据库日志"
    exit 1
fi

# 启动后端
echo "启动后端服务..."
docker-compose -f docker-compose.prod.yml up -d backend
sleep 20

# 检查后端
if docker ps | grep -q smart-kitchen-backend-prod; then
    echo "✅ 后端启动成功"
else
    echo "❌ 后端启动失败"
    docker logs smart-kitchen-backend-prod --tail 10 2>/dev/null || echo "无法获取后端日志"
    exit 1
fi

# 启动Nginx
echo "启动Nginx服务..."
docker-compose -f docker-compose.prod.yml up -d nginx
sleep 10

# 5. 最终验证
echo
echo "5. 最终验证..."

echo "=== 容器状态 ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep smart-kitchen

echo
echo "=== 端口占用 ==="
netstat -tlnp | grep -E ":(80|3001|5432)"

echo
echo "=== 服务测试 ==="
echo "后端健康检查:"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:3001/api/health || echo "❌ 后端服务不可达"

echo "数据库连接测试:"
docker exec smart-kitchen-postgres-prod pg_isready -U postgres && echo "✅ 数据库连接正常" || echo "❌ 数据库连接异常"

echo "Nginx代理测试:"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost/ || echo "❌ Nginx代理不可达"

echo "外部访问测试:"
curl -s -I http://8.145.34.30/ || echo "❌ 外部访问失败"

echo
echo "=== 修复完成 ==="
echo "如需进一步帮助，请提供上述输出信息"
