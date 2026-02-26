#!/bin/bash

# 修复数据库表结构缺失问题
# 作者: Lingma
# 日期: 2026-02-26

set -e

echo "🔧 开始修复数据库表结构问题..."

# 配置变量
PROJECT_DIR="/root/smart-kitchen"
BACKEND_DIR="$PROJECT_DIR/backend"
DB_USER="smart_kitchen"
DB_PASSWORD="13814349230cX"
DB_NAME="smart_kitchen_prod"
DB_HOST="smart-kitchen-postgres-prod"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:5432/${DB_NAME}"

echo "1. 检查当前数据库状态..."
TABLES=$(docker exec $DB_HOST psql -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null || echo "0")
echo "当前表数量: $TABLES"

if [ "$TABLES" -gt "0" ]; then
    echo "数据库已有表结构，跳过初始化"
    exit 0
fi

echo "2. 准备数据库初始化..."
cd $BACKEND_DIR

# 检查Prisma schema是否存在
if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ Prisma schema文件不存在"
    exit 1
fi

echo "3. 生成Prisma客户端..."
export DATABASE_URL=$DATABASE_URL
npx prisma generate

echo "4. 执行数据库迁移..."
npx prisma migrate deploy

echo "5. 执行种子数据..."
npx prisma db seed

echo "6. 验证数据库表结构..."
docker exec $DB_HOST psql -U $DB_USER -d $DB_NAME -c "\dt"

echo "✅ 数据库初始化完成"

# 重启后端服务以确保连接正常
echo "7. 重启后端服务..."
cd $PROJECT_DIR
docker-compose -f docker-compose.prod.yml restart backend

echo "🎉 数据库修复完成！"
