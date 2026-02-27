-- 添加start_time字段到orders表
-- 处理MVP文档新增的起菜时间字段需求

-- 1. 检查当前orders表结构
SELECT '=== 当前orders表结构检查 ===' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'start_time';

-- 2. 添加start_time字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'start_time'
    ) THEN
        ALTER TABLE orders ADD COLUMN start_time TIMESTAMP;
        RAISE NOTICE 'Added start_time column to orders table';
    ELSE
        RAISE NOTICE 'start_time column already exists';
    END IF;
END $$;

-- 3. 为打包订单设置start_time = meal_time
DO $$ 
DECLARE
    updated_count INTEGER;
BEGIN
    -- 更新打包订单的start_time字段
    UPDATE orders 
    SET start_time = meal_time 
    WHERE meal_type = '打包' 
    AND start_time IS NULL 
    AND meal_time IS NOT NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    RAISE NOTICE 'Updated % packing orders with start_time = meal_time', updated_count;
END $$;

-- 4. 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_orders_start_time ON orders(start_time);
CREATE INDEX IF NOT EXISTS idx_orders_meal_type_start_time ON orders(meal_type, start_time);

-- 5. 验证修正结果
SELECT '=== 修正后验证 ===' as section;

-- 检查字段是否存在
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'start_time';

-- 统计数据情况
SELECT '=== 数据统计 ===' as section;
SELECT 
    meal_type,
    COUNT(*) as total_orders,
    COUNT(start_time) as orders_with_start_time,
    CASE 
        WHEN meal_type = '打包' THEN 
            COUNT(CASE WHEN start_time = meal_time THEN 1 END) || '/' || COUNT(*) || ' 匹配'
        ELSE 
            'N/A'
    END as packing_time_match
FROM orders 
GROUP BY meal_type
ORDER BY meal_type;

-- 检查时间逻辑正确性
SELECT 
    '时间逻辑检查' as check_item,
    COUNT(*) as total_records,
    COUNT(CASE WHEN meal_type = '打包' AND start_time = meal_time THEN 1 END) as correct_packing_logic,
    COUNT(CASE WHEN meal_type = '打包' AND start_time != meal_time THEN 1 END) as incorrect_packing_logic,
    CASE 
        WHEN COUNT(CASE WHEN meal_type = '打包' AND start_time != meal_time THEN 1 END) = 0 
        THEN '✓ 逻辑正确'
        ELSE '⚠ 逻辑异常'
    END as logic_status
FROM orders 
WHERE meal_time IS NOT NULL;

-- 最终验证报告
SELECT '=== 最终验证报告 ===' as section;
SELECT 
    'start_time字段添加完成' as message,
    NOW() as completion_time,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'start_time') 
        THEN '✓ 字段已添加'
        ELSE '✗ 字段添加失败'
    END as result,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_start_time')
        THEN '✓ 索引已创建'
        ELSE '⚠ 索引未创建'
    END as index_status;