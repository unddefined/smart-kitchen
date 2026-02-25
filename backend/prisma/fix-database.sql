-- 修复数据库脚本 - 添加缺失字段和修复数据

-- 1. 为dishes表添加countable字段
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS countable BOOLEAN DEFAULT FALSE;

-- 2. 重新插入菜品数据（带countable字段）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('三文鱼拼鹅肝', 1, 1, 'SWSPGH', NULL, FALSE),
    ('美味八碟', 1, 1, 'MWBD', NULL, FALSE),
    ('藜麦元宝虾', 2, 2, 'LMYYX', NULL, FALSE),
    ('盐水河虾', 2, 2, 'YSHX', NULL, FALSE),
    ('红汤油爆河虾', 2, 2, 'HTYBHX', NULL, FALSE),
    ('椒盐基围虾', 2, 2, 'JYJWX', NULL, FALSE),
    ('发财银鱼羹', 2, 2, 'FCYYG', NULL, FALSE),
    ('海皇鲍翅羹', 2, 2, 'HHBCG', NULL, FALSE),
    ('牛肉羹', 2, 2, 'NRG', NULL, FALSE),
    ('扎腻头', 2, 2, 'ZNT', NULL, FALSE),
    ('藤椒双脆', 3, 3, 'TZSC', NULL, FALSE),
    ('红烧肉', 3, 3, 'HSR', 1, FALSE),
    ('板栗烧鳝筒', 3, 3, 'BLSST', NULL, FALSE),
    ('黑椒菌香牛肉粒', 3, 3, 'HJJXNRL', NULL, FALSE),
    ('香菜腰花', 3, 3, 'XCYH', NULL, FALSE),
    ('野菜山药虾仁', 3, 3, 'YCSYXR', NULL, FALSE),
    ('佛跳墙', 3, 3, 'FTQ', NULL, FALSE),
    ('葱烧玛卡菌海参蹄筋', 3, 3, 'CSMKJHCTJ', NULL, FALSE),
    ('红烧河鱼', 3, 3, 'HSHY', NULL, FALSE),
    ('椒盐猪手', 3, 3, 'JYZS', NULL, FALSE),
    ('葱姜炒珍宝蟹', 3, 3, 'CJCZBX', NULL, FALSE),
    ('清炒虾仁', 3, 3, 'QCXR', NULL, FALSE),
    ('茶树菇炭烧肉', 3, 3, 'CSGTSR', NULL, FALSE),
    ('黑椒牛仔骨', 3, 3, 'HJNZG', NULL, FALSE),
    ('椒盐排骨', 3, 3, 'JYGP', NULL, TRUE),
    ('红烧鳗鱼板栗', 3, 3, 'HSEYBL', NULL, FALSE),
    ('黎山汁虾球', 3, 3, 'LSZXQ', NULL, FALSE),
    ('托炉饼', 3, 3, 'TLB', 2, TRUE),
    ('松鼠桂鱼', 3, 3, 'SSGY', NULL, FALSE),
    ('小炒黄牛肉', 3, 3, 'XCHNR', NULL, FALSE),
    ('干捞粉丝', 3, 3, 'GLFS', NULL, FALSE),
    ('铁板豆腐', 3, 3, 'TBDF', NULL, TRUE),
    ('沙拉牛排', 3, 3, 'SLNP', NULL, TRUE),
    ('小笼馒头', 4, 4, 'XLMT', 3, TRUE),
    ('手工米糕', 4, 4, 'SGMG', NULL, TRUE),
    ('红蒸湘鱼', 5, 5, 'HZXY', NULL, FALSE),
    ('蒜蓉小鲍鱼', 5, 5, 'TRXBY', NULL, TRUE),
    ('清蒸大黄鱼', 5, 5, 'QZDHY', 4, FALSE),
    ('菌菇整鸡煲', 5, 5, 'JGZJB', NULL, FALSE),
    ('乌米饭', 5, 5, 'WMF', NULL, TRUE),
    ('红蒸长寿鱼', 5, 5, 'HZCSY', NULL, FALSE),
    ('蒜蓉小青龙', 5, 5, 'TRXQL', NULL, FALSE),
    ('清蒸牛肋骨', 5, 5, 'QZNLG', NULL, FALSE),
    ('菠萝炒饭', 6, 6, 'PLCF', 5, FALSE),
    ('雪菜冬笋', 6, 6, 'XCD', NULL, FALSE),
    ('荷塘月色', 6, 6, 'HTYS', NULL, FALSE),
    ('金蒜小葱山药', 6, 6, 'JSCCSY', NULL, FALSE),
    ('雪菜马蹄炒鲜蘑', 6, 6, 'XCMT', NULL, FALSE),
    ('时蔬', 7, 7, 'SS', 6, FALSE),
    ('蛋皮汤', 7, 7, 'DPT', NULL, FALSE)
ON CONFLICT (name) DO UPDATE SET
    station_id = EXCLUDED.station_id,
    category_id = EXCLUDED.category_id,
    shortcut_code = EXCLUDED.shortcut_code,
    recipe_id = EXCLUDED.recipe_id,
    countable = EXCLUDED.countable;

-- 3. 清空并重新插入订单菜品项数据
DELETE FROM order_items;

INSERT INTO order_items (order_id, dish_id, quantity, status, priority, remark, countable) VALUES
    (1, (SELECT id FROM dishes WHERE name = '红烧肉'), 1, 'pending', 0, '微辣', FALSE),
    (1, (SELECT id FROM dishes WHERE name = '托炉饼'), 2, 'prep', 2, '少盐', TRUE),
    (1, (SELECT id FROM dishes WHERE name = '时蔬'), 1, 'ready', 1, NULL, FALSE),
    (2, (SELECT id FROM dishes WHERE name = '藤椒双脆'), 1, 'pending', 3, '催菜', FALSE),
    (2, (SELECT id FROM dishes WHERE name = '小笼馒头'), 3, 'prep', 2, NULL, TRUE),
    (2, (SELECT id FROM dishes WHERE name = '清蒸大黄鱼'), 1, 'ready', -1, NULL, FALSE),
    (3, (SELECT id FROM dishes WHERE name = '红烧肉'), 1, 'served', -1, NULL, FALSE),
    (3, (SELECT id FROM dishes WHERE name = '椒盐排骨'), 1, 'pending', 1, NULL, TRUE),
    (3, (SELECT id FROM dishes WHERE name = '蛋皮汤'), 1, 'pending', 0, NULL, FALSE);

-- 4. 验证修复结果
SELECT '工位数量: ' || COUNT(*) FROM stations;
SELECT '菜品分类数量: ' || COUNT(*) FROM dish_categories;
SELECT '菜谱数量: ' || COUNT(*) FROM recipes;
SELECT '菜品数量: ' || COUNT(*) FROM dishes;
SELECT '订单数量: ' || COUNT(*) FROM orders;
SELECT '订单菜品项数量: ' || COUNT(*) FROM order_items;