#!/bin/bash
# 菜品分类和菜品数据录入执行脚本

set -e

echo "开始执行菜品分类和菜品数据录入..."

# 数据库连接参数
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"smart_kitchen_dev"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}

# 执行菜品分类表创建
echo "1. 创建菜品分类表..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/create-dish-categories.sql

# 执行菜品数据录入
echo "2. 录入菜品数据..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/insert-dishes.sql

echo "菜品分类和数据录入完成！"

# 显示验证结果
echo "=== 验证结果 ==="
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    dc.name as 分类,
    COUNT(d.id) as 菜品数量
FROM dish_categories dc
LEFT JOIN dishes d ON dc.id = d.category_id
GROUP BY dc.id, dc.name
ORDER BY dc.display_order;
"