@echo off
:: 智能厨房系统云数据库菜品数据管理脚本

echo ==========================================
echo 🍽️  智能厨房系统云数据库菜品管理
echo ==========================================
echo.

echo 请选择操作：
echo 1. 录入菜品数据到云数据库
echo 2. 验证云数据库数据完整性
echo 3. 处理历史遗留菜品数据
echo 4. 生成数据录入总结报告
echo 5. 执行完整数据管理流程
echo 6. 退出
echo.

set /p choice=请输入选项 (1-6): 

cd /d "%~dp0\backend"

if "%choice%"=="1" (
    echo.
    echo 🔄 开始录入菜品数据...
    node setup-cloud-dish-data.js
) else if "%choice%"=="2" (
    echo.
    echo 🔍 开始验证数据完整性...
    node verify-cloud-dish-data.js
) else if "%choice%"=="3" (
    echo.
    echo 🔧 开始处理遗留数据...
    node handle-legacy-dishes.js
) else if "%choice%"=="4" (
    echo.
    echo 📊 生成总结报告...
    node generate-summary-report.js
) else if "%choice%"=="5" (
    echo.
    echo 🚀 执行完整数据管理流程...
    echo.
    echo 1️⃣ 录入菜品数据...
    node setup-cloud-dish-data.js
    echo.
    echo 2️⃣ 处理遗留数据...
    node handle-legacy-dishes.js
    echo.
    echo 3️⃣ 验证数据完整性...
    node verify-cloud-dish-data.js
    echo.
    echo 4️⃣ 生成总结报告...
    node generate-summary-report.js
) else if "%choice%"=="6" (
    echo 再见！
    exit /b 0
) else (
    echo 无效选项，请重新运行脚本
    pause
    exit /b 1
)

echo.
pause