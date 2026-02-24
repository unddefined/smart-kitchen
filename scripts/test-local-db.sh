#!/bin/bash
# 本地开发环境数据库连接测试

echo "🔧 本地开发环境数据库连接测试"
echo ""

# 从环境变量读取配置
if [ -f "backend/.env" ]; then
    source backend/.env
    echo "从 backend/.env 加载配置"
elif [ -f ".env" ]; then
    source .env
    echo "从 .env 加载配置"
else
    echo "❌ 未找到环境配置文件"
    exit 1
fi

# 解析数据库连接字符串
if [[ $DATABASE_URL ]]; then
    # 从 DATABASE_URL 解析连接信息
    DB_USER=$(echo $DATABASE_URL | sed -e 's/.*:\/\/\([^:]*\):.*/\1/')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -e 's/.*:\([^@]*\)@.*/\1/')
    DB_HOST=$(echo $DATABASE_URL | sed -e 's/.*@\(.*\):.*/\1/')
    DB_PORT=$(echo $DATABASE_URL | sed -e 's/.*:\([0-9]*\)\/.*/\1/')
    DB_NAME=$(echo $DATABASE_URL | sed -e 's/.*\/\([^?]*\)?.*/\1/')
else
    echo "❌ 未找到 DATABASE_URL 配置"
    exit 1
fi

echo "数据库配置:"
echo "  主机: $DB_HOST"
echo "  端口: $DB_PORT" 
echo "  数据库: $DB_NAME"
echo "  用户: $DB_USER"
echo ""

# 测试连接
echo "🧪 测试数据库连接..."
if command -v psql &> /dev/null; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ 数据库连接成功"
        echo ""
        echo "📋 数据库信息:"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
            SELECT 
                current_database() as database_name,
                current_user as username,
                inet_client_addr() as client_ip,
                version() as postgres_version;
        "
        echo ""
        echo "📊 表统计:"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
            SELECT 
                COUNT(*) as table_count,
                pg_size_pretty(pg_database_size(current_database())) as database_size
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        "
    else
        echo "❌ 数据库连接失败"
        echo "请检查:"
        echo "  1. 数据库服务是否运行"
        echo "  2. 连接参数是否正确"
        echo "  3. 网络连接是否正常"
    fi
else
    echo "❌ 未找到 psql 命令"
    echo "请安装 PostgreSQL 客户端工具"
fi