#!/bin/bash

echo "Testing frontend Docker build..."

# 进入前端目录
cd frontend

# 检查必要的文件是否存在
echo "Checking required files..."
if [ ! -f "Dockerfile" ]; then
    echo "ERROR: Dockerfile not found!"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "ERROR: package.json not found!"
    exit 1
fi

if [ ! -f "nginx.conf" ]; then
    echo "ERROR: nginx.conf not found!"
    exit 1
fi

echo "All required files found."

# 如果docker可用，尝试构建
if command -v docker &> /dev/null; then
    echo "Docker found, attempting to build..."
    docker build -t smart-kitchen-frontend:test .
    if [ $? -eq 0 ]; then
        echo "Build successful!"
        docker run -d -p 8080:80 --name test-frontend smart-kitchen-frontend:test
        echo "Container started on port 8080"
        echo "Test by visiting: http://localhost:8080"
    else
        echo "Build failed!"
        exit 1
    fi
else
    echo "Docker not found, skipping build test."
fi

echo "Frontend Docker setup verification complete."