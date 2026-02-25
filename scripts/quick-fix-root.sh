#!/bin/bash

echo "=== Smart Kitchen 快速修复脚本 ==="
echo "项目目录: /root/smart-kitchen"
echo

cd /root/smart-kitchen

# 检查必需文件
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "错误: 找不到 docker-compose.prod.yml 文件"
    echo "请确保项目文件完整"
    exit 1
fi

echo "1. 停止现有服务..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

echo "2. 清理冲突进程..."
# 杀死占用端口的进程
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 3001/tcp 2>/dev/null || true
sudo fuser -k 5432/tcp 2>/dev/null || true

echo "3. 清理Docker容器..."
docker rm -f smart-kitchen-nginx-prod smart-kitchen-backend-prod smart-kitchen-postgres-prod 2>/dev/null || true

echo "4. 重建并启动服务..."
docker-compose -f docker-compose.prod.yml up -d --build

echo "5. 等待服务启动..."
sleep 20

echo "6. 检查服务状态:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo
echo "7. 测试服务连通性:"
echo "后端健康检查:"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost:3001/api/health

echo "Nginx代理测试:"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://localhost/

echo "外部访问测试:"
curl -s -o /dev/null -w "状态码: %{http_code}\n" http://8.145.34.30/

echo
echo "=== 修复完成 ==="
