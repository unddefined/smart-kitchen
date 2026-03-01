@echo off
setlocal enabledelayedexpansion

echo 🚀 开始强制重新构建前端镜像...

REM 进入前端目录
cd frontend

REM 清理node_modules和构建缓存
echo 🧹 清理构建缓存...
if exist node_modules rmdir /s /q node_modules
if exist dist rmdir /s /q dist
if exist .vite rmdir /s /q .vite

REM 重新安装依赖
echo 📦 重新安装依赖...
call npm install

REM 构建前端
echo 🏗️ 构建前端应用...
call npm run build

REM 返回项目根目录
cd ..

REM 构建新的Docker镜像（不使用缓存）
echo 🐳 构建新的Docker镜像...
docker build --no-cache -t smart-kitchen-frontend ./frontend

REM 停止并删除旧容器
echo 🛑 停止旧容器...
docker stop smart-kitchen-frontend-prod >nul 2>&1
docker rm smart-kitchen-frontend-prod >nul 2>&1

REM 启动新容器
echo 🚀 启动新容器...
docker run -d ^
  --name smart-kitchen-frontend-prod ^
  --network app-network ^
  -p 80:80 ^
  --restart unless-stopped ^
  smart-kitchen-frontend

echo ✅ 前端重新构建完成！
echo 🔍 验证服务状态...
timeout /t 5 /nobreak >nul
docker ps | findstr smart-kitchen-frontend-prod

pause