# 智能厨房系统数据库文档

## 📊 数据库概览

**数据库名称**: smart_kitchen_prod  
**数据库用户**: smart_kitchen
**部署方式**: Docker容器化 (PostgreSQL 15)

## 🏗️ 表结构设计

### 核心业务表

#### 1. stations (工位表)
存储厨房各个工位信息
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(50) NOT NULL UNIQUE     -- 工位名称
- description: TEXT                     -- 工位描述
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
**约束**: name字段唯一约束

#### 2. dish_categories (菜品分类表)
存储菜品分类信息
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(50) NOT NULL UNIQUE     -- 分类名称
- description: TEXT                     -- 分类描述
- display_order: INTEGER DEFAULT 0     -- 显示顺序
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
**约束**: name字段唯一约束，display_order用于排序

#### 3. dishes (菜品表)
存储菜品基本信息和归属工位
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL          -- 菜品名称
- station_id: INTEGER REFERENCES stations(id) ON DELETE SET NULL  -- 所属工位
- category_id: INTEGER REFERENCES dish_categories(id) ON DELETE SET NULL  -- 所属分类
- shortcut_code: VARCHAR(20)           -- 快捷编码
- recipe: TEXT                         -- 关联菜谱
- countable: BOOLEAN DEFAULT FALSE     -- 是否计数（TRUE:按用餐人数计数，FALSE:固定份量）
- need_prep: BOOLEAN DEFAULT FALSE     -- 是否需要预处理（如裹粉、蒸、预炸），如否则跳过status.prep
- price: DECIMAL(10,2) DEFAULT 0.00    -- 价格
- is_active: BOOLEAN DEFAULT TRUE      -- 是否启用
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
**约束**: name字段唯一约束，外键约束

#### 4. orders (订单表)
存储客户订单主信息
```sql
- id: SERIAL PRIMARY KEY
- order_number: VARCHAR(50) NOT NULL UNIQUE  -- 订单编号
- hall_number: VARCHAR(20) NOT NULL          -- 台号
- people_count: INTEGER NOT NULL CHECK (people_count > 0)  -- 用餐人数
- table_count: INTEGER DEFAULT 1 CHECK (table_count > 0)   -- 桌数
- status: VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'started', 'serving', 'urged', 'done', 'cancelled'))  -- 订单状态
- meal_time: TIMESTAMP                     -- 用餐时间（年月日时分）⭐ 推荐使用TIMESTAMP类型
- meal_type: VARCHAR(10) CHECK (meal_type IN ('午', '晚'))  -- 用餐类型
- start_time: TIMESTAMP                    -- 起菜时间（若为打包菜，start_time = meal_time）
- total_amount: DECIMAL(10,2) DEFAULT 0.00  -- 总金额
- remark: TEXT                             -- 备注
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
**约束**: order_number唯一约束，状态和meal_type枚举约束

#### 5. order_items (订单菜品表)
存储订单中的具体菜品项
```sql
- id: SERIAL PRIMARY KEY
- order_id: INTEGER REFERENCES orders(id) ON DELETE CASCADE  -- 订单ID
- dish_id: INTEGER REFERENCES dishes(id) ON DELETE CASCADE   -- 菜品ID
- quantity: INTEGER DEFAULT 1 CHECK (quantity > 0)           -- 数量
- weight: VARCHAR(20)                                        -- 份量
- status: VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'prep', 'ready', 'served', 'cancelled'))  -- 状态
- priority: INTEGER DEFAULT 0 CHECK (priority BETWEEN -1 AND 3)  -- 优先级
- remark: TEXT                                               -- 备注
- served_at: TIMESTAMP                                       -- 上菜时间
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
**约束**: 外键级联删除，数量和优先级检查约束

#### 6. users (用户表)
存储系统用户信息
```sql
- id: SERIAL PRIMARY KEY
- username: VARCHAR(50) NOT NULL UNIQUE                      -- 用户名
- name: VARCHAR(50) NOT NULL                                 -- 姓名
- tel: VARCHAR(20)                                           -- 手机号
- avatar: TEXT                                               -- 头像
- station: VARCHAR(50)                                       -- 工位
- password: VARCHAR(255) NOT NULL                            -- 登录密码
- role: VARCHAR(20) DEFAULT 'staff' CHECK (role IN ('admin', 'chef', 'waiter', 'staff'))  -- 角色
- is_active: BOOLEAN DEFAULT TRUE                            -- 是否激活
- last_login: TIMESTAMP                                      -- 最后登录时间
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
**约束**: username唯一约束，角色枚举约束

#### 7. recipes (菜谱表)
存储详细菜谱信息
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL                                -- 菜谱名称
- dish_id: INTEGER REFERENCES dishes(id) ON DELETE CASCADE   -- 关联菜品
- description: TEXT                                          -- 描述文字
- ingredient_list: TEXT                                      -- 用料
- images: TEXT[]                                             -- 配图数组
- steps: TEXT                                                -- 做法步骤
- tags: VARCHAR(100)[]                                       -- 标签数组
- cooking_time: INTEGER                                      -- 制作时间(分钟)
- difficulty_level: INTEGER CHECK (difficulty_level BETWEEN 1 AND 5)  -- 难度等级
- is_active: BOOLEAN DEFAULT TRUE                            -- 是否启用
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```
**约束**: name字段唯一约束，难度等级检查约束，外键级联删除

## 📈 索引设计

### 单列索引
- `idx_stations_name`: stations.name
- `idx_dish_categories_display_order`: dish_categories.display_order
- `idx_dish_categories_name`: dish_categories.name
- `idx_dishes_station_id`: dishes.station_id
- `idx_dishes_category_id`: dishes.category_id
- `idx_dishes_name`: dishes.name
- `idx_dishes_shortcut_code`: dishes.shortcut_code
- `idx_dishes_active`: dishes.is_active
- `idx_orders_status`: orders.status
- `idx_orders_created_at`: orders.created_at
- `idx_orders_hall_number`: orders.hall_number
- `idx_orders_order_number`: orders.order_number
- `idx_orders_meal_time`: orders.meal_time ⭐ 新增时间索引
- `idx_orders_meal_type`: orders.meal_type ⭐ 新增类型索引
- `idx_order_items_order_id`: order_items.order_id ⭐ 订单菜品关联索引
- `idx_order_items_dish_id`: order_items.dish_id ⭐ 菜品关联索引
- `idx_order_items_status`: order_items.status ⭐ 状态查询索引
- `idx_order_items_priority`: order_items.priority ⭐ 优先级查询索引
- `idx_order_items_created_at`: order_items.created_at ⭐ 时间排序索引
- `idx_users_username`: users.username
- `idx_users_station`: users.station
- `idx_users_role`: users.role
- `idx_users_active`: users.is_active
- `idx_recipes_dish_id`: recipes.dish_id
- `idx_recipes_name`: recipes.name
- `idx_recipes_active`: recipes.is_active

### 复合索引
- `idx_orders_status_created`: (orders.status, orders.created_at)
- `idx_order_items_status_priority`: (order_items.status, order_items.priority) ⭐ 状态优先级复合索引
- `idx_order_items_order_status`: (order_items.order_id, order_items.status) ⭐ 订单状态复合索引
- `idx_orders_meal_time_type`: (orders.meal_time, orders.meal_type) ⭐ 新增时间类型复合索引

## ⚡ 触发器

所有表都配置了自动更新时间戳触发器：
- `update_updated_at_column()`: 自动更新updated_at字段
- 每个表都有对应的BEFORE UPDATE触发器

## 🎯 特殊字段说明

### countable 字段（菜品表）
用于标识菜品是否需要按用餐人数计数：
- **TRUE**: 需要按用餐人数计算份量（如托炉饼、椒盐排骨等）
- **FALSE**: 固定份量菜品（默认值）

### priority 字段（订单菜品表）⭐重要
遵循MVP文档的优先级体系：
- **3**: 红色卡片 - 优先出(催菜)
- **2**: 黄色卡片 - 等一下
- **1**: 绿色卡片 - 不急
- **0**: 灰色卡片 - 未起菜
- **-1**: 灰色卡片 - 已出

### status 字段（订单菜品表）⭐重要
遵循MVP文档的状态流转：
- **pending**: 未起菜
- **prep**: 制作中
- **ready**: 已完成（准备完成）
- **served**: 已上菜
- **cancelled**: 已取消

## 🎯 基础数据

### 工位数据 (6个)
1. 热菜 - 负责热菜制作
2. 打荷 - 负责配菜和准备工作
3. 凉菜 - 负责凉菜制作
4. 蒸煮 - 负责蒸制和煮制菜品
5. 点心 - 负责点心制作
6. 切配 - 负责食材切割和配菜

### 菜品分类数据 (7个)
1. 凉菜 - 开胃凉菜类 (显示顺序: 1)
2. 前菜 - 餐前小食类 (显示顺序: 2) ⭐重点：优先级3
3. 中菜 - 主菜热菜类 (显示顺序: 3) ⭐重点：优先级2
4. 点心 - 精致小点类 (显示顺序: 4) ⭐MVP阶段按中菜处理
5. 蒸菜 - 蒸制菜品类 (显示顺序: 5) ⭐MVP阶段按中菜处理
6. 后菜 - 餐后蔬菜类 (显示顺序: 6) ⭐重点：优先级1
7. 尾菜 - 汤品素菜类 (显示顺序: 7) ⭐重点：优先级1

### 出餐顺序规则 ⭐严格按照MVP文档
凉菜 → 前菜 → 中菜/点心/蒸菜 → 后菜 → 尾菜

### 优先级默认设置 ⭐严格按照MVP文档
- 前菜：优先级3（红色催菜）
- 中菜：优先级2（黄色等待）
- 后菜：优先级1（绿色不急）
- 尾菜：优先级1（绿色不急）
- 点心：优先级2（MVP阶段按中菜处理）
- 蒸菜：优先级2（MVP阶段按中菜处理）
- 凉菜：优先级3（MVP阶段按前菜处理）
- 后来加菜：优先级3（统一催菜级别）

## 🔧 管理命令

### 数据库连接
```bash
# 进入数据库交互模式
docker exec -it smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod

# 执行SQL文件
docker exec -i smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod < init.sql
```

### 备份恢复
```bash
# 创建备份
./db-manager.sh backup

# 恢复备份
./db-manager.sh restore backup_20260218_143000.sql

# 列出备份
./db-manager.sh list-backups
```

### 状态检查
```bash
# 检查数据库连接
docker exec smart-kitchen-postgres pg_isready -U smart_kitchen_user -d smart_kitchen_prod

# 查看所有表
\dt

# 查看表结构
\d table_name

# 查看MVP出餐配置
SELECT * FROM dish_serving_order_mvp ORDER BY serving_sequence;
```

## 🛡️ 安全配置

- 用户权限已授予smart_kitchen_user用户
- 密码已安全存储在服务器文件中
- 数据库端口仅对容器内部开放
- 启用了外键约束保证数据一致性
- 关键业务字段添加了NOT NULL约束和检查约束

## 📈 性能优化

- 关键字段建立了复合索引
- 使用了适当的约束和触发器
- 实现了视图预计算减少查询复杂度
- 时间戳字段自动更新
- 优先级字段添加了专门索引
- 合理的外键级联策略

此数据库设计完全满足MVP文档的功能需求，支持完整的出餐逻辑、订单管理、工位分配、菜品制作等核心业务流程.