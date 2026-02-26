#!/bin/bash

echo "=== Smart Kitchen SSH 自动修复 ==="
echo

# 设置项目目录
cd /root/smart-kitchen

echo "1. 检查系统状态..."
echo "Docker版本:"
docker --version
echo "Docker服务状态:"
systemctl is-active docker

echo
echo "2. 清理现有资源..."
# 安全停止和删除容器
for container in smart-kitchen-postgres-prod smart-kitchen-backend-prod smart-kitchen-nginx-prod; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "停止容器: $container"
        docker stop $container 2>/dev/null || true
        docker rm $container 2>/dev/null || true
    fi
done

# 清理网络和卷
docker network rm smart-kitchen_backend-network 2>/dev/null || true
docker volume rm smart-kitchen_postgres_data_prod 2>/dev/null || true

echo
echo "3. 清理端口占用..."
for port in 80 3001 5432; do
    echo "清理端口 $port..."
    lsof -ti:$port | xargs -r kill -9 2>/dev/null || true
    sleep 1
done

echo
echo "4. 验证配置文件..."
if [ ! -f ".env" ]; then
    echo "创建环境变量文件..."
    cat > .env << 'EOF'
DB_USER=postgres
DB_PASSWORD=smart_kitchen_password_2024
DB_NAME=smart_kitchen
EOF
fi

if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ 错误: 找不到 docker-compose.prod.yml"
    exit 1
fi

echo
echo "5. 分步启动服务..."

# 启动数据库
echo "启动PostgreSQL数据库..."
docker-compose -f docker-compose.prod.yml up -d postgres
sleep 15

# 检查数据库
if docker ps --format '{{.Names}}' | grep -q "smart-kitchen-postgres-prod"; then
    echo "✅ 数据库启动成功"
    
    # 启动后端
    echo "启动后端服务..."
    docker-compose -f docker-compose.prod.yml up -d backend
    sleep 20
    
    # 检查后端
    if docker ps --format '{{.Names}}' | grep -q "smart-kitchen-backend-prod"; then
        echo "✅ 后端启动成功"
        
        # 启动Nginx
        echo "启动Nginx服务..."
        docker-compose -f docker-compose.prod.yml up -d nginx
        sleep 10
        
        echo "✅ Nginx启动成功"
    else
        echo "❌ 后端启动失败"
    fi
else
    echo "❌ 数据库启动失败"
fi

echo
echo "6. 最终状态检查..."

echo "=== 容器状态 ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "=== 端口占用 ==="
netstat -tlnp | grep -E ":(80|3001|5432)" || echo "相关端口未被占用"

echo
echo "=== 服务测试 ==="

# 测试后端
echo "后端健康检查:"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:3001/api/health 2>/dev/null || echo "后端服务不可达"

# 测试数据库
echo "数据库连接测试:"
if docker exec smart-kitchen-postgres-prod pg_isready -U postgres 2>/dev/null; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接异常"
fi

# 测试Nginx
echo "Nginx代理测试:"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost/ 2>/dev/null || echo "Nginx代理不可达"

# 外部访问测试
echo "外部访问测试:"
curl -s -I http://8.145.34.30/ 2>/dev/null || echo "外部访问失败"

echo
echo "=== 修复完成 ==="
echo "如需进一步帮助，请提供上述输出信息"
