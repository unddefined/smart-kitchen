#!/bin/bash

echo "=== Smart Kitchen 部署状态检查 ==="

# 检查Docker服务状态
echo "1. 检查Docker服务状态..."
if systemctl is-active --quiet docker; then
    echo "✅ Docker服务运行正常"
else
    echo "❌ Docker服务未运行"
    sudo systemctl start docker
fi

# 检查容器状态
echo "2. 检查容器状态..."
docker compose ps

# 检查网络连接
echo "3. 检查网络连接..."
echo "测试后端API..."
curl -f http://localhost:3001/api/health && echo "✅ 后端API正常" || echo "❌ 后端API异常"

echo "测试前端服务..."
curl -f http://localhost && echo "✅ 前端服务正常" || echo "❌ 前端服务异常"

echo "测试数据库连接..."
docker compose exec postgres pg_isready -U smart_kitchen -d smart_kitchen_prod && echo "✅ 数据库连接正常" || echo "❌ 数据库连接异常"

# 检查日志
echo "4. 最近的日志..."
echo "--- 后端日志 ---"
docker compose logs backend --tail 10

echo "--- 前端日志 ---"
docker compose logs frontend --tail 10

echo "--- 数据库日志 ---"
docker compose logs postgres --tail 10

# 检查资源使用
echo "5. 资源使用情况..."
docker stats --no-stream

echo "=== 检查完成 ==="