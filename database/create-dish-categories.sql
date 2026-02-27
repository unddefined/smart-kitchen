-- 菜品分类数据管理脚本
-- 仅处理分类数据的插入、更新和验证

-- 插入/更新菜品分类数据（严格按照文档规范顺序）
INSERT INTO dish_categories (name, description, display_order) VALUES
    ('凉菜', '开胃凉菜类', 1),
    ('前菜', '餐前小食类', 2),
    ('中菜', '主菜热菜类', 3),
    ('点心', '精致小点类', 4),
    ('蒸菜', '蒸制菜品类', 5),
    ('后菜', '餐后蔬菜类', 6),
    ('尾菜', '汤品素菜类', 7)
ON CONFLICT (name) 
DO UPDATE SET 
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    updated_at = CURRENT_TIMESTAMP;

-- 验证分类数据完整性
SELECT '=== 菜品分类验证 ===' as info;
SELECT 
    id,
    name,
    description,
    display_order,
    CASE 
        WHEN name = '凉菜' AND display_order = 1 THEN '✓ 正确'
        WHEN name = '前菜' AND display_order = 2 THEN '✓ 正确'
        WHEN name = '中菜' AND display_order = 3 THEN '✓ 正确'
        WHEN name = '点心' AND display_order = 4 THEN '✓ 正确'
        WHEN name = '蒸菜' AND display_order = 5 THEN '✓ 正确'
        WHEN name = '后菜' AND display_order = 6 THEN '✓ 正确'
        WHEN name = '尾菜' AND display_order = 7 THEN '✓ 正确'
        ELSE '✗ 错误'
    END as validation_status
FROM dish_categories
ORDER BY display_order;

-- 显示分类统计信息
SELECT '=== 分类统计 ===' as info;
SELECT 
    COUNT(*) as 总分类数,
    COUNT(CASE WHEN display_order <= 2 THEN 1 END) as 前期分类数,
    COUNT(CASE WHEN display_order BETWEEN 3 AND 5 THEN 1 END) as 中期分类数,
    COUNT(CASE WHEN display_order >= 6 THEN 1 END) as 后期分类数
FROM dish_categories;

-- 检查分类关联的菜品数量
SELECT '=== 分类菜品关联检查 ===' as info;
SELECT 
    dc.name as 分类名称,
    dc.display_order as 显示顺序,
    COALESCE(COUNT(d.id), 0) as 关联菜品数,
    CASE 
        WHEN COUNT(d.id) > 0 THEN '✓ 有关联菜品'
        ELSE '⚠ 无关联菜品'
    END as 状态
FROM dish_categories dc
LEFT JOIN dishes d ON dc.id = d.category_id
GROUP BY dc.id, dc.name, dc.display_order
ORDER BY dc.display_order;