-- 厨房实时任务调度系统数据库初始化脚本
-- 基于MVP文档和菜品库文档

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS dishes CASCADE;
DROP TABLE IF EXISTS dish_categories CASCADE;
DROP TABLE IF EXISTS stations CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 创建用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    tel VARCHAR(20),
    avatar TEXT,
    station VARCHAR(50),
    password VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建工位表
CREATE TABLE stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建菜品分类表
CREATE TABLE dish_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建菜谱表
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    ingredient_list TEXT,
    images TEXT[],
    steps TEXT,
    tags TEXT[],
    dish_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建菜品表
CREATE TABLE dishes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    station_id INTEGER NOT NULL REFERENCES stations(id),
    category_id INTEGER NOT NULL REFERENCES dish_categories(id),
    shortcut_code VARCHAR(20),
    recipe_id INTEGER REFERENCES recipes(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建订单表
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    hall_number VARCHAR(20) NOT NULL,
    people_count INTEGER NOT NULL,
    table_count INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    meal_time VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建订单菜品表
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    dish_id INTEGER NOT NULL REFERENCES dishes(id),
    quantity INTEGER DEFAULT 1,
    weight VARCHAR(20),
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    remark TEXT,
    countable BOOLEAN DEFAULT FALSE,
    served_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引提高查询性能
CREATE INDEX idx_dishes_station_id ON dishes(station_id);
CREATE INDEX idx_dishes_category_id ON dishes(category_id);
CREATE INDEX idx_dishes_recipe_id ON dishes(recipe_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_meal_time ON orders(meal_time);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_dish_id ON order_items(dish_id);
CREATE INDEX idx_order_items_status ON order_items(status);

-- 插入基础工位数据
INSERT INTO stations (name) VALUES 
    ('凉菜'),  ('点心'), 
    ('蒸菜'),  ('打荷'), ('切配');

-- 插入菜品分类数据
INSERT INTO dish_categories (name, description, display_order) VALUES 
    ('凉菜', '开胃凉菜类', 1),
    ('前菜', '开胃前菜类', 2),
    ('中菜', '主菜类', 3),
    ('点心', '精致点心类', 4),
    ('蒸菜', '蒸制菜品类', 5),
    ('后菜', '配菜类', 6),
    ('尾菜', '收尾菜品类', 7),
    ('主食', '米饭面条等主食', 9);

-- 插入基础菜谱数据
INSERT INTO recipes (name, description, ingredient_list, steps, tags) VALUES
    ('红烧肉', '传统经典红烧肉，肥而不腻', '五花肉500g,冰糖30g,生抽50ml,老抽20ml,料酒30ml,葱姜适量', '1.五花肉切块焯水 2.炒糖色 3.煸炒肉块 4.加调料炖煮 5.收汁装盘', ARRAY['中菜', '经典', '家常']),
    ('托炉饼', '传统炉饼，香脆可口', '面粉300g,温水150ml,盐3g,食用油适量,芝麻适量', '1.面粉和面 2.分割擀饼 3.刷油撒芝麻 4.炉火烘烤 5.出炉切块', ARRAY['中菜', '传统', '面食']),
    ('小笼馒头', '皮薄馅嫩，汤汁丰富', '面粉200g,猪肉馅150g,皮冻100g,葱姜适量,调料适量', '1.制作皮冻 2.调制肉馅 3.和面擀皮 4.包制成型 5.蒸制15分钟', ARRAY['点心', '经典', '汤包']),
    ('清蒸大黄鱼', '保持原汁原味，鲜美无比', '大黄鱼1条,葱丝适量,姜丝适量,蒸鱼豉油30ml,料酒15ml', '1.黄鱼处理洗净 2.腌制去腥 3.摆盘加料 4.大火蒸制 5.淋热油调味', ARRAY['蒸菜', '清淡', '海鲜']),
    ('时蔬', '时令蔬菜，清淡爽口', '时令青菜300g,蒜蓉10g,盐适量,食用油适量', '1.蔬菜清洗 2.蒜蓉爆香 3.下菜翻炒 4.调味出锅', ARRAY['尾菜', '清淡', '时蔬']);

-- 插入基础菜品数据
INSERT INTO dishes (name, station_id, category_id, shortcut_code, recipe_id, countable) VALUES
    -- 凉菜类
    ('三文鱼拼鹅肝', 1, 1, 'SWSPGH', NULL, FALSE),
    ('美味八碟', 1, 1, 'MWBD', NULL, FALSE),
    
    -- 前菜类
    ('藜麦元宝虾', 2, 2, 'LMYYX', NULL, FALSE),
    ('盐水河虾', 2, 2, 'YSHX', NULL, FALSE),
    ('红汤油爆河虾', 2, 2, 'HTYBHX', NULL, FALSE),
    ('椒盐基围虾', 2, 2, 'JYJWX', NULL, FALSE),
    
    -- 中菜类
    ('红烧肉', 3, 3, 'HSR', 1, FALSE),
    ('藤椒双脆', 3, 3, 'TZSC', NULL, FALSE),
    ('托炉饼', 3, 3, 'TLB', 2, TRUE),
    ('椒盐排骨', 3, 3, 'JYGP', NULL, TRUE),
    
    -- 点心类
    ('小笼馒头', 4, 4, 'XLMT', 3, TRUE),
    ('手工米糕', 4, 4, 'SGMG', NULL, TRUE),
    
    -- 蒸菜类
    ('清蒸大黄鱼', 5, 5, 'QZDHY', 4, FALSE),
    ('蒜蓉小鲍鱼', 5, 5, 'TRXBY', NULL, TRUE),
    
    -- 后菜类
    ('菠萝炒饭', 6, 6, 'PLCF', NULL, FALSE),
    
    -- 尾菜类
    ('时蔬', 7, 7, 'SS', 5, FALSE),
    ('蛋皮汤', 7, 7, 'DPT', NULL, FALSE);

-- 插入测试订单数据
INSERT INTO orders (hall_number, people_count, table_count, status, meal_time) VALUES
    ('A01', 4, 1, 'created', '2024-12-01 午餐'),
    ('B02', 2, 1, 'started', '2024-12-01 晚餐'),
    ('C03', 6, 2, 'serving', '2024-12-01 午餐');

-- 插入订单菜品项数据
INSERT INTO order_items (order_id, dish_id, quantity, status, priority, remark, countable) VALUES
    (1, 7, 1, 'pending', 0, '微辣', FALSE),  -- 红烧肉
    (1, 9, 2, 'prep', 2, '少盐', TRUE),     -- 托炉饼
    (1, 15, 1, 'ready', 1, NULL, FALSE),    -- 时蔬
    
    (2, 8, 1, 'pending', 3, '催菜', FALSE),  -- 藤椒双脆
    (2, 11, 3, 'prep', 2, NULL, TRUE),      -- 小笼馒头
    (2, 13, 1, 'ready', -1, NULL, FALSE),   -- 清蒸大黄鱼
    
    (3, 7, 1, 'served', -1, NULL, FALSE),   -- 红烧肉
    (3, 10, 1, 'pending', 1, NULL, TRUE),   -- 椒盐排骨
    (3, 16, 1, 'pending', 0, NULL, FALSE);  -- 蛋皮汤

-- 验证数据插入
SELECT '工位数量: ' || COUNT(*) FROM stations;
SELECT '菜品分类数量: ' || COUNT(*) FROM dish_categories;
SELECT '菜谱数量: ' || COUNT(*) FROM recipes;
SELECT '菜品数量: ' || COUNT(*) FROM dishes;
SELECT '订单数量: ' || COUNT(*) FROM orders;
SELECT '订单菜品项数量: ' || COUNT(*) FROM order_items;