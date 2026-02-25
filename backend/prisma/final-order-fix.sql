-- 最终订单菜品项修复脚本

-- 1. 修正菜谱引用错误
UPDATE dishes SET recipe_id = 5 WHERE name = '时蔬' AND recipe_id = 6;

-- 2. 清空并重新插入订单菜品项数据
DELETE FROM order_items;

-- 按照出餐顺序插入测试数据（使用实际的菜品ID）
INSERT INTO order_items (order_id, dish_id, quantity, status, priority, remark, countable) VALUES
    -- 订单1：凉菜(102) → 前菜(106) → 中菜(111) → 后菜(139) → 尾菜(146)
    (1, 102, 1, 'pending', 0, NULL, FALSE),    -- 美味八碟 (凉菜)
    (1, 106, 1, 'pending', 0, '微辣', FALSE),  -- 椒盐基围虾 (前菜)
    (1, 111, 1, 'prep', 2, NULL, FALSE),       -- 红烧肉 (中菜)
    (1, 139, 1, 'ready', 1, NULL, FALSE),      -- 菠萝炒饭 (后菜)
    (1, 146, 1, 'ready', -1, NULL, FALSE),     -- 时蔬 (尾菜-已出)
    
    -- 订单2：前菜(103) → 中菜(109) → 尾菜(147)
    (2, 103, 1, 'pending', 3, '催菜', FALSE),  -- 藜麦元宝虾 (前菜)
    (2, 109, 1, 'prep', 2, NULL, FALSE),       -- 藤椒双脆 (中菜)
    (2, 147, 1, 'ready', -1, NULL, FALSE),     -- 蛋皮汤 (尾菜-已出)
    
    -- 订单3：中菜(126) → 后菜(140) → 尾菜(147)
    (3, 126, 2, 'served', -1, NULL, TRUE),     -- 托炉饼 (中菜-已出)
    (3, 140, 1, 'pending', 1, NULL, FALSE),    -- 雪菜冬笋 (后菜)
    (3, 147, 1, 'pending', 0, NULL, FALSE);    -- 蛋皮汤 (尾菜)

-- 3. 验证修复结果
SELECT '=== 最终验证结果 ===' as info;
SELECT '工位数量: ' || COUNT(*) FROM stations;
SELECT '菜品分类数量: ' || COUNT(*) FROM dish_categories;
SELECT '菜谱数量: ' || COUNT(*) FROM recipes;
SELECT '菜品数量: ' || COUNT(*) FROM dishes;
SELECT '订单数量: ' || COUNT(*) FROM orders;
SELECT '订单菜品项数量: ' || COUNT(*) FROM order_items;

-- 4. 显示完整的订单菜品分布（按出餐顺序）
SELECT '=== 订单菜品分布（按标准出餐顺序）===' as info;
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

-- 5. 统计各分类菜品数量
SELECT '=== 各分类菜品统计 ===' as info;
SELECT 
    dc.name as 分类,
    dc.display_order as 出餐顺序,
    COUNT(d.id) as 菜品数量
FROM dish_categories dc
LEFT JOIN dishes d ON d.category_id = dc.id
GROUP BY dc.id, dc.name, dc.display_order
ORDER BY dc.display_order;