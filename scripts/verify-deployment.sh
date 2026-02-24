#!/bin/bash

# 智能厨房系统部署验证脚本

echo "🔍 验证智能厨房系统部署状态..."

# 检查Docker容器状态
echo "🐳 检查Docker容器..."
docker ps | grep smart-kitchen

# 检查PostgreSQL容器
echo "🗄️ 检查PostgreSQL数据库..."
if docker ps | grep -q smart-kitchen-postgres; then
    echo "✅ PostgreSQL容器运行正常"
    
    # 测试数据库连接
    DB_PASS=$(cat /opt/smart-kitchen/db_password.txt 2>/dev/null)
    if [ ! -z "$DB_PASS" ]; then
        echo "🧪 测试数据库连接..."
        docker exec smart-kitchen-postgres pg_isready -U smart_kitchen_user -d smart_kitchen_prod && echo "✅ 数据库连接正常" || echo "❌ 数据库连接失败"
    fi
else
    echo "❌ PostgreSQL容器未运行"
fi

# 检查后端服务
echo "🚀 检查后端服务..."
if docker ps | grep -q smart-kitchen-backend; then
    echo "✅ 后端容器运行正常"
    
    # 测试API健康检查
    echo "🧪 测试API健康检查..."
    curl -f http://localhost:3000/api/health && echo -e "\n✅ API健康检查通过" || echo "❌ API健康检查失败"
else
    echo "❌ 后端容器未运行"
fi

# 检查Nginx服务
echo "🌐 检查Nginx服务..."
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx服务运行正常"
    
    # 测试Nginx配置
    nginx -t && echo "✅ Nginx配置正确" || echo "❌ Nginx配置错误"
else
    echo "❌ Nginx服务未运行"
fi

# 检查端口监听
echo "🔌 检查端口监听..."
netstat -tlnp | grep -E ":(80|443|3000|5432)" | while read line; do
    echo "  $line"
done

# 显示部署信息
echo ""
echo "📋 部署信息摘要:"
echo "=================="
echo "服务器IP: $(hostname -I | awk '{print $1}')"
echo "数据库用户: smart_kitchen_user"
echo "数据库名称: smart_kitchen_prod"
echo ""
echo "🔗 访问地址:"
echo "  API接口: http://$(hostname -I | awk '{print $1}'):3000/api/"
echo "  健康检查: http://$(hostname -I | awk '{print $1}'):3000/api/health"
echo "  Nginx代理: http://$(hostname -I | awk '{print $1}')/api/"

echo ""
echo "✅ 部署验证完成！"