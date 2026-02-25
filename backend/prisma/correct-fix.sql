-- 正确的数据库修复脚本 - 区分工位和菜品分类

-- 1. 确保正确的工位数据（6个工位）
DELETE FROM stations;
INSERT INTO stations (name) VALUES 
    ('热菜'),
    ('打荷'),
    ('凉菜'),
    ('蒸菜'),
    ('点心'),
    ('切配');

-- 2. 确保菜品分类数据（按出餐顺序）
DELETE FROM dish_categories;
INSERT INTO dish_categories (name, description, display_order) VALUES 
    ('前菜', '开胃前菜类', 1),
    ('中菜', '主菜类', 2),
    ('后菜', '配菜类', 3),
    ('尾菜', '收尾菜品类', 4),
    ('凉菜', '开胃凉菜类', 5),
    ('点心', '精致点心类', 6),
    ('蒸菜', '蒸制菜品类', 7),
    ('汤类', '各类汤品', 8);

-- 3. 清空并重新插入菜品数据（正确关联工位和分类）
DELETE FROM dishes;

-- 前菜类菜品（分配到合适工位）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('藜麦元宝虾', 1, 1, 'LMYYX', NULL, FALSE),
    ('盐水河虾', 1, 1, 'YSHX', NULL, FALSE),
    ('红汤油爆河虾', 1, 1, 'HTYBHX', NULL, FALSE),
    ('椒盐基围虾', 1, 1, 'JYJWX', NULL, FALSE),
    ('发财银鱼羹', 1, 1, 'FCYYG', NULL, FALSE),
    ('海皇鲍翅羹', 1, 1, 'HHBCG', NULL, FALSE),
    ('牛肉羹', 1, 1, 'NRG', NULL, FALSE),
    ('扎腻头', 1, 1, 'ZNT', NULL, FALSE);

-- 中菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('藤椒双脆', 1, 2, 'TZSC', NULL, FALSE),
    ('红烧肉', 1, 2, 'HSR', 1, FALSE),
    ('板栗烧鳝筒', 1, 2, 'BLSST', NULL, FALSE),
    ('黑椒菌香牛肉粒', 1, 2, 'HJJXNRL', NULL, FALSE),
    ('香菜腰花', 1, 2, 'XCYH', NULL, FALSE),
    ('野菜山药虾仁', 1, 2, 'YCSYXR', NULL, FALSE),
    ('佛跳墙', 1, 2, 'FTQ', NULL, FALSE),
    ('葱烧玛卡菌海参蹄筋', 1, 2, 'CSMKJHCTJ', NULL, FALSE),
    ('红烧河鱼', 1, 2, 'HSHY', NULL, FALSE),
    ('椒盐猪手', 1, 2, 'JYZS', NULL, FALSE),
    ('葱姜炒珍宝蟹', 1, 2, 'CJCZBX', NULL, FALSE),
    ('清炒虾仁', 1, 2, 'QCXR', NULL, FALSE),
    ('茶树菇炭烧肉', 1, 2, 'CSGTSR', NULL, FALSE),
    ('黑椒牛仔骨', 1, 2, 'HJNZG', NULL, FALSE),
    ('椒盐排骨', 1, 2, 'JYGP', NULL, TRUE),
    ('红烧鳗鱼板栗', 1, 2, 'HSEYBL', NULL, FALSE),
    ('黎山汁虾球', 1, 2, 'LSZXQ', NULL, FALSE),
    ('托炉饼', 1, 2, 'TLB', 2, TRUE),
    ('松鼠桂鱼', 1, 2, 'SSGY', NULL, FALSE),
    ('小炒黄牛肉', 1, 2, 'XCHNR', NULL, FALSE),
    ('干捞粉丝', 1, 2, 'GLFS', NULL, FALSE),
    ('铁板豆腐', 1, 2, 'TBDF', NULL, TRUE),
    ('沙拉牛排', 1, 2, 'SLNP', NULL, TRUE);

-- 后菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('菠萝炒饭', 1, 3, 'PLCF', 5, FALSE),
    ('雪菜冬笋', 1, 3, 'XCD', NULL, FALSE),
    ('荷塘月色', 1, 3, 'HTYS', NULL, FALSE),
    ('金蒜小葱山药', 1, 3, 'JSCCSY', NULL, FALSE),
    ('雪菜马蹄炒鲜蘑', 1, 3, 'XCMT', NULL, FALSE);

-- 尾菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('时蔬', 1, 4, 'SS', 6, FALSE),
    ('蛋皮汤', 1, 4, 'DPT', NULL, FALSE);

-- 凉菜类菜品（分配到凉菜工位）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('三文鱼拼鹅肝', 3, 5, 'SWSPGH', NULL, FALSE),
    ('美味八碟', 3, 5, 'MWBD', NULL, FALSE);

-- 点心类菜品（分配到点心工位）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('小笼馒头', 5, 6, 'XLMT', 3, TRUE),
    ('手工米糕', 5, 6, 'SGMG', NULL, TRUE);

-- 蒸菜类菜品（分配到蒸菜工位）
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('红蒸湘鱼', 4, 7, 'HZXY', NULL, FALSE),
    ('蒜蓉小鲍鱼', 4, 7, 'TRXBY', NULL, TRUE),
    ('清蒸大黄鱼', 4, 7, 'QZDHY', 4, FALSE),
    ('菌菇整鸡煲', 4, 7, 'JGZJB', NULL, FALSE),
    ('乌米饭', 4, 7, 'WMF', NULL, TRUE),
    ('红蒸长寿鱼', 4, 7, 'HZCSY', NULL, FALSE),
    ('蒜蓉小青龙', 4, 7, 'TRXQL', NULL, FALSE),
    ('清蒸牛肋骨', 4, 7, 'QZNLG', NULL, FALSE);

-- 4. 清空并重新插入订单菜品项数据
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

-- 5. 验证修复结果
SELECT '工位数量: ' || COUNT(*) FROM stations;
SELECT '菜品分类数量: ' || COUNT(*) FROM dish_categories;
SELECT '菜谱数量: ' || COUNT(*) FROM recipes;
SELECT '菜品数量: ' || COUNT(*) FROM dishes;
SELECT '订单数量: ' || COUNT(*) FROM orders;
SELECT '订单菜品项数量: ' || COUNT(*) FROM order_items;

-- 6. 显示工位和分类详情
SELECT '=== 工位列表 ===' as info;
SELECT id, name FROM stations ORDER BY id;

SELECT '=== 菜品分类列表 ===' as info;
SELECT id, name, display_order FROM dish_categories ORDER BY display_order;