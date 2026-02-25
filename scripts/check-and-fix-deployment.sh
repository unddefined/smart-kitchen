#!/bin/bash

echo "=== Smart Kitchen 部署状态检查 ==="
echo

# 检查Docker容器状态
echo "1. 检查Docker容器状态:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "2. 检查关键服务日志:"
echo "--- Backend日志 ---"
docker logs smart-kitchen-backend-prod --tail 20 2>/dev/null || echo "Backend容器未运行"

echo
echo "--- Nginx日志 ---"
docker logs smart-kitchen-nginx-prod --tail 20 2>/dev/null || echo "Nginx容器未运行"

echo
echo "3. 检查端口占用:"
netstat -tlnp | grep -E ":(80|3001|5432)" || echo "相关端口未被占用"

echo
echo "4. 测试服务连通性:"
echo "测试Backend API:"
curl -s -o /dev/null -w "HTTP状态: %{http_code}\n" http://localhost:3001/api/health 2>/dev/null || echo "Backend服务不可达"

echo "测试Nginx代理:"
curl -s -o /dev/null -w "HTTP状态: %{http_code}\n" http://localhost/api/health 2>/dev/null || echo "Nginx代理不可达"

echo
echo "5. 检查Nginx配置:"
docker exec smart-kitchen-nginx-prod nginx -t 2>/dev/null && echo "Nginx配置有效" || echo "Nginx配置有问题"

echo
echo "=== 修复建议 ==="

# 如果容器没运行，启动它们
if ! docker ps | grep -q smart-kitchen; then
    echo "检测到容器未运行，尝试启动..."
    cd /home/smart-kitchen
    docker-compose -f docker-compose.prod.yml up -d
    sleep 10
    echo "重新检查容器状态:"
    docker ps --format "table {{.Names}}\t{{.Status}}"
fi

# 检查并修复Nginx配置
echo
echo "检查Nginx默认站点配置..."
if [ -f "/etc/nginx/sites-enabled/default" ]; then
    echo "发现默认Nginx配置，可能冲突"
    sudo rm /etc/nginx/sites-enabled/default
    echo "已删除默认配置"
fi

# 重启Nginx
echo "重启Nginx服务..."
docker restart smart-kitchen-nginx-prod

echo
echo "等待服务启动完成..."
sleep 5

echo "最终测试:"
curl -s -o /dev/null -w "HTTP状态: %{http_code}\n" http://localhost/ || echo "服务仍未响应"
