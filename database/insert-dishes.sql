-- 插入完整菜品数据
-- 包含工位分配和countable字段设置

-- 首先确保工位存在
INSERT INTO stations (name) VALUES 
    ('热菜'),
    ('打荷'),
    ('凉菜'),
    ('蒸煮'),
    ('点心'),
    ('切配')
ON CONFLICT (name) DO NOTHING;

-- 获取工位ID
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
-- 插入凉菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    CASE 
        WHEN dish_name LIKE '%（计数）' THEN TRUE
        ELSE FALSE
    END
FROM (
    VALUES 
        ('三文鱼拼鹅肝', '凉菜'),
        ('美味八碟', '凉菜')
) AS dishes_data(dish_name, category_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '凉菜' AND dc.name = dishes_data.category_name
ON CONFLICT (name) DO NOTHING;

-- 插入前菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    CASE 
        WHEN dish_name LIKE '%（计数）' THEN TRUE
        ELSE FALSE
    END
FROM (
    VALUES 
        ('藜麦元宝虾', '前菜'),
        ('盐水河虾', '前菜'),
        ('红汤油爆河虾', '前菜'),
        ('椒盐基围虾', '前菜'),
        ('发财银鱼羹', '前菜'),
        ('海皇鲍翅羹', '前菜'),
        ('牛肉羹', '前菜'),
        ('扎腻头', '前菜')
) AS dishes_data(dish_name, category_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '热菜' AND dc.name = dishes_data.category_name
ON CONFLICT (name) DO NOTHING;

-- 插入中菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    CASE 
        WHEN dish_name LIKE '%（计数）' THEN TRUE
        ELSE FALSE
    END
FROM (
    VALUES 
        ('藤椒双脆', '中菜'),
        ('红烧肉', '中菜'),
        ('板栗烧鳝筒', '中菜'),
        ('黑椒菌香牛肉粒', '中菜'),
        ('香菜腰花', '中菜'),
        ('野菜山药虾仁', '中菜'),
        ('佛跳墙', '中菜'),
        ('葱烧玛卡菌海参蹄筋', '中菜'),
        ('红烧河鱼', '中菜'),
        ('椒盐猪手', '中菜'),
        ('葱姜炒珍宝蟹', '中菜'),
        ('清炒虾仁', '中菜'),
        ('茶树菇炭烧肉', '中菜'),
        ('黑椒牛仔骨', '中菜'),
        ('椒盐排骨（计数）', '中菜'),
        ('红烧鳗鱼板栗', '中菜'),
        ('黎山汁虾球', '中菜'),
        ('托炉饼（计数）', '中菜'),
        ('松鼠桂鱼', '中菜'),
        ('小炒黄牛肉', '中菜'),
        ('干捞粉丝', '中菜'),
        ('铁板豆腐（计数）', '中菜'),
        ('沙拉牛排（计数）', '中菜')
) AS dishes_data(dish_name, category_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '热菜' AND dc.name = dishes_data.category_name
ON CONFLICT (name) DO NOTHING;

-- 插入点心类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    CASE 
        WHEN dish_name LIKE '%（计数）' THEN TRUE
        ELSE FALSE
    END
FROM (
    VALUES 
        ('小笼馒头（计数）', '点心'),
        ('手工米糕（计数）', '点心')
) AS dishes_data(dish_name, category_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '点心' AND dc.name = dishes_data.category_name
ON CONFLICT (name) DO NOTHING;

-- 插入蒸菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    CASE 
        WHEN dish_name LIKE '%（计数）' THEN TRUE
        ELSE FALSE
    END
FROM (
    VALUES 
        ('红蒸湘鱼', '蒸菜'),
        ('蒜蓉小鲍鱼（计数）', '蒸菜'),
        ('清蒸大黄鱼', '蒸菜'),
        ('菌菇整鸡煲', '蒸菜'),
        ('乌米饭（计数）', '蒸菜'),
        ('红蒸长寿鱼', '蒸菜'),
        ('蒜蓉小青龙', '蒸菜'),
        ('清蒸牛肋骨', '蒸菜')
) AS dishes_data(dish_name, category_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '蒸煮' AND dc.name = dishes_data.category_name
ON CONFLICT (name) DO NOTHING;

-- 插入后菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    CASE 
        WHEN dish_name LIKE '%（计数）' THEN TRUE
        ELSE FALSE
    END
FROM (
    VALUES 
        ('菠萝炒饭', '后菜'),
        ('雪菜冬笋', '后菜'),
        ('荷塘月色', '后菜'),
        ('金蒜小葱山药', '后菜')
) AS dishes_data(dish_name, category_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '热菜' AND dc.name = dishes_data.category_name
ON CONFLICT (name) DO NOTHING;

-- 插入尾菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) 
SELECT 
    dish_name,
    s.id,
    dc.id,
    UPPER(LEFT(REPLACE(dish_name, ' ', ''), 4)),
    CASE 
        WHEN dish_name LIKE '%（计数）' THEN TRUE
        ELSE FALSE
    END
FROM (
    VALUES 
        ('时蔬', '尾菜'),
        ('蛋皮汤', '尾菜')
) AS dishes_data(dish_name, category_name)
CROSS JOIN stations s
CROSS JOIN dish_categories dc
WHERE s.name = '热菜' AND dc.name = dishes_data.category_name
ON CONFLICT (name) DO NOTHING;

-- 验证插入结果
SELECT '=== 菜品数据录入完成 ===' as info;
SELECT 
    dc.name as 分类,
    COUNT(d.id) as 菜品数量,
    COUNT(CASE WHEN d.countable = TRUE THEN 1 END) as 计数菜品数
FROM dish_categories dc
LEFT JOIN dishes d ON dc.id = d.category_id
GROUP BY dc.id, dc.name
ORDER BY dc.display_order;

SELECT '=== 需要计数的菜品 ===' as info;
SELECT d.name as 菜品名称, dc.name as 分类
FROM dishes d
JOIN dish_categories dc ON d.category_id = dc.id
WHERE d.countable = TRUE
ORDER BY dc.display_order, d.name;