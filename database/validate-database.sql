-- 数据库结构和数据完整性验证脚本
-- 全面检查表结构、约束、索引和数据完整性

-- 验证表结构完整性
SELECT '=== 表结构验证 ===' as section;

-- 检查核心表是否存在
SELECT 
    table_name,
    '存在' as status,
    '✓' as validation_result
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stations', 'dish_categories', 'dishes', 'orders', 'order_items', 'users', 'recipes')
ORDER BY table_name;

-- 检查缺失的表
SELECT 
    unnest(ARRAY['stations', 'dish_categories', 'dishes', 'orders', 'order_items', 'users', 'recipes']) as expected_table,
    CASE 
        WHEN table_name IS NULL THEN '✗ 缺失'
        ELSE '✓ 存在'
    END as validation_result
FROM (
    SELECT table_name
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('stations', 'dish_categories', 'dishes', 'orders', 'order_items', 'users', 'recipes')
) existing_tables
RIGHT JOIN (
    SELECT unnest(ARRAY['stations', 'dish_categories', 'dishes', 'orders', 'order_items', 'users', 'recipes']) as table_name
) expected_tables ON existing_tables.table_name = expected_tables.table_name
ORDER BY expected_table;

-- 验证表结构详细信息
SELECT '=== 表结构详细验证 ===' as section;

-- 检查每个表的列数和关键字段
SELECT 
    table_name,
    COUNT(*) as column_count,
    CASE 
        WHEN bool_or(column_name = 'id' AND is_nullable = 'NO') THEN '✓ 有主键'
        ELSE '✗ 缺少主键'
    END as primary_key_check,
    CASE 
        WHEN bool_or(column_name = 'created_at') THEN '✓ 有创建时间'
        ELSE '✗ 缺少创建时间'
    END as created_at_check,
    CASE 
        WHEN bool_or(column_name = 'updated_at') THEN '✓ 有更新时间'
        ELSE '✗ 缺少更新时间'
    END as updated_at_check
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('stations', 'dish_categories', 'dishes', 'orders', 'order_items', 'users', 'recipes')
GROUP BY table_name
ORDER BY table_name;

-- 验证外键约束
SELECT '=== 外键约束验证 ===' as section;
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    '✓ 存在外键约束' as validation_result
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 验证索引
SELECT '=== 索引验证 ===' as section;
SELECT 
    tablename,
    indexname,
    indexdef,
    '✓ 索引存在' as validation_result
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname IN (
    'idx_stations_name',
    'idx_dish_categories_display_order', 'idx_dish_categories_name',
    'idx_dishes_station_id', 'idx_dishes_category_id', 'idx_dishes_name', 'idx_dishes_shortcut_code', 'idx_dishes_active',
    'idx_orders_status', 'idx_orders_created_at', 'idx_orders_hall_number', 'idx_orders_order_number',
    'idx_order_items_order_id', 'idx_order_items_dish_id', 'idx_order_items_status', 'idx_order_items_priority', 'idx_order_items_created_at',
    'idx_users_username', 'idx_users_station', 'idx_users_role', 'idx_users_active',
    'idx_recipes_dish_id', 'idx_recipes_name', 'idx_recipes_active',
    'idx_orders_status_created', 'idx_order_items_status_priority', 'idx_order_items_order_status'
)
ORDER BY tablename, indexname;

-- 验证触发器
SELECT '=== 触发器验证 ===' as section;
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name,
    '✓ 触发器存在' as validation_result
FROM pg_trigger 
WHERE tgname LIKE 'update_%_updated_at'
ORDER BY tgrelid::regclass;

-- 验证菜品分类数据
SELECT '=== 菜品分类验证 ===' as section;
SELECT 
    id,
    name,
    description,
    display_order,
    CASE 
        WHEN name = '凉菜' AND display_order = 1 THEN '✓ 正确'
        WHEN name = '前菜' AND display_order = 2 THEN '✓ 正确'
        WHEN name = '中菜' AND display_order = 3 THEN '✓ 正确'
        WHEN name = '点心' AND display_order = 4 THEN '✓ 正确'
        WHEN name = '蒸菜' AND display_order = 5 THEN '✓ 正确'
        WHEN name = '后菜' AND display_order = 6 THEN '✓ 正确'
        WHEN name = '尾菜' AND display_order = 7 THEN '✓ 正确'
        ELSE '✗ 错误'
    END as validation_status
FROM dish_categories
ORDER BY display_order;

-- 验证工位数据
SELECT '=== 工位验证 ===' as section;
SELECT 
    id,
    name,
    CASE 
        WHEN name IN ('热菜', '打荷', '凉菜', '蒸煮', '点心', '切配') THEN '✓ 存在'
        ELSE '✗ 不存在'
    END as validation_status
FROM stations
ORDER BY id;

-- 验证菜品分配和优先级
SELECT '=== 菜品分配验证 ===' as section;
SELECT 
    dc.name as 分类,
    COUNT(d.id) as 菜品数量,
    STRING_AGG(DISTINCT s.name, ', ') as 工位,
    CASE dc.name
        WHEN '凉菜' THEN '凉菜工位'
        WHEN '前菜' THEN '热菜工位'
        WHEN '中菜' THEN '热菜工位'
        WHEN '点心' THEN '点心工位'
        WHEN '蒸菜' THEN '蒸煮工位'
        WHEN '后菜' THEN '热菜工位'
        WHEN '尾菜' THEN '热菜工位'
        ELSE '未知'
    END as 应用工位,
    CASE dc.name
        WHEN '前菜' THEN '优先级3(红色)'
        WHEN '凉菜' THEN '优先级3(红色-MVP)'
        WHEN '中菜' THEN '优先级2(黄色)'
        WHEN '点心' THEN '优先级2(黄色-MVP)'
        WHEN '蒸菜' THEN '优先级2(黄色-MVP)'
        WHEN '后菜' THEN '优先级1(绿色)'
        WHEN '尾菜' THEN '优先级1(绿色)'
        ELSE '优先级0(灰色)'
    END as 优先级规则
FROM dish_categories dc
LEFT JOIN dishes d ON dc.id = d.category_id
LEFT JOIN stations s ON d.station_id = s.id
GROUP BY dc.id, dc.name, dc.display_order
ORDER BY dc.display_order;

-- 验证计数菜品
SELECT '=== 计数菜品验证 ===' as section;
SELECT 
    d.name as 菜品名称,
    dc.name as 分类,
    d.countable as 需要计数,
    CASE 
        WHEN d.countable = TRUE THEN '✓ 符合'
        ELSE '✗ 不符合'
    END as 验证结果
FROM dishes d
JOIN dish_categories dc ON d.category_id = dc.id
WHERE d.name LIKE '%（计数）'
ORDER BY dc.display_order, d.name;

-- 验证MVP视图
SELECT '=== MVP视图验证 ===' as section;
SELECT 
    viewname,
    '存在' as status
FROM pg_views 
WHERE viewname IN ('dish_serving_order_mvp', 'order_item_serving_status_mvp', 'serving_alerts_mvp')
ORDER BY viewname;

-- 验证MVP函数
SELECT '=== MVP函数验证 ===' as section;
SELECT 
    proname as function_name,
    '存在' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN ('calculate_dish_priority_mvp', 'detect_urgent_dishes_mvp', 'auto_adjust_priorities_for_order', 'complete_dish_prep_mvp', 'serve_dish_mvp')
ORDER BY proname;

-- 数据完整性检查
SELECT '=== 数据完整性检查 ===' as section;

-- 检查孤立的菜品记录
SELECT 
    '孤立菜品检查' as check_type,
    COUNT(*) as problem_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ 无孤立菜品'
        ELSE '✗ 发现孤立菜品'
    END as result
FROM dishes d
LEFT JOIN dish_categories dc ON d.category_id = dc.id
LEFT JOIN stations s ON d.station_id = s.id
WHERE dc.id IS NULL OR s.id IS NULL;

-- 检查订单数据完整性
SELECT 
    '订单数据检查' as check_type,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'created' THEN 1 END) as created_orders,
    COUNT(CASE WHEN status = 'started' THEN 1 END) as started_orders,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders
FROM orders;

-- 显示验证总结
SELECT '=== 验证总结 ===' as section;
SELECT 
    '数据库结构验证完成' as message,
    NOW() as timestamp,
    '请检查以上各项验证结果' as notice;

-- 最终状态报告
SELECT 
    '=== 最终验证报告 ===' as report_title,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN validation_result LIKE '✓%' THEN 1 END) as passed_checks,
    COUNT(CASE WHEN validation_result LIKE '✗%' THEN 1 END) as failed_checks,
    ROUND(COUNT(CASE WHEN validation_result LIKE '✓%' THEN 1 END) * 100.0 / COUNT(*), 2) as pass_rate
FROM (
    -- 统计各种检查结果
    (SELECT '表存在检查' as check_type, CASE WHEN COUNT(*) = 7 THEN '✓ 通过' ELSE '✗ 失败' END as validation_result
     FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('stations', 'dish_categories', 'dishes', 'orders', 'order_items', 'users', 'recipes'))
    UNION ALL
    (SELECT '外键约束检查' as check_type, CASE WHEN COUNT(*) >= 5 THEN '✓ 通过' ELSE '✗ 失败' END as validation_result
     FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public')
    UNION ALL
    (SELECT '索引检查' as check_type, CASE WHEN COUNT(*) >= 20 THEN '✓ 通过' ELSE '✗ 失败' END as validation_result
     FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%')
    UNION ALL
    (SELECT '触发器检查' as check_type, CASE WHEN COUNT(*) = 7 THEN '✓ 通过' ELSE '✗ 失败' END as validation_result
     FROM pg_trigger WHERE tgname LIKE 'update_%_updated_at')
) validation_results;