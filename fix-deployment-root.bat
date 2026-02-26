@echo off
setlocal enabledelayedexpansion

echo === Smart Kitchen Windows 修复工具 ===
echo.

set SERVER_IP=8.145.34.30

echo 创建修复脚本...
(
echo #!/bin/bash
echo cd /root/smart-kitchen
echo echo "开始修复部署..."
echo 
echo # 停止服务
echo docker-compose -f docker-compose.prod.yml down
echo 
echo # 清理端口
echo sudo fuser -k 80/tcp
echo sudo fuser -k 3001/tcp
echo sudo fuser -k 5432/tcp
echo 
echo # 清理容器
echo docker rm -f smart-kitchen-nginx-prod smart-kitchen-backend-prod smart-kitchen-postgres-prod
echo 
echo # 重建服务
echo docker-compose -f docker-compose.prod.yml up -d --build
echo 
echo # 等待启动
echo sleep 20
echo 
echo # 检查状态
echo echo "=== 容器状态 ==="
echo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo 
echo # 测试服务
echo echo "=== 服务测试 ==="
echo echo "后端健康检查:"
echo curl -s -o /dev/null -w "状态码: %%{http_code}" http://localhost:3001/api/health
echo echo "Nginx代理测试:"
echo curl -s -o /dev/null -w "状态码: %%{http_code}" http://localhost/
echo echo "外部访问测试:"
echo curl -s -o /dev/null -w "状态码: %%{http_code}" http://%SERVER_IP%/
) > temp_fix_root.sh

echo 上传并执行修复脚本...
scp -i "C:/Users/66948/.ssh/PWA应用密钥.pem" temp_fix_root.sh root@%SERVER_IP%:/tmp/fix_script.sh
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@%SERVER_IP% "chmod +x /tmp/fix_script.sh && /tmp/fix_script.sh"

echo.
echo 删除临时文件...
del temp_fix_root.sh

echo.
echo === 修复完成 ===
echo 请在浏览器中访问: http://%SERVER_IP%

pause
