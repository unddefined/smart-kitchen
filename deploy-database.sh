#!/bin/bash

# 厨房任务调度系统数据库部署脚本
# 用于在远程服务器上初始化数据库结构

echo "🚀 开始部署数据库..."

# 服务器配置
SERVER_IP="8.145.34.30"
SSH_KEY="C:/Users/66948/.ssh/PWA应用密钥.pem"
DB_USER="smart_kitchen"
DB_PASSWORD="13814349230cX"
DB_NAME="smart_kitchen_prod"
DB_HOST="localhost"
DB_PORT="5432"

# 上传SQL文件到服务器
echo "📤 上传数据库初始化文件..."
scp -i "$SSH_KEY" ./backend/prisma/init-database.sql root@$SERVER_IP:/tmp/

# 在服务器上执行数据库初始化
echo "🔧 在服务器上初始化数据库..."
ssh -i "$SSH_KEY" root@$SERVER_IP << EOF
    echo "连接到PostgreSQL数据库..."
    
    # 设置PostgreSQL环境变量
    export PGPASSWORD="$DB_PASSWORD"
    
    # 执行SQL脚本
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /tmp/init-database.sql
    
    if [ \$? -eq 0 ]; then
        echo "✅ 数据库初始化成功!"
        
        # 验证数据
        echo "📊 验证初始化数据..."
        psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
            SELECT '工位数量: ' || COUNT(*) FROM stations;
            SELECT '菜品分类数量: ' || COUNT(*) FROM dish_categories;
            SELECT '菜谱数量: ' || COUNT(*) FROM recipes;
            SELECT '菜品数量: ' || COUNT(*) FROM dishes;
            SELECT '订单数量: ' || COUNT(*) FROM orders;
        "
    else
        echo "❌ 数据库初始化失败!"
        exit 1
    fi
    
    # 清理临时文件
    rm /tmp/init-database.sql
EOF

if [ $? -eq 0 ]; then
    echo "🎉 数据库部署完成!"
    echo ""
    echo "📋 部署信息:"
    echo "   • 服务器: $SERVER_IP"
    echo "   • 数据库: $DB_NAME"
    echo "   • 用户: $DB_USER"
    echo ""
    echo "🔧 下一步操作:"
    echo "   1. 更新后端环境配置"
    echo "   2. 重启后端服务"
    echo "   3. 测试API接口"
else
    echo "💥 部署过程中出现错误!"
    exit 1
fi