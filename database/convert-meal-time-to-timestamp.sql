-- meal_time字段类型转换脚本
-- 将VARCHAR(50)类型安全转换为TIMESTAMP类型

-- 1. 预检查：分析现有数据格式
SELECT '=== 现有数据格式分析 ===' as section;
SELECT 
    CASE 
        WHEN meal_time ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}' THEN '完整时间格式'
        WHEN meal_time ~ '^\d{4}-\d{2}-\d{2}$' THEN '仅日期格式'
        WHEN meal_time IS NULL THEN '空值'
        ELSE '其他格式'
    END as format_type,
    COUNT(*) as count,
    MIN(meal_time) as sample_min,
    MAX(meal_time) as sample_max
FROM orders 
GROUP BY 
    CASE 
        WHEN meal_time ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}' THEN '完整时间格式'
        WHEN meal_time ~ '^\d{4}-\d{2}-\d{2}$' THEN '仅日期格式'
        WHEN meal_time IS NULL THEN '空值'
        ELSE '其他格式'
    END
ORDER BY count DESC;

-- 2. 备份原数据
SELECT '=== 创建数据备份 ===' as section;
CREATE TABLE IF NOT EXISTS orders_meal_time_backup AS 
SELECT id, meal_time, created_at as backup_time
FROM orders 
WHERE FALSE; -- 创建表结构但不复制数据

-- 清空并更新备份表
TRUNCATE TABLE orders_meal_time_backup;
INSERT INTO orders_meal_time_backup (id, meal_time, backup_time)
SELECT id, meal_time, NOW()
FROM orders 
WHERE meal_time IS NOT NULL;

SELECT '备份完成，共备份 ' || COUNT(*) || ' 条记录' as backup_status
FROM orders_meal_time_backup;

-- 3. 添加新TIMESTAMP字段
SELECT '=== 添加新时间字段 ===' as section;
ALTER TABLE orders ADD COLUMN meal_time_ts TIMESTAMP;

-- 4. 数据迁移转换
SELECT '=== 执行数据迁移 ===' as section;
UPDATE orders 
SET meal_time_ts = CASE 
    -- 完整时间格式 YYYY-MM-DD HH:MM
    WHEN meal_time ~ '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}' THEN 
        meal_time::TIMESTAMP
    -- 仅日期格式 YYYY-MM-DD，补零点时间
    WHEN meal_time ~ '^\d{4}-\d{2}-\d{2}$' THEN 
        (meal_time || ' 00:00')::TIMESTAMP
    -- 无法解析的格式，使用创建时间
    ELSE 
        created_at
END
WHERE meal_time IS NOT NULL;

-- 5. 验证迁移结果
SELECT '=== 迁移结果验证 ===' as section;
SELECT 
    COUNT(*) as total_records,
    COUNT(meal_time_ts) as migrated_records,
    COUNT(*) - COUNT(meal_time_ts) as failed_records,
    ROUND((COUNT(meal_time_ts) * 100.0 / COUNT(*)), 2) as success_rate
FROM orders;

-- 检查迁移质量
SELECT 
    '时间范围检查' as check_item,
    MIN(meal_time_ts) as earliest_time,
    MAX(meal_time_ts) as latest_time,
    CASE 
        WHEN MIN(meal_time_ts) < NOW() - INTERVAL '1 year' OR MAX(meal_time_ts) > NOW() + INTERVAL '1 day' 
        THEN '⚠ 时间范围异常'
        ELSE '✓ 时间范围正常'
    END as validation_result
FROM orders 
WHERE meal_time_ts IS NOT NULL;

-- 6. 性能对比测试
SELECT '=== 性能测试 ===' as section;

-- 测试VARCHAR查询性能（模拟）
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT COUNT(*) FROM orders 
WHERE meal_time >= '2026-02-27 12:00' 
AND meal_time <= '2026-02-27 14:00';

-- 测试TIMESTAMP查询性能
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT COUNT(*) FROM orders 
WHERE meal_time_ts BETWEEN '2026-02-27 12:00' AND '2026-02-27 14:00';

-- 7. 字段替换（谨慎执行）
SELECT '=== 字段替换准备 ===' as section;
SELECT '请手动执行以下步骤以完成替换:' as instruction;
SELECT '1. 确认迁移结果无误' as step1;
SELECT '2. 执行: ALTER TABLE orders DROP COLUMN meal_time;' as step2;
SELECT '3. 执行: ALTER TABLE orders RENAME COLUMN meal_time_ts TO meal_time;' as step3;
SELECT '4. 添加约束: ALTER TABLE orders ALTER COLUMN meal_time SET NOT NULL;' as step4;
SELECT '5. 创建索引: CREATE INDEX idx_orders_meal_time ON orders(meal_time);' as step5;

-- 8. TIMESTAMP优势演示
SELECT '=== TIMESTAMP功能演示 ===' as section;

-- 时间函数使用示例
SELECT 
    '当前时间函数使用' as demo_type,
    EXTRACT(HOUR FROM meal_time_ts) as hour,
    EXTRACT(DOW FROM meal_time_ts) as day_of_week,
    EXTRACT(MONTH FROM meal_time_ts) as month,
    meal_time_ts::DATE as date_only,
    meal_time_ts::TIME as time_only
FROM orders 
WHERE meal_time_ts IS NOT NULL 
LIMIT 5;

-- 时间范围统计
SELECT 
    '按时段统计' as stats_type,
    EXTRACT(HOUR FROM meal_time_ts) as hour,
    COUNT(*) as order_count,
    ROUND(AVG(people_count), 1) as avg_people
FROM orders 
WHERE meal_time_ts IS NOT NULL
GROUP BY EXTRACT(HOUR FROM meal_time_ts)
ORDER BY hour;

-- 9. 最终验证查询
SELECT '=== 最终验证 ===' as section;
SELECT 
    'TIMESTAMP转换完成' as status,
    NOW() as completion_time,
    (SELECT COUNT(*) FROM orders WHERE meal_time_ts IS NOT NULL) as converted_records,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'meal_time_ts')
        THEN '✓ 新字段已创建'
        ELSE '✗ 新字段未创建'
    END as field_status;