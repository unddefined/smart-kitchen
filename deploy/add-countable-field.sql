-- 纯SQL版本的迁移脚本
-- 可直接在PostgreSQL客户端工具中执行

-- 开始事务
BEGIN;

-- 添加countable字段到dishes表
ALTER TABLE dishes 
ADD COLUMN IF NOT EXISTS countable BOOLEAN DEFAULT FALSE;

-- 添加字段注释
COMMENT ON COLUMN dishes.countable IS '是否计数：TRUE表示需要按用餐人数计数，FALSE表示固定份量';

-- 提交事务
COMMIT;

-- 验证结果
SELECT '=== 字段添加验证 ===' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'dishes' AND column_name = 'countable';

SELECT '=== 当前countable状态统计 ===' as info;
SELECT 
    COUNT(*) as total_dishes,
    COUNT(CASE WHEN countable = TRUE THEN 1 END) as countable_dishes,
    COUNT(CASE WHEN countable = FALSE THEN 1 END) as fixed_dishes
FROM dishes;

SELECT '=== 默认为FALSE的菜品示例 ===' as info;
SELECT id, name, countable 
FROM dishes 
WHERE countable = FALSE 
ORDER BY name
LIMIT 10;

SELECT '迁移执行完成！所有菜品默认countable=False，需手动设置。' as result;