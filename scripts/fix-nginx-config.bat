@echo off
setlocal enabledelayedexpansion

echo 🔧 开始Nginx配置检查和修复...

REM 检查Docker环境
where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装或未在PATH中
    exit /b 1
)

where docker-compose >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose未安装或未在PATH中
    exit /b 1
)

REM 检查必要的文件
set CONFIG_FILES=nginx\nginx.conf nginx\conf.d\backend.conf docker-compose.prod.yml

for %%f in (%CONFIG_FILES%) do (
    if not exist "%%f" (
        echo ❌ 缺少配置文件: %%f
        exit /b 1
    )
)

echo ✅ 配置文件检查通过

REM 检查端口配置一致性
echo 📊 端口配置检查:

REM 获取Nginx配置中的端口
findstr "proxy_pass http://backend:" nginx\conf.d\backend.conf > temp_port.txt
for /f "tokens=2 delims=:" %%a in (temp_port.txt) do (
    set NGINX_PORT=%%a
    goto :got_nginx_port
)
:got_nginx_port

REM 获取Docker Compose中的端口
findstr "PORT:" docker-compose.prod.yml > temp_compose_port.txt
for /f "tokens=2 delims=:" %%a in (temp_compose_port.txt) do (
    set COMPOSE_PORT=%%a
    goto :got_compose_port
)
:got_compose_port

echo   - Nginx配置中的后端端口: %NGINX_PORT%
echo   - Docker Compose中的后端端口: %COMPOSE_PORT%

if "%NGINX_PORT%"=="%COMPOSE_PORT%" (
    echo ✅ 端口配置一致
) else (
    echo ⚠️  端口配置不一致，需要修复...
)

del temp_port.txt 2>nul
del temp_compose_port.txt 2>nul

REM 检查服务连通性
echo 🌐 服务连通性检查...

REM 检查Docker网络
docker network ls | findstr "backend-network" >nul
if %errorlevel% equ 0 (
    echo ✅ Docker网络存在
) else (
    echo ⚠️  Docker网络不存在，将自动创建
)

REM 检查容器状态
echo 🐳 容器状态检查:
docker-compose -f docker-compose.prod.yml ps

REM 检查后端服务健康状态
echo 🏥 后端服务健康检查:
curl -f http://localhost:3001/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端服务运行正常
) else (
    echo ❌ 后端服务无法访问
)

REM 检查Nginx配置语法
echo 📋 Nginx配置语法检查:
docker run --rm -v "%cd%\nginx:/etc/nginx" nginx:alpine nginx -t >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Nginx配置语法正确
) else (
    echo ❌ Nginx配置语法错误
    exit /b 1
)

REM 重启服务
echo 🔄 重启服务...
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

REM 最终验证
echo 🎯 最终验证:
curl -f http://localhost/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Nginx反向代理配置成功
    echo ✅ 服务可通过 http://localhost 访问
) else (
    echo ❌ Nginx反向代理仍有问题
    echo 📋 查看详细日志:
    docker-compose -f docker-compose.prod.yml logs nginx
    docker-compose -f docker-compose.prod.yml logs backend
)

echo 🔧 Nginx配置检查和修复完成
pause