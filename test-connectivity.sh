
#!/bin/bash
echo "🧪 测试服务连通性..."

# 测试直接访问后端
echo "测试直接访问后端 (端口3001):"
curl -v http://localhost:3001/health 2>&1 | head -20

echo ""
echo "测试通过Nginx访问:"
curl -v http://localhost/health 2>&1 | head -20

echo ""
echo "测试API端点:"
curl -v http://localhost/api/dishes 2>&1 | head -20
