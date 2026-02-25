#!/bin/bash

echo "=== 快速部署修复 ==="
echo

# 设置工作目录
WORK_DIR="/root/smart-kitchen"  # 修正路径
if [ ! -d "$WORK_DIR" ]; then
    WORK_DIR="/home/smart-kitchen"
    if [ ! -d "$WORK_DIR" ]; then
        echo "错误：找不到项目目录"
        echo "请先创建目录并将项目文件上传到服务器"
        exit 1
    fi
fi

cd $WORK_DIR
echo "工作目录: $WORK_DIR"

# 停止所有相关服务
echo "停止现有服务..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 清理容器
echo "清理容器..."
docker rm -f smart-kitchen-* 2>/dev/null || true

# 清理端口
echo "清理端口占用..."
sudo fuser -k 80/tcp 2>/dev/null || true
sudo fuser -k 3001/tcp 2>/dev/null || true
sudo fuser -k 5432/tcp 2>/dev/null || true

# 重建服务
echo "重建并启动服务..."
docker-compose -f docker-compose.prod.yml up -d --build

# 等待启动
echo "等待服务启动..."
sleep 15

# 检查状态
echo "服务状态:"
docker ps --format "table {{.Names}}\t{{.Status}}"

# 测试连接
echo
echo "测试连接:"
curl -s -o /dev/null -w "后端状态: %{http_code}\n" http://localhost:3001/api/health
curl -s -o /dev/null -w "Nginx状态: %{http_code}\n" http://localhost/

echo "修复完成！"
