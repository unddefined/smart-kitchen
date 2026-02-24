#!/bin/bash
# 出餐逻辑系统部署脚本

set -e

echo "开始部署出餐逻辑系统..."

# 数据库连接参数
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"smart_kitchen_dev"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}

# 1. 执行出餐逻辑核心脚本
echo "1. 部署出餐逻辑核心功能..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/serving-logic.sql

# 2. 执行存储过程脚本
echo "2. 部署出餐状态管理存储过程..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/serving-procedures.sql

# 3. 验证部署结果
echo "3. 验证部署结果..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'

-- 验证函数是否存在
SELECT '=== 验证出餐逻辑函数 ===' as info;
SELECT proname as function_name, 
       pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN ('calculate_dish_priority', 'update_order_item_priority', 
                'auto_adjust_order_priorities', 'complete_dish_preparation', 'serve_dish')
ORDER BY proname;

-- 验证视图是否存在
SELECT '=== 验证出餐逻辑视图 ===' as info;
SELECT viewname as view_name
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('dish_serving_order', 'order_item_serving_status', 'serving_alerts')
ORDER BY viewname;

-- 测试基本功能
SELECT '=== 测试优先级计算 ===' as info;
SELECT 
    '前菜测试' as test_case,
    calculate_dish_priority((SELECT id FROM dish_categories WHERE name = '前菜'), FALSE, 0) as result
UNION ALL
SELECT 
    '后来加菜测试' as test_case,
    calculate_dish_priority((SELECT id FROM dish_categories WHERE name = '前菜'), TRUE, 0) as result;

SELECT '=== 出餐逻辑部署完成 ===' as status;

EOF

echo "出餐逻辑系统部署完成！"

# 4. 显示使用说明
echo ""
echo "=== 使用说明 ==="
echo "1. 查看出餐顺序配置:"
echo "   SELECT * FROM dish_serving_order ORDER BY serving_sequence;"
echo ""
echo "2. 查看订单出餐状态:"
echo "   SELECT * FROM order_item_serving_status WHERE order_id = [订单ID];"
echo ""
echo "3. 查看出餐提醒:"
echo "   SELECT * FROM serving_alerts;"
echo ""
echo "4. 调用存储过程示例:"
echo "   SELECT auto_adjust_order_priorities([订单ID]);"
echo ""
echo "API接口文档请查看: docs/serving-api-design.md"