-- 测试countable字段功能的SQL脚本（手动标记模式）

-- 1. 查看所有菜品及其countable状态
SELECT 
    id,
    name,
    shortcut_code,
    CASE 
        WHEN countable = TRUE THEN '需要按人数计数'
        WHEN countable = FALSE THEN '固定份量'
        ELSE '未设置'
    END as count_type,
    countable
FROM dishes 
ORDER BY countable DESC, name;

-- 2. 统计各类菜品数量
SELECT 
    CASE 
        WHEN countable = TRUE THEN '需要按人数计数'
        WHEN countable = FALSE THEN '固定份量'
        ELSE '未设置'
    END as count_type,
    COUNT(*) as dish_count
FROM dishes 
GROUP BY countable
ORDER BY countable DESC;

-- 3. 查看固定份量菜品列表（默认状态）
SELECT '=== 固定份量的菜品（默认） ===' as category;
SELECT id, name, shortcut_code, countable 
FROM dishes 
WHERE countable = FALSE 
ORDER BY name;

-- 4. 查看已标记为需要计数的菜品
SELECT '=== 需要按人数计数的菜品 ===' as category;
SELECT id, name, shortcut_code, countable 
FROM dishes 
WHERE countable = TRUE 
ORDER BY name;

-- 5. 提供手动设置countable字段的示例语句
SELECT '=== 手动设置示例 ===' as category;
SELECT '-- 将特定菜品设置为按人数计数:' as instruction;
SELECT 'UPDATE dishes SET countable = TRUE WHERE name = ''托炉饼'';' as example1;
SELECT 'UPDATE dishes SET countable = TRUE WHERE id = 1;' as example2;
SELECT '' as blank;
SELECT '-- 将菜品恢复为固定份量:' as instruction2;
SELECT 'UPDATE dishes SET countable = FALSE WHERE name = ''托炉饼'';' as example3;

-- 6. 验证字段是否存在
SELECT '=== 字段验证 ===' as category;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dishes' AND column_name = 'countable';