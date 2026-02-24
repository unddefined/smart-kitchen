-- 手动管理dishes表countable字段的工具脚本

-- 1. 查看当前所有菜品的countable状态
SELECT 
    id,
    name,
    shortcut_code,
    CASE 
        WHEN countable = TRUE THEN '✓ 按人数计数'
        WHEN countable = FALSE THEN '○ 固定份量'
        ELSE '未设置'
    END as 计数方式,
    countable as 原始值
FROM dishes 
ORDER BY countable DESC, name;

-- 2. 快速设置常用需要按人数计数的菜品
-- 注意：请根据实际情况取消注释并执行需要的语句

/*
-- 设置托炉饼类菜品
UPDATE dishes SET countable = TRUE WHERE name LIKE '%饼%' AND name != '葱油饼';

-- 设置主食类菜品
UPDATE dishes SET countable = TRUE WHERE name LIKE '%饭%' OR name LIKE '%面%' OR name LIKE '%粥%';

-- 设置汤品类菜品
UPDATE dishes SET countable = TRUE WHERE name LIKE '%汤%' OR name LIKE '%羹%';

-- 单独设置特定菜品
UPDATE dishes SET countable = TRUE WHERE name = '托炉饼';
UPDATE dishes SET countable = TRUE WHERE name = '米饭';
UPDATE dishes SET countable = TRUE WHERE name = '蛋炒饭';
*/

-- 3. 批量重置所有菜品为固定份量（谨慎使用）
-- UPDATE dishes SET countable = FALSE;

-- 4. 按工位查看菜品计数设置情况
SELECT 
    s.name as 工位,
    COUNT(*) as 总菜品数,
    COUNT(CASE WHEN d.countable = TRUE THEN 1 END) as 按人数计数,
    COUNT(CASE WHEN d.countable = FALSE THEN 1 END) as 固定份量
FROM stations s
LEFT JOIN dishes d ON s.id = d.station_id
GROUP BY s.id, s.name
ORDER BY s.id;

-- 5. 查找未分配工位的菜品
SELECT 
    id,
    name,
    CASE 
        WHEN countable = TRUE THEN '按人数计数'
        WHEN countable = FALSE THEN '固定份量'
        ELSE '未设置'
    END as 计数方式
FROM dishes 
WHERE station_id IS NULL
ORDER BY name;