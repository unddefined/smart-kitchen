-- MVP文档表结构校验修正脚本
-- 解决校验报告中发现的问题

-- 1. 修正orders表状态枚举，添加MVP文档要求的状态
-- 注意：PostgreSQL中不能直接修改ENUM类型，需要重建

-- 首先检查当前状态值
SELECT DISTINCT status as current_statuses FROM orders ORDER BY status;

-- 创建新的状态检查约束（替换原有的ENUM）
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('created', 'started', 'serving', 'urged', 'done', 'cancelled'));

-- 验证约束添加成功
SELECT 'Orders status constraint updated' as message;

-- 2. 为dishes表添加recipe_id外键关联（保留原有recipe字段）
-- 检查是否已存在recipe_id字段
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dishes' AND column_name = 'recipe_id'
    ) THEN
        ALTER TABLE dishes ADD COLUMN recipe_id INTEGER REFERENCES recipes(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added recipe_id column to dishes table';
    ELSE
        RAISE NOTICE 'recipe_id column already exists in dishes table';
    END IF;
END $$;

-- 3. 验证关键表结构是否符合MVP要求
SELECT '=== MVP表结构验证 ===' as section;

-- 验证users表
SELECT 
    'users表' as table_name,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✓ 符合MVP要求'
        ELSE '✗ 不符合MVP要求'
    END as validation_result
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('id', 'name', 'tel', 'avatar', 'station', 'password');

-- 验证orders表核心字段
SELECT 
    'orders表核心字段' as check_item,
    CASE 
        WHEN COUNT(*) >= 9 THEN '✓ 包含MVP要求字段'
        ELSE '✗ 缺少必要字段'
    END as validation_result
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('id', 'hall_number', 'people_count', 'table_count', 'status', 'created_at', 'meal_time', 'remark');

-- 验证order_items表
SELECT 
    'order_items表' as table_name,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✓ 符合MVP要求'
        ELSE '✗ 不符合MVP要求'
    END as validation_result
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name IN ('id', 'order_id', 'dish_id', 'quantity', 'weight', 'status', 'priority', 'remark', 'served_at', 'created_at');

-- 验证dishes表
SELECT 
    'dishes表' as table_name,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✓ 包含MVP要求字段'
        ELSE '✗ 缺少必要字段'
    END as validation_result
FROM information_schema.columns 
WHERE table_name = 'dishes' 
AND column_name IN ('id', 'name', 'station_id', 'category_id', 'shortcut_code', 'countable', 'recipe_id', 'is_active');

-- 验证关键约束
SELECT '=== 关键约束验证 ===' as section;

-- 验证外键约束
SELECT 
    '外键约束完整性' as check_item,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✓ 外键约束完整'
        ELSE '✗ 外键约束不完整'
    END as validation_result
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
AND table_name IN ('dishes', 'order_items', 'recipes');

-- 验证状态约束
SELECT 
    '订单状态约束' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.check_constraints 
            WHERE constraint_name = 'orders_status_check'
        ) THEN '✓ 状态约束已更新'
        ELSE '✗ 状态约束需要更新'
    END as validation_result;

-- 4. 出餐逻辑相关验证
SELECT '=== 出餐逻辑验证 ===' as section;

-- 验证优先级范围
SELECT 
    '优先级范围检查' as check_item,
    CASE 
        WHEN MIN(priority) >= -1 AND MAX(priority) <= 3 THEN '✓ 优先级范围正确'
        ELSE '✗ 优先级范围异常'
    END as validation_result
FROM order_items;

-- 验证状态流转合理性
SELECT 
    '状态流转检查' as check_item,
    string_agg(DISTINCT status, ', ') as existing_states,
    CASE 
        WHEN COUNT(DISTINCT status) >= 5 THEN '✓ 状态种类充足'
        ELSE '⚠ 状态种类较少'
    END as validation_result
FROM order_items;

-- 5. 数据完整性检查
SELECT '=== 数据完整性检查 ===' as section;

-- 检查孤立记录
SELECT 
    '孤立菜品检查' as check_item,
    COUNT(*) as orphaned_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✓ 无孤立菜品'
        ELSE '⚠ 存在孤立菜品'
    END as validation_result
FROM dishes d
LEFT JOIN dish_categories dc ON d.category_id = dc.id
LEFT JOIN stations s ON d.station_id = s.id
WHERE dc.id IS NULL OR s.id IS NULL;

-- 检查订单数据完整性
SELECT 
    '订单数据完整性' as check_item,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status IN ('created', 'started', 'serving', 'urged', 'done', 'cancelled') THEN 1 END) as valid_orders,
    CASE 
        WHEN COUNT(*) = COUNT(CASE WHEN status IN ('created', 'started', 'serving', 'urged', 'done', 'cancelled') THEN 1 END) 
        THEN '✓ 订单状态合规'
        ELSE '⚠ 存在非法状态'
    END as validation_result
FROM orders;

-- 6. 性能相关检查
SELECT '=== 性能优化检查 ===' as section;

-- 检查关键索引
SELECT 
    '关键索引存在性' as check_item,
    COUNT(*) as existing_indexes,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✓ 关键索引完整'
        ELSE '⚠ 索引不完整'
    END as validation_result
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname IN (
    'idx_orders_status',
    'idx_order_items_status',
    'idx_order_items_priority',
    'idx_dishes_station_id',
    'idx_dishes_category_id',
    'idx_users_station'
);

-- 显示修正总结
SELECT '=== 修正总结 ===' as section;
SELECT 
    'MVP表结构校验修正完成' as message,
    NOW() as completion_time,
    '请检查上述验证结果' as next_step;

-- 最终验证报告
SELECT 
    '=== 最终验证报告 ===' as report_title,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN validation_result LIKE '✓%' THEN 1 END) as passed_checks,
    COUNT(CASE WHEN validation_result LIKE '⚠%' THEN 1 END) as warning_checks,
    COUNT(CASE WHEN validation_result LIKE '✗%' THEN 1 END) as failed_checks
FROM (
    -- 汇总所有检查结果
    (SELECT '表结构验证' as check_type, CASE WHEN COUNT(*) >= 6 THEN '✓ 通过' ELSE '✗ 失败' END as validation_result
     FROM information_schema.columns WHERE table_name IN ('users', 'orders', 'order_items', 'dishes', 'dish_categories', 'stations', 'recipes'))
    UNION ALL
    (SELECT '约束完整性' as check_type, CASE WHEN COUNT(*) >= 5 THEN '✓ 通过' ELSE '⚠ 警告' END as validation_result
     FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY')
    UNION ALL
    (SELECT '状态约束' as check_type, CASE WHEN EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name = 'orders_status_check') THEN '✓ 通过' ELSE '✗ 失败' END as validation_result)
    UNION ALL
    (SELECT '数据完整性' as check_type, CASE WHEN COUNT(*) = 0 THEN '✓ 通过' ELSE '⚠ 警告' END as validation_result
     FROM dishes d LEFT JOIN dish_categories dc ON d.category_id = dc.id LEFT JOIN stations s ON d.station_id = s.id WHERE dc.id IS NULL OR s.id IS NULL)
) validation_summary;