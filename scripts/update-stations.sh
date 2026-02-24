#!/bin/bash
# 工位管理执行脚本

set -e

echo "开始执行工位标准化更新..."

# 数据库连接参数
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"smart_kitchen_dev"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}

# 执行工位管理脚本
echo "执行工位标准化..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/manage-stations.sql

echo "工位更新完成！"
echo "您可以运行以下命令验证结果："
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \"SELECT id, name FROM stations ORDER BY id;\""