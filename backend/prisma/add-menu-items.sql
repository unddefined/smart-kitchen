-- 根据菜品库.md添加菜品数据
-- 注意：此脚本假设数据库中已有相应的分类和工位数据

-- 首先检查现有数据
SELECT '现有菜品数量:' as info, COUNT(*) as count FROM dishes;
SELECT '现有分类:' as info, name, id FROM dish_categories ORDER BY id;
SELECT '现有工位:' as info, name, id FROM stations ORDER BY id;

-- 插入凉菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) VALUES
    ('三文鱼拼鹅肝', 3, 1, 'SWSPGH', FALSE),
    ('美味八碟', 3, 1, 'MWBD', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 插入前菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) VALUES
    ('藜麦元宝虾', 1, 2, 'LMYYX', FALSE),
    ('盐水河虾', 1, 2, 'YSHX', FALSE),
    ('红汤油爆河虾', 1, 2, 'HTYBHX', FALSE),
    ('椒盐基围虾', 1, 2, 'JYJWX', FALSE),
    ('发财银鱼羹', 1, 2, 'FCYWG', FALSE),
    ('海皇鲍翅羹', 1, 2, 'HHBCG', FALSE),
    ('牛肉羹', 1, 2, 'NRG', FALSE),
    ('扎腻头', 1, 2, 'ZNT', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 插入中菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) VALUES
    ('藤椒双脆', 1, 3, 'TZSC', FALSE),
    ('红烧肉', 1, 3, 'HSR', FALSE),
    ('板栗烧鳝筒', 1, 3, 'BLSST', FALSE),
    ('黑椒菌香牛肉粒', 1, 3, 'HJJXNRL', FALSE),
    ('香菜腰花', 1, 3, 'XCYH', FALSE),
    ('野菜山药虾仁', 1, 3, 'YCSYXR', FALSE),
    ('佛跳墙', 1, 3, 'FTQ', FALSE),
    ('葱烧玛卡菌海参蹄筋', 1, 3, 'CSMKJHSTJ', FALSE),
    ('红烧河鱼', 1, 3, 'HSHY', FALSE),
    ('椒盐猪手', 1, 3, 'JYZS', FALSE),
    ('葱姜炒珍宝蟹', 1, 3, 'CJCZBX', FALSE),
    ('清炒虾仁', 1, 3, 'QCXR', FALSE),
    ('茶树菇炭烧肉', 1, 3, 'CSGTSR', FALSE),
    ('黑椒牛仔骨', 1, 3, 'HJNZG', FALSE),
    ('椒盐排骨', 1, 3, 'JYGP', TRUE),
    ('红烧鳗鱼板栗', 1, 3, 'HSEYBL', FALSE),
    ('黎山汁虾球', 1, 3, 'LSZXQ', FALSE),
    ('托炉饼', 1, 3, 'TLB', TRUE),
    ('松鼠桂鱼', 1, 3, 'SSGY', FALSE),
    ('小炒黄牛肉', 1, 3, 'XCHNR', FALSE),
    ('干捞粉丝', 1, 3, 'GLFS', FALSE),
    ('铁板豆腐', 1, 3, 'TBDF', TRUE),
    ('沙拉牛排', 1, 3, 'SLNP', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 插入点心类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) VALUES
    ('小笼馒头', 5, 6, 'XLMT', TRUE),
    ('手工米糕', 5, 6, 'SGMG', TRUE)
ON CONFLICT (name) DO NOTHING;

-- 插入蒸菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) VALUES
    ('红蒸湘鱼', 4, 7, 'HZXY', FALSE),
    ('蒜蓉小鲍鱼', 4, 7, 'TRXBY', TRUE),
    ('清蒸大黄鱼', 4, 7, 'QZDHY', FALSE),
    ('菌菇整鸡煲', 4, 7, 'JGZJB', FALSE),
    ('乌米饭', 4, 7, 'WFM', TRUE),
    ('红蒸长寿鱼', 4, 7, 'HZCSY', FALSE),
    ('蒜蓉小青龙', 4, 7, 'TRXQL', FALSE),
    ('清蒸牛肋骨', 4, 7, 'QZNLG', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 插入后菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) VALUES
    ('菠萝炒饭', 1, 4, 'PLCF', FALSE),
    ('雪菜冬笋', 1, 4, 'XCD', FALSE),
    ('荷塘月色', 1, 4, 'HTYS', FALSE),
    ('金蒜小葱山药', 1, 4, 'JSXCYS', FALSE),
    ('雪菜马蹄炒鲜蘑', 1, 4, 'XCMTXCM', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 插入尾菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, countable) VALUES
    ('时蔬', 1, 5, 'SS', FALSE),
    ('蛋皮汤', 1, 5, 'DPT', FALSE)
ON CONFLICT (name) DO NOTHING;

-- 验证插入结果
SELECT '=== 菜品添加完成 ===' as info;
SELECT '最终菜品总数:' as info, COUNT(*) as total FROM dishes;

-- 按分类统计
SELECT 
    dc.name as 分类,
    COUNT(d.id) as 菜品数量
FROM dish_categories dc
LEFT JOIN dishes d ON d.category_id = dc.id
GROUP BY dc.id, dc.name
ORDER BY dc.id;

-- 显示新增的菜品（如果有）
SELECT '=== 新增菜品列表 ===' as info;
SELECT 
    d.name as 菜品名称,
    s.name as 工位,
    dc.name as 分类,
    d.shortcut_code as 助记码,
    d.countable as 需计数
FROM dishes d
JOIN stations s ON d.station_id = s.id
JOIN dish_categories dc ON d.category_id = dc.id
ORDER BY dc.id, d.name;