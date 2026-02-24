#!/bin/bash
# 数据库连接脚本

# 服务器信息
SERVER_IP="8.145.34.30"
SSH_KEY="C:/Users/66948/.ssh/PWA应用密钥.pem"
SSH_USER="root"

# 数据库信息（从环境变量获取）
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="smart_kitchen_prod"
DB_USER="smart_kitchen_user"
DB_PASSWORD="13814349230cX"

echo "🚀 连接到阿里云服务器数据库..."
echo "服务器: $SERVER_IP"
echo "数据库: $DB_NAME"
echo ""

# 检查SSH密钥是否存在
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH密钥文件不存在: $SSH_KEY"
    echo "请确认密钥文件路径正确"
    exit 1
fi

# 连接到服务器并执行数据库操作
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << 'EOF'

echo "✅ 成功连接到服务器"
echo "当前时间: $(date)"
echo "服务器负载: $(uptime)"
echo ""

# 检查Docker和PostgreSQL容器状态
echo "🐳 检查Docker容器状态..."
docker ps | grep postgres

echo ""
echo "📊 数据库连接测试..."
# 使用环境变量连接数据库
if command -v psql &> /dev/null; then
    # 如果直接有psql命令
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();"
    echo ""
    echo "📋 数据库表统计..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    "
else
    # 如果通过Docker连接
    echo "通过Docker连接PostgreSQL..."
    docker exec smart-kitchen-postgres-prod psql -U $DB_USER -d $DB_NAME -c "SELECT version();"
    echo ""
    echo "📋 数据库表统计..."
    docker exec smart-kitchen-postgres-prod psql -U $DB_USER -d $DB_NAME -c "
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    "
fi

echo ""
echo "✅ 数据库连接测试完成"

EOF

if [ $? -eq 0 ]; then
    echo "✅ 连接成功完成"
else
    echo "❌ 连接失败，请检查配置"
fi