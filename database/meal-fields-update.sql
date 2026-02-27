-- meal_time和meal_type字段更新修正脚本
-- 处理MVP文档更新：meal_time改为年月日时分格式，新增meal_type字段

-- 1. 检查当前orders表结构
SELECT '=== 当前orders表结构检查 ===' as section;
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('meal_time', 'meal_type')
ORDER BY ordinal_position;

-- 2. 添加meal_type字段（如果不存在）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'meal_type'
    ) THEN
        ALTER TABLE orders ADD COLUMN meal_type VARCHAR(10) CHECK (meal_type IN ('午', '晚', '打包'));
        RAISE NOTICE 'Added meal_type column to orders table';
    ELSE
        RAISE NOTICE 'meal_type column already exists';
    END IF;
END $$;

-- 3. 检查并可能扩展meal_time字段长度
DO $$ 
BEGIN
    -- 检查当前meal_time字段长度
    IF (SELECT character_maximum_length FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'meal_time') < 50 THEN
        ALTER TABLE orders ALTER COLUMN meal_time TYPE VARCHAR(50);
        RAISE NOTICE 'Extended meal_time column length to 50';
    ELSE
        RAISE NOTICE 'meal_time column length is adequate';
    END IF;
END $$;

-- 4. 数据迁移：将现有meal_time数据拆分为meal_time和meal_type
-- 假设现有格式为"2026-02-27午"或"2026-02-27晚"
DO $$ 
DECLARE
    rec RECORD;
    date_part VARCHAR(20);
    type_part VARCHAR(10);
BEGIN
    -- 只处理还没有meal_type数据的记录
    FOR rec IN 
        SELECT id, meal_time 
        FROM orders 
        WHERE meal_type IS NULL AND meal_time IS NOT NULL
    LOOP
        -- 提取日期部分（前10个字符）
        date_part := LEFT(rec.meal_time, 10);
        
        -- 提取类型部分（最后一个字符）
        type_part := RIGHT(rec.meal_time, 1);
        
        -- 验证类型是否有效
        IF type_part IN ('午', '晚') THEN
            -- 更新记录
            UPDATE orders 
            SET meal_time = date_part,
                meal_type = type_part
            WHERE id = rec.id;
            
            RAISE NOTICE 'Updated order %: date=%, type=%', rec.id, date_part, type_part;
        ELSE
            -- 如果无法解析，保持原样但设置默认类型
            UPDATE orders 
            SET meal_type = '午'
            WHERE id = rec.id;
            
            RAISE WARNING 'Could not parse meal_time for order %: %', rec.id, rec.meal_time;
        END IF;
    END LOOP;
END $$;

-- 5. 添加必要的索引
CREATE INDEX IF NOT EXISTS idx_orders_meal_type ON orders(meal_type);
CREATE INDEX IF NOT EXISTS idx_orders_meal_time ON orders(meal_time);

-- 6. 验证修正结果
SELECT '=== 修正后验证 ===' as section;

-- 检查字段是否存在和类型正确
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('meal_time', 'meal_type')
ORDER BY ordinal_position;

-- 检查约束
SELECT 
    constraint_name,
    constraint_type,
    CHECK (constraint_type = 'CHECK') as is_check_constraint
FROM information_schema.table_constraints 
WHERE table_name = 'orders' 
AND constraint_name LIKE '%meal%';

-- 统计数据情况
SELECT '=== 数据统计 ===' as section;
SELECT 
    meal_type,
    COUNT(*) as order_count,
    CASE 
        WHEN meal_type IS NULL THEN '⚠ 未设置'
        ELSE '✓ 已设置'
    END as status
FROM orders 
GROUP BY meal_type
ORDER BY meal_type;

-- 检查meal_time格式
SELECT 
    'meal_time格式检查' as check_item,
    COUNT(*) as total_records,
    COUNT(CASE WHEN LENGTH(meal_time) <= 10 THEN 1 END) as date_only_format,
    COUNT(CASE WHEN meal_time ~ '^\d{4}-\d{2}-\d{2}$' THEN 1 END) as valid_date_format,
    CASE 
        WHEN COUNT(CASE WHEN meal_time ~ '^\d{4}-\d{2}-\d{2}$' THEN 1 END) = COUNT(*) THEN '✓ 格式正确'
        ELSE '⚠ 格式需要调整'
    END as format_status
FROM orders 
WHERE meal_time IS NOT NULL;

-- 最终验证报告
SELECT '=== 最终验证报告 ===' as section;
SELECT 
    'meal_time和meal_type字段更新完成' as message,
    NOW() as completion_time,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'meal_type') 
        AND EXISTS (SELECT 1 FROM information_schema.check_constraints WHERE constraint_name LIKE '%meal_type%')
        THEN '✓ 修正成功'
        ELSE '✗ 修正失败'
    END as result;