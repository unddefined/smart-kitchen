-- 最终修正的数据库修复脚本（使用正确的工位ID）

-- 1. 重建菜品分类表（按出餐顺序排列）
DELETE FROM dish_categories;
INSERT INTO dish_categories (name, description, display_order) VALUES 
    ('凉菜', '开胃凉菜类', 1),      -- category_id: 16
    ('前菜', '开胃前菜类', 2),      -- category_id: 17
    ('中菜', '主菜类', 3),          -- category_id: 18
    ('后菜', '配菜类', 4),          -- category_id: 19
    ('尾菜', '收尾菜品类', 5),      -- category_id: 20
    ('点心', '精致点心类', 6),      -- category_id: 21
    ('蒸菜', '蒸制菜品类', 7);      -- category_id: 22

-- 2. 清空并重新插入菜品数据（使用正确的工位ID）
DELETE FROM dishes;

-- 凉菜类（工位: 凉菜(8)，分类: 凉菜(16)）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('三文鱼拼鹅肝', 8, 16, 'SWSPGH', NULL, FALSE),
    ('美味八碟', 8, 16, 'MWBD', NULL, FALSE);

-- 前菜类（工位: 热菜(6)，分类: 前菜(17)）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('藜麦元宝虾', 6, 17, 'LMYYX', NULL, FALSE),
    ('盐水河虾', 6, 17, 'YSHX', NULL, FALSE),
    ('红汤油爆河虾', 6, 17, 'HTYBHX', NULL, FALSE),
    ('椒盐基围虾', 6, 17, 'JYJWX', NULL, FALSE),
    ('发财银鱼羹', 6, 17, 'FCYYG', NULL, FALSE),
    ('海皇鲍翅羹', 6, 17, 'HHBCG', NULL, FALSE),
    ('牛肉羹', 6, 17, 'NRG', NULL, FALSE),
    ('扎腻头', 6, 17, 'ZNT', NULL, FALSE);

-- 中菜类（工位: 热菜(6)，分类: 中菜(18)）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('藤椒双脆', 6, 18, 'TZSC', NULL, FALSE),
    ('红烧肉', 6, 18, 'HSR', 1, FALSE),
    ('板栗烧鳝筒', 6, 18, 'BLSST', NULL, FALSE),
    ('黑椒菌香牛肉粒', 6, 18, 'HJJXNRL', NULL, FALSE),
    ('香菜腰花', 6, 18, 'XCYH', NULL, FALSE),
    ('野菜山药虾仁', 6, 18, 'YCSYXR', NULL, FALSE),
    ('佛跳墙', 6, 18, 'FTQ', NULL, FALSE),
    ('葱烧玛卡菌海参蹄筋', 6, 18, 'CSMKJHCTJ', NULL, FALSE),
    ('红烧河鱼', 6, 18, 'HSHY', NULL, FALSE),
    ('椒盐猪手', 6, 18, 'JYZS', NULL, FALSE),
    ('葱姜炒珍宝蟹', 6, 18, 'CJCZBX', NULL, FALSE),
    ('清炒虾仁', 6, 18, 'QCXR', NULL, FALSE),
    ('茶树菇炭烧肉', 6, 18, 'CSGTSR', NULL, FALSE),
    ('黑椒牛仔骨', 6, 18, 'HJNZG', NULL, FALSE),
    ('椒盐排骨', 6, 18, 'JYGP', NULL, TRUE),
    ('红烧鳗鱼板栗', 6, 18, 'HSEYBL', NULL, FALSE),
    ('黎山汁虾球', 6, 18, 'LSZXQ', NULL, FALSE),
    ('托炉饼', 6, 18, 'TLB', 2, TRUE),
    ('松鼠桂鱼', 6, 18, 'SSGY', NULL, FALSE),
    ('小炒黄牛肉', 6, 18, 'XCHNR', NULL, FALSE),
    ('干捞粉丝', 6, 18, 'GLFS', NULL, FALSE),
    ('铁板豆腐', 6, 18, 'TBDF', NULL, TRUE),
    ('沙拉牛排', 6, 18, 'SLNP', NULL, TRUE);

-- 后菜类（工位: 热菜(6)，分类: 后菜(19)）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('菠萝炒饭', 6, 19, 'PLCF', 5, FALSE),
    ('雪菜冬笋', 6, 19, 'XCD', NULL, FALSE),
    ('荷塘月色', 6, 19, 'HTYS', NULL, FALSE),
    ('金蒜小葱山药', 6, 19, 'JSCCSY', NULL, FALSE),
    ('雪菜马蹄炒鲜蘑', 6, 19, 'XCMT', NULL, FALSE);

-- 尾菜类（工位: 热菜(6)，分类: 尾菜(20)）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('时蔬', 6, 20, 'SS', 6, FALSE),
    ('蛋皮汤', 6, 20, 'DPT', NULL, FALSE);

-- 点心类（工位: 点心(10)，分类: 点心(21)）- MVP中忽略
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('小笼馒头', 10, 21, 'XLMT', 3, TRUE),
    ('手工米糕', 10, 21, 'SGMG', NULL, TRUE);

-- 蒸菜类（工位: 蒸菜(9)，分类: 蒸菜(22)）- MVP中忽略
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('红蒸湘鱼', 9, 22, 'HZXY', NULL, FALSE),
    ('蒜蓉小鲍鱼', 9, 22, 'TRXBY', NULL, TRUE),
    ('清蒸大黄鱼', 9, 22, 'QZDHY', 4, FALSE),
    ('菌菇整鸡煲', 9, 22, 'JGZJB', NULL, FALSE),
    ('乌米饭', 9, 22, 'WMF', NULL, TRUE),
    ('红蒸长寿鱼', 9, 22, 'HZCSY', NULL, FALSE),
    ('蒜蓉小青龙', 9, 22, 'TRXQL', NULL, FALSE),
    ('清蒸牛肋骨', 9, 22, 'QZNLG', NULL, FALSE);

-- 3. 重新插入订单菜品项数据（符合出餐逻辑）
DELETE FROM order_items;

-- 按照出餐顺序插入测试数据
INSERT INTO order_items (order_id, dish_id, quantity, status, priority, remark, countable) VALUES
    -- 订单1：凉菜 → 前菜 → 中菜 → 后菜 → 尾菜
    (1, (SELECT id FROM dishes WHERE name = '美味八碟'), 1, 'pending', 0, NULL, FALSE),  -- 凉菜
    (1, (SELECT id FROM dishes WHERE name = '椒盐基围虾'), 1, 'pending', 0, '微辣', FALSE), -- 前菜
    (1, (SELECT id FROM dishes WHERE name = '红烧肉'), 1, 'prep', 2, NULL, FALSE),      -- 中菜
    (1, (SELECT id FROM dishes WHERE name = '菠萝炒饭'), 1, 'ready', 1, NULL, FALSE),   -- 后菜
    (1, (SELECT id FROM dishes WHERE name = '时蔬'), 1, 'ready', -1, NULL, FALSE),      -- 尾菜（已出）
    
    -- 订单2：前菜 → 中菜 → 尾菜
    (2, (SELECT id FROM dishes WHERE name = '藜麦元宝虾'), 1, 'pending', 3, '催菜', FALSE), -- 前菜（催菜）
    (2, (SELECT id FROM dishes WHERE name = '藤椒双脆'), 1, 'prep', 2, NULL, FALSE),    -- 中菜
    (2, (SELECT id FROM dishes WHERE name = '蛋皮汤'), 1, 'ready', -1, NULL, FALSE),    -- 尾菜（已出）
    
    -- 订单3：中菜 → 后菜 → 尾菜
    (3, (SELECT id FROM dishes WHERE name = '托炉饼'), 2, 'served', -1, NULL, TRUE),     -- 中菜（已出）
    (3, (SELECT id FROM dishes WHERE name = '雪菜冬笋'), 1, 'pending', 1, NULL, FALSE),  -- 后菜
    (3, (SELECT id FROM dishes WHERE name = '蛋皮汤'), 1, 'pending', 0, NULL, FALSE);    -- 尾菜

-- 4. 验证修复结果
SELECT '=== 数据库结构验证 ===' as info;
SELECT '工位数量: ' || COUNT(*) FROM stations;
SELECT '菜品分类数量: ' || COUNT(*) FROM dish_categories;
SELECT '菜谱数量: ' || COUNT(*) FROM recipes;
SELECT '菜品数量: ' || COUNT(*) FROM dishes;
SELECT '订单数量: ' || COUNT(*) FROM orders;
SELECT '订单菜品项数量: ' || COUNT(*) FROM order_items;

-- 5. 显示工位和分类详情
SELECT '=== 工位列表（6个）===' as info;
SELECT id, name FROM stations ORDER BY id;

SELECT '=== 菜品分类列表（按出餐顺序）===' as info;
SELECT id, name, display_order FROM dish_categories ORDER BY display_order;

-- 6. 验证出餐顺序逻辑
SELECT '=== 出餐顺序验证 ===' as info;
SELECT 
    dc.name as 分类,
    dc.display_order as 出餐顺序,
    COUNT(d.id) as 菜品数量
FROM dish_categories dc
LEFT JOIN dishes d ON d.category_id = dc.id
GROUP BY dc.id, dc.name, dc.display_order
ORDER BY dc.display_order;

-- 7. 显示各订单的菜品分布（按出餐顺序）
SELECT '=== 订单菜品分布（按出餐顺序）===' as info;
SELECT 
    o.id as 订单ID,
    o.hall_number as 台号,
    dc.name as 菜品分类,
    dc.display_order as 出餐顺序,
    d.name as 菜品名称,
    oi.status as 状态,
    oi.priority as 优先级
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN dishes d ON oi.dish_id = d.id
JOIN dish_categories dc ON d.category_id = dc.id
ORDER BY o.id, dc.display_order;