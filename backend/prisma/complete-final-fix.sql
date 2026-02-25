-- 完整的数据库最终修复脚本

-- 1. 添加缺失的尾菜类菜品
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('时蔬', 6, 20, 'SS', 5, FALSE),
    ('蛋皮汤', 6, 20, 'DPT', NULL, FALSE)
ON CONFLICT (name) DO NOTHING;

-- 2. 确保关键菜品存在
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    ('红烧肉', 6, 18, 'HSR', 1, FALSE),
    ('托炉饼', 6, 18, 'TLB', 2, TRUE)
ON CONFLICT (name) DO NOTHING;

-- 3. 清空并重新插入订单菜品项数据（使用正确的菜品ID）
DELETE FROM order_items;

-- 获取实际存在的菜品ID
INSERT INTO order_items (order_id, dish_id, quantity, status, priority, remark, countable) VALUES
    -- 订单1：凉菜(102) → 前菜(106) → 中菜(112) → 后菜(134) → 尾菜(新ID)
    (1, 102, 1, 'pending', 0, NULL, FALSE),    -- 美味八碟 (凉菜)
    (1, 106, 1, 'pending', 0, '微辣', FALSE),  -- 椒盐基围虾 (前菜)
    (1, 112, 1, 'prep', 2, NULL, FALSE),       -- 红烧肉 (中菜)
    (1, 134, 1, 'ready', 1, NULL, FALSE),      -- 菠萝炒饭 (后菜)
    (1, (SELECT id FROM dishes WHERE name = '时蔬'), 1, 'ready', -1, NULL, FALSE),  -- 时蔬 (尾菜-已出)
    
    -- 订单2：前菜(103) → 中菜(111) → 尾菜(新ID)
    (2, 103, 1, 'pending', 3, '催菜', FALSE),  -- 藜麦元宝虾 (前菜)
    (2, 111, 1, 'prep', 2, NULL, FALSE),       -- 藤椒双脆 (中菜)
    (2, (SELECT id FROM dishes WHERE name = '蛋皮汤'), 1, 'ready', -1, NULL, FALSE), -- 蛋皮汤 (尾菜-已出)
    
    -- 订单3：中菜(128) → 后菜(135) → 尾菜(新ID)
    (3, 128, 2, 'served', -1, NULL, TRUE),     -- 托炉饼 (中菜-已出)
    (3, 135, 1, 'pending', 1, NULL, FALSE),    -- 雪菜冬笋 (后菜)
    (3, (SELECT id FROM dishes WHERE name = '蛋皮汤'), 1, 'pending', 0, NULL, FALSE); -- 蛋皮汤 (尾菜)

-- 4. 验证最终结果
SELECT '=== 数据库最终状态 ===' as info;
SELECT '工位数量: ' || COUNT(*) FROM stations;
SELECT '菜品分类数量: ' || COUNT(*) FROM dish_categories;
SELECT '菜谱数量: ' || COUNT(*) FROM recipes;
SELECT '菜品数量: ' || COUNT(*) FROM dishes;
SELECT '订单数量: ' || COUNT(*) FROM orders;
SELECT '订单菜品项数量: ' || COUNT(*) FROM order_items;

-- 5. 显示完整的订单菜品分布（按标准出餐顺序）
SELECT '=== 订单菜品分布（符合MVP出餐逻辑）===' as info;
SELECT 
    o.id as 订单ID,
    o.hall_number as 台号,
    dc.name as 菜品分类,
    dc.display_order as 出餐顺序,
    d.name as 菜品名称,
    oi.status as 状态,
    oi.priority as 优先级,
    CASE oi.priority
        WHEN -1 THEN '已出'
        WHEN 0 THEN '未起菜'
        WHEN 1 THEN '不急(绿)'
        WHEN 2 THEN '等一下(黄)'
        WHEN 3 THEN '催菜(红)'
        ELSE '未知'
    END as 优先级说明
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
JOIN dishes d ON oi.dish_id = d.id
JOIN dish_categories dc ON d.category_id = dc.id
ORDER BY o.id, dc.display_order;

-- 6. 验证出餐顺序逻辑
SELECT '=== 出餐顺序验证 ===' as info;
SELECT 
    '标准出餐顺序: 凉菜(1) → 前菜(2) → 中菜(3) → 后菜(4) → 尾菜(5)' as 说明;

SELECT 
    dc.name as 分类,
    dc.display_order as 标准顺序,
    COUNT(d.id) as 菜品数量
FROM dish_categories dc
LEFT JOIN dishes d ON d.category_id = dc.id
WHERE dc.name IN ('凉菜', '前菜', '中菜', '后菜', '尾菜')
GROUP BY dc.id, dc.name, dc.display_order
ORDER BY dc.display_order;

-- 7. 显示工位分配情况
SELECT '=== 工位与菜品分类对应关系 ===' as info;
SELECT 
    s.name as 工位,
    STRING_AGG(dc.name, ', ') as 负责分类
FROM stations s
JOIN dishes d ON s.id = d.station_id
JOIN dish_categories dc ON d.category_id = dc.id
GROUP BY s.id, s.name
ORDER BY s.id;