-- 快速修复脚本

-- 1. 修正菜谱引用错误
UPDATE dishes SET recipe_id = 5 WHERE name = '时蔬' AND recipe_id = 6;

-- 2. 重新插入订单菜品项数据
DELETE FROM order_items;

-- 获取菜品ID
INSERT INTO order_items (order_id, dish_id, quantity, status, priority, remark, countable) VALUES
    (1, 34, 1, 'pending', 0, NULL, FALSE),   -- 美味八碟 (凉菜)
    (1, 23, 1, 'pending', 0, '微辣', FALSE), -- 椒盐基围虾 (前菜)
    (1, 11, 1, 'prep', 2, NULL, FALSE),      -- 红烧肉 (中菜)
    (1, 39, 1, 'ready', 1, NULL, FALSE),     -- 菠萝炒饭 (后菜)
    (1, 46, 1, 'ready', -1, NULL, FALSE),    -- 时蔬 (尾菜-已出)
    
    (2, 19, 1, 'pending', 3, '催菜', FALSE), -- 藜麦元宝虾 (前菜)
    (2, 9, 1, 'prep', 2, NULL, FALSE),       -- 藤椒双脆 (中菜)
    (2, 47, 1, 'ready', -1, NULL, FALSE),    -- 蛋皮汤 (尾菜-已出)
    
    (3, 26, 2, 'served', -1, NULL, TRUE),    -- 托炉饼 (中菜-已出)
    (3, 40, 1, 'pending', 1, NULL, FALSE),   -- 雪菜冬笋 (后菜)
    (3, 47, 1, 'pending', 0, NULL, FALSE);   -- 蛋皮汤 (尾菜)

-- 3. 验证结果
SELECT '=== 修复验证 ===' as info;
SELECT '菜品数量: ' || COUNT(*) FROM dishes;
SELECT '订单菜品项数量: ' || COUNT(*) FROM order_items;

-- 4. 显示订单菜品分布
SELECT '=== 订单菜品分布 ===' as info;
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