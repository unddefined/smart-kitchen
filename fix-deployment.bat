@echo off
setlocal enabledelayedexpansion

echo === Smart Kitchen Windows 部署工具 ===
echo.

REM 检查是否提供了服务器IP参数
if "%1"=="" (
    echo 用法: %0 [服务器IP]
    echo 示例: %0 8.145.34.30
    exit /b 1
)

set SERVER_IP=%1
echo 目标服务器: %SERVER_IP%
echo.

REM 创建临时脚本文件
echo 创建修复脚本...
(
echo #!/bin/bash
echo cd /root/smart-kitchen  # 修正路径
echo echo "开始修复部署..."
echo 
echo # 停止服务
echo docker-compose -f docker-compose.prod.yml down
echo 
echo # 清理容器
echo docker rm -f smart-kitchen-nginx-prod smart-kitchen-backend-prod smart-kitchen-postgres-prod 2^> /dev/null ^|^| true
echo 
echo # 重建服务
echo docker-compose -f docker-compose.prod.yml up -d --build
echo 
echo # 等待启动
echo sleep 15
echo 
echo # 检查状态
echo echo "容器状态:"
echo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo 
echo # 测试服务
echo echo "测试后端服务:"
echo curl -s -o /dev/null -w "状态码: %%{http_code}" http://localhost:3001/api/health
echo 
echo echo "测试Nginx代理:"
echo curl -s -o /dev/null -w "状态码: %%{http_code}" http://localhost/
echo 
echo echo "外部访问测试:"
echo curl -s -I http://%SERVER_IP%/ ^|^| echo "外部访问失败"
) > temp_fix_script.sh

echo 上传并执行修复脚本...
scp -i "C:/Users/66948/.ssh/PWA应用密钥.pem" temp_fix_script.sh root@%SERVER_IP%:/tmp/fix_script.sh
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@%SERVER_IP% "chmod +x /tmp/fix_script.sh && /tmp/fix_script.sh"

echo.
echo 删除临时文件...
del temp_fix_script.sh

echo.
echo === 修复完成 ===
echo 请在浏览器中访问: http://%SERVER_IP%
echo 如果仍有问题，请查看上面的执行日志

pause
