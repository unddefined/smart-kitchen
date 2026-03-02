-- 插入完整菜品数据（根据菜品库.md）
-- 包含工位分配、countable 字段和 need_prep 字段设置

-- 首先确保工位存在
INSERT INTO stations (name) VALUES 
    ('热菜'),
    ('打荷'),
    ('凉菜'),
    ('蒸煮'),
    ('点心'),
    ('切配')
ON CONFLICT (name) DO NOTHING;

-- 获取工位 ID
WITH station_ids AS (
    SELECT 
        id,
        name,
        CASE name
            WHEN '凉菜' THEN 1
            WHEN '蒸煮' THEN 2
            WHEN '点心' THEN 3
            WHEN '切配' THEN 4
            WHEN '打荷' THEN 5
            ELSE 6 -- 热菜作为默认工位
        END as sort_order
    FROM stations
    ORDER BY sort_order
)
-- 插入凉菜类菜品 (凉菜工位)
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable, need_prep) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    FALSE,
    FALSE
FROM (
    VALUES 
        ('三文鱼拼鹅肝'),
        ('美味八碟')
) AS dishes_data(dish_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '凉菜' AND dc.name = '凉菜'
ON CONFLICT (name) DO NOTHING;

-- 插入前菜类菜品 (热菜工位，优先级 3)
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable, need_prep) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    FALSE,
    FALSE
FROM (
    VALUES 
        ('藜麦元宝虾'),
        ('盐水河虾'),
        ('红汤油爆河虾'),
        ('椒盐基围虾'),
        ('发财银鱼羹'),
        ('海皇鲍翅羹'),
        ('牛肉羹'),
        ('扎腻头')
) AS dishes_data(dish_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '热菜' AND dc.name = '前菜'
ON CONFLICT (name) DO NOTHING;

-- 插入中菜类菜品 (热菜工位，优先级 2)
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable, need_prep) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    CASE 
        WHEN dish_name IN ('椒盐排骨', '蒜香排骨', '托炉饼', '铁板豆腐', '沙拉牛排') THEN TRUE
        ELSE FALSE
    END,
    CASE 
        WHEN dish_name IN ('红烧肉', '椒盐猪手', '葱姜炒珍宝蟹', '椒盐排骨', '蒜香排骨', '黎山汁虾球', '松鼠桂鱼', '沙拉牛排') THEN TRUE
        ELSE FALSE
    END
FROM (
    VALUES 
        ('藤椒双脆'),
        ('红烧肉'),
        ('板栗烧鳝筒'),
        ('黑椒菌香牛肉粒'),
        ('香菜腰花'),
        ('野菜山药虾仁'),
        ('佛跳墙'),
        ('葱烧玛卡菌海参蹄筋'),
        ('红烧河鱼'),
        ('椒盐猪手'),
        ('葱姜炒珍宝蟹'),
        ('清炒虾仁'),
        ('茶树菇炭烧肉'),
        ('黑椒牛仔骨'),
        ('椒盐排骨'),
        ('蒜香排骨'),
        ('红烧鳗鱼板栗'),
        ('黎山汁虾球'),
        ('托炉饼'),
        ('松鼠桂鱼'),
        ('小炒黄牛肉'),
        ('干捞粉丝'),
        ('铁板豆腐'),
        ('沙拉牛排')
) AS dishes_data(dish_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '热菜' AND dc.name = '中菜'
ON CONFLICT (name) DO NOTHING;

-- 插入点心类菜品 (点心工位，MVP 阶段按中菜处理，优先级 2)
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable, need_prep) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    TRUE,  -- 点心都是计数的
    FALSE
FROM (
    VALUES 
        ('小笼馒头'),
        ('手工米糕')
) AS dishes_data(dish_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '点心' AND dc.name = '点心'
ON CONFLICT (name) DO NOTHING;

-- 插入蒸菜类菜品 (蒸煮工位，MVP 阶段按中菜处理，优先级 2)
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable, need_prep) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    CASE 
        WHEN dish_name IN ('蒜蓉小鲍鱼', '乌米饭') THEN TRUE
        ELSE FALSE
    END,
    FALSE
FROM (
    VALUES 
        ('红蒸湘鱼'),
        ('蒜蓉小鲍鱼'),
        ('清蒸大黄鱼'),
        ('菌菇整鸡煲'),
        ('乌米饭'),
        ('红蒸长寿鱼'),
        ('蒜蓉小青龙'),
        ('清蒸牛肋骨')
) AS dishes_data(dish_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '蒸煮' AND dc.name = '蒸菜'
ON CONFLICT (name) DO NOTHING;

-- 插入后菜类菜品 (热菜工位，优先级 1)
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable, need_prep) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    FALSE,
    CASE 
        WHEN dish_name = '菠萝炒饭' THEN TRUE
        ELSE FALSE
    END
FROM (
    VALUES 
        ('菠萝炒饭'),
        ('雪菜冬笋'),
        ('荷塘月色'),
        ('金蒜小葱山药'),
        ('雪菜马蹄炒鲜蘑')
) AS dishes_data(dish_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '热菜' AND dc.name = '后菜'
ON CONFLICT (name) DO NOTHING;

-- 插入尾菜类菜品 (热菜工位，优先级 1)
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable, need_prep) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    FALSE,
    FALSE
FROM (
    VALUES 
        ('时蔬'),
        ('蛋皮汤')
) AS dishes_data(dish_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '热菜' AND dc.name = '尾菜'
ON CONFLICT (name) DO NOTHING;

-- 验证插入结果
SELECT '=== 菜品数据录入完成 ===' as info;
SELECT 
    dc.name as 分类，
    COUNT(d.id) as 菜品数量，
    COUNT(CASE WHEN d.countable = TRUE THEN 1 END) as 计数菜品数，
    COUNT(CASE WHEN d.need_prep = TRUE THEN 1 END) as 需要预处理菜品数
FROM dish_categories dc
LEFT JOIN dishes d ON dc.id = d.category_id
GROUP BY dc.id, dc.name
ORDER BY dc.display_order;

SELECT '=== 需要计数的菜品 ===' as info;
SELECT d.name as 菜品名称，dc.name as 分类
FROM dishes d
JOIN dish_categories dc ON d.category_id = dc.id
WHERE d.countable = TRUE
ORDER BY dc.display_order, d.name;

SELECT '=== 需要预处理的菜品 ===' as info;
SELECT d.name as 菜品名称，dc.name as 分类
FROM dishes d
JOIN dish_categories dc ON d.category_id = dc.id
WHERE d.need_prep = TRUE
ORDER BY dc.display_order, d.name;
