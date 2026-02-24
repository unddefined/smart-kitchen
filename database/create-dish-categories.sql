-- 创建菜品分类表
CREATE TABLE IF NOT EXISTS dish_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入菜品分类数据
INSERT INTO dish_categories (name, description, display_order) VALUES
    ('凉菜', '开胃凉菜类', 1),
    ('前菜', '餐前小食类', 2),
    ('中菜', '主菜热菜类', 3),
    ('点心', '精致小点类', 4),
    ('蒸菜', '蒸制菜品类', 5),
    ('后菜', '餐后蔬菜类', 6),
    ('尾菜', '汤品素菜类', 7)
ON CONFLICT (name) DO NOTHING;

-- 验证分类数据
SELECT '=== 菜品分类创建完成 ===' as info;
SELECT id, name, description, display_order 
FROM dish_categories 
ORDER BY display_order;