@echo off
setlocal enabledelayedexpansion

echo 🚀 开始部署数据库...

REM 服务器配置
set SERVER_IP=8.145.34.30
set SSH_KEY=C:/Users/66948/.ssh/PWA应用密钥.pem
set DB_USER=smart_kitchen
set DB_PASSWORD=13814349230cX
set DB_NAME=smart_kitchen_prod
set DB_HOST=localhost
set DB_PORT=5432

REM 上传SQL文件到服务器
echo 📤 上传数据库初始化文件...
scp -i "%SSH_KEY%" .\backend\prisma\init-database.sql root@%SERVER_IP%:/tmp/

if %errorlevel% neq 0 (
    echo ❌ 文件上传失败!
    exit /b 1
)

REM 在服务器上执行数据库初始化
echo 🔧 在服务器上初始化数据库...
ssh -i "%SSH_KEY%" root@%SERVER_IP% ^
    "export PGPASSWORD='%DB_PASSWORD%' && ^
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f /tmp/init-database.sql && ^
    echo '📊 验证初始化数据...' && ^
    psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c \"
        SELECT '工位数量: ' || COUNT(*) FROM stations;
        SELECT '菜品分类数量: ' || COUNT(*) FROM dish_categories;
        SELECT '菜谱数量: ' || COUNT(*) FROM recipes;
        SELECT '菜品数量: ' || COUNT(*) FROM dishes;
        SELECT '订单数量: ' || COUNT(*) FROM orders;
    \" && ^
    rm /tmp/init-database.sql"

if %errorlevel% equ 0 (
    echo 🎉 数据库部署完成!
    echo.
    echo 📋 部署信息:
    echo    • 服务器: %SERVER_IP%
    echo    • 数据库: %DB_NAME%
    echo    • 用户: %DB_USER%
    echo.
    echo 🔧 下一步操作:
    echo    1. 更新后端环境配置
    echo    2. 重启后端服务
    echo    3. 测试API接口
) else (
    echo 💥 部署过程中出现错误!
    exit /b 1
)

pause