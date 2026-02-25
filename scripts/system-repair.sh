#!/bin/bash

echo "=== Smart Kitchen 系统修复脚本 ==="
echo

# 1. 检查并创建工作目录
echo "1. 检查项目目录..."
if [ ! -d "/root/smart-kitchen" ]; then  # 修正路径
    if [ ! -d "/home/smart-kitchen" ]; then
        echo "创建项目目录..."
        mkdir -p /root/smart-kitchen  # 修正路径
        cd /root/smart-kitchen        # 修正路径
        
        # 如果是首次部署，需要克隆代码
        echo "请确认是否需要从Git克隆代码？"
        echo "如果是，请提供Git仓库地址，否则按Enter跳过"
        read -p "Git仓库地址: " GIT_REPO
        
        if [ ! -z "$GIT_REPO" ]; then
            git clone $GIT_REPO .
        else
            echo "跳过Git克隆，请手动上传项目文件到 /root/smart-kitchen/"  # 修正路径
            exit 1
        fi
    else
        cd /home/smart-kitchen
    fi
else
    cd /root/smart-kitchen  # 修正路径
fi

# 2. 停止冲突的系统服务
echo "2. 停止可能冲突的系统服务..."
# 停止系统级Nginx
if pgrep nginx > /dev/null; then
    echo "停止系统Nginx服务..."
    sudo systemctl stop nginx 2>/dev/null || true
    sudo systemctl disable nginx 2>/dev/null || true
fi

# 停止系统级PostgreSQL
if pgrep postgres > /dev/null; then
    echo "停止系统PostgreSQL服务..."
    sudo systemctl stop postgresql 2>/dev/null || true
    sudo systemctl disable postgresql 2>/dev/null || true
fi

# 3. 清理端口占用
echo "3. 清理端口占用..."
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 3001/tcp 2>/dev/null || true
sudo fuser -k 5432/tcp 2>/dev/null || true

# 4. 清理现有Docker容器和网络
echo "4. 清理现有Docker资源..."
docker rm -f smart-kitchen-nginx-prod smart-kitchen-backend-prod smart-kitchen-postgres-prod 2>/dev/null || true
docker network rm smart-kitchen_backend-network 2>/dev/null || true
docker volume rm smart-kitchen_postgres_data_prod 2>/dev/null || true

# 5. 检查Docker Compose文件
echo "5. 检查Docker Compose配置..."
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "错误：找不到 docker-compose.prod.yml 文件"
    echo "请确保项目文件完整"
    exit 1
fi

# 6. 构建并启动服务
echo "6. 构建并启动Docker服务..."
docker-compose -f docker-compose.prod.yml up -d --build

# 7. 等待服务启动
echo "7. 等待服务启动完成..."
sleep 20

# 8. 验证服务状态
echo "8. 验证服务状态:"
echo "容器状态:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "端口占用情况:"
netstat -tlnp | grep -E ":(80|3001|5432)"

# 9. 测试服务连通性
echo
echo "9. 测试服务连通性:"

# 测试后端
echo "测试后端API:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ 后端服务正常 (状态码: $BACKEND_STATUS)"
else
    echo "❌ 后端服务异常 (状态码: $BACKEND_STATUS)"
    echo "查看后端日志:"
    docker logs smart-kitchen-backend-prod --tail 10
fi

# 测试数据库
echo
echo "测试数据库连接:"
DB_STATUS=$(docker exec smart-kitchen-postgres-prod pg_isready -U postgres 2>/dev/null && echo "ready" || echo "not_ready")
if [ "$DB_STATUS" = "ready" ]; then
    echo "✅ 数据库服务正常"
else
    echo "❌ 数据库服务异常"
    echo "查看数据库日志:"
    docker logs smart-kitchen-postgres-prod --tail 10
fi

# 测试Nginx
echo
echo "测试Nginx代理:"
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null)
if [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "404" ]; then
    echo "✅ Nginx代理正常 (状态码: $NGINX_STATUS)"
else
    echo "❌ Nginx代理异常 (状态码: $NGINX_STATUS)"
    echo "查看Nginx日志:"
    docker logs smart-kitchen-nginx-prod --tail 10
    
    # 检查Nginx配置
    echo "检查Nginx配置:"
    docker exec smart-kitchen-nginx-prod nginx -t
    
    # 重新加载配置
    echo "重新加载Nginx配置:"
    docker exec smart-kitchen-nginx-prod nginx -s reload
fi

# 10. 最终验证
echo
echo "10. 最终外部访问测试:"
FINAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://8.145.34.30/ 2>/dev/null)
if [ "$FINAL_STATUS" = "200" ] || [ "$FINAL_STATUS" = "404" ]; then
    echo "🎉 部署成功！访问 http://8.145.34.30 查看应用"
    echo "状态码: $FINAL_STATUS"
else
    echo "⚠️  部署可能存在问题"
    echo "状态码: $FINAL_STATUS"
    echo "建议检查防火墙设置和网络安全组配置"
fi

echo
echo "=== 修复完成 ==="
echo "如需进一步帮助，请提供上述输出信息"
