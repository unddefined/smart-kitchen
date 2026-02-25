#!/bin/bash

echo "=== Smart Kitchen 部署修复脚本 ==="
echo

# 设置工作目录
cd /root/smart-kitchen  # 修正路径

# 停止现有容器
echo "1. 停止现有容器..."
docker-compose -f docker-compose.prod.yml down

# 清理可能的残留容器
echo "2. 清理残留容器..."
docker rm -f smart-kitchen-nginx-prod smart-kitchen-backend-prod smart-kitchen-postgres-prod 2>/dev/null || true

# 重建并启动服务
echo "3. 重建并启动服务..."
docker-compose -f docker-compose.prod.yml up -d --build

# 等待服务启动
echo "4. 等待服务启动..."
sleep 15

# 检查容器状态
echo "5. 检查容器状态:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 测试服务
echo
echo "6. 测试服务连通性:"

# 测试后端
echo "测试后端服务:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ 后端服务正常运行 (状态码: $BACKEND_STATUS)"
else
    echo "❌ 后端服务异常 (状态码: $BACKEND_STATUS)"
    echo "查看后端日志:"
    docker logs smart-kitchen-backend-prod --tail 10
fi

# 测试Nginx代理
echo
echo "测试Nginx代理:"
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null)
if [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "404" ]; then
    echo "✅ Nginx代理正常工作 (状态码: $NGINX_STATUS)"
else
    echo "❌ Nginx代理异常 (状态码: $NGINX_STATUS)"
    echo "查看Nginx日志:"
    docker logs smart-kitchen-nginx-prod --tail 10
    
    # 检查Nginx配置
    echo "检查Nginx配置:"
    docker exec smart-kitchen-nginx-prod nginx -t
    
    # 重新加载Nginx配置
    echo "重新加载Nginx配置:"
    docker exec smart-kitchen-nginx-prod nginx -s reload
fi

# 最终验证
echo
echo "7. 最终验证:"
FINAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://8.145.34.30/ 2>/dev/null)
if [ "$FINAL_STATUS" = "200" ] || [ "$FINAL_STATUS" = "404" ]; then
    echo "🎉 部署成功！访问 http://8.145.34.30 查看应用"
else
    echo "⚠️  部署可能存在问题，状态码: $FINAL_STATUS"
fi

echo
echo "=== 部署完成 ==="
