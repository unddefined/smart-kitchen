-- 智能厨房系统完整表结构定义
-- 包含所有核心表、约束、索引和触发器

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 工位表 (stations)
CREATE TABLE IF NOT EXISTS stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 菜品分类表 (dish_categories)
CREATE TABLE IF NOT EXISTS dish_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 菜品表 (dishes)
CREATE TABLE IF NOT EXISTS dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    station_id INTEGER REFERENCES stations(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES dish_categories(id) ON DELETE SET NULL,
    shortcut_code VARCHAR(20),
    recipe TEXT,
    countable BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_dish_name UNIQUE(name)
);

-- 4. 订单表 (orders)
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    hall_number VARCHAR(20) NOT NULL,
    people_count INTEGER NOT NULL CHECK (people_count > 0),
    table_count INTEGER DEFAULT 1 CHECK (table_count > 0),
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'started', 'serving', 'urged', 'done', 'cancelled')),
    meal_time TIMESTAMP,
    meal_type VARCHAR(10) CHECK (meal_type IN ('午', '晚', '打包')),
    start_time TIMESTAMP,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    remark TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. 订单菜品表 (order_items)
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    weight VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'prep', 'ready', 'served', 'cancelled')),
    priority INTEGER DEFAULT 0 CHECK (priority BETWEEN -1 AND 3),
    remark TEXT,
    served_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. 用户表 (users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    tel VARCHAR(20),
    avatar TEXT,
    station VARCHAR(50),
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'chef', 'waiter', 'staff')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 菜谱表 (recipes)
CREATE TABLE IF NOT EXISTS recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dish_id INTEGER REFERENCES dishes(id) ON DELETE CASCADE,
    description TEXT,
    ingredient_list TEXT,
    images TEXT[],
    steps TEXT,
    tags VARCHAR(100)[],
    cooking_time INTEGER, -- 分钟
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_recipe_name UNIQUE(name)
);

-- 创建索引
-- 工位相关索引
CREATE INDEX IF NOT EXISTS idx_stations_name ON stations(name);

-- 菜品分类相关索引
CREATE INDEX IF NOT EXISTS idx_dish_categories_display_order ON dish_categories(display_order);
CREATE INDEX IF NOT EXISTS idx_dish_categories_name ON dish_categories(name);

-- 菜品相关索引
CREATE INDEX IF NOT EXISTS idx_dishes_station_id ON dishes(station_id);
CREATE INDEX IF NOT EXISTS idx_dishes_category_id ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_name ON dishes(name);
CREATE INDEX IF NOT EXISTS idx_dishes_shortcut_code ON dishes(shortcut_code);
CREATE INDEX IF NOT EXISTS idx_dishes_active ON dishes(is_active);

-- 订单相关索引
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_hall_number ON orders(hall_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_meal_time ON orders(meal_time);
CREATE INDEX IF NOT EXISTS idx_orders_meal_type ON orders(meal_type);
CREATE INDEX IF NOT EXISTS idx_orders_start_time ON orders(start_time);

-- 订单菜品相关索引
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_dish_id ON order_items(dish_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_order_items_priority ON order_items(priority);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);

-- 用户相关索引
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_station ON users(station);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- 菜谱相关索引
CREATE INDEX IF NOT EXISTS idx_recipes_dish_id ON recipes(dish_id);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON recipes(is_active);

-- 复合索引
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_status_priority ON order_items(status, priority);
CREATE INDEX IF NOT EXISTS idx_order_items_order_status ON order_items(order_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_meal_time_type ON orders(meal_time, meal_type);
CREATE INDEX IF NOT EXISTS idx_orders_meal_type_start_time ON orders(meal_type, start_time);

-- 创建时间戳自动更新触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建更新时间戳触发器
CREATE TRIGGER update_stations_updated_at 
    BEFORE UPDATE ON stations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dish_categories_updated_at 
    BEFORE UPDATE ON dish_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dishes_updated_at 
    BEFORE UPDATE ON dishes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON order_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at 
    BEFORE UPDATE ON recipes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入基础数据
-- 工位数据
INSERT INTO stations (name, description) VALUES
    ('热菜', '负责热菜制作'),
    ('打荷', '负责配菜和准备工作'),
    ('凉菜', '负责凉菜制作'),
    ('蒸煮', '负责蒸制和煮制菜品'),
    ('点心', '负责点心制作'),
    ('切配', '负责食材切割和配菜')
ON CONFLICT (name) DO NOTHING;

-- 菜品分类数据
INSERT INTO dish_categories (name, description, display_order) VALUES
    ('凉菜', '开胃凉菜类', 1),
    ('前菜', '餐前小食类', 2),
    ('中菜', '主菜热菜类', 3),
    ('点心', '精致小点类', 4),
    ('蒸菜', '蒸制菜品类', 5),
    ('后菜', '餐后蔬菜类', 6),
    ('尾菜', '汤品素菜类', 7)
ON CONFLICT (name) DO NOTHING;

-- 系统管理员用户
INSERT INTO users (username, name, password, role) VALUES
    ('admin', '系统管理员', '$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ123456', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 验证表结构创建
SELECT '=== 数据库表结构创建完成 ===' as info;
SELECT table_name, '创建成功' as status 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stations', 'dish_categories', 'dishes', 'orders', 'order_items', 'users', 'recipes')
ORDER BY table_name;