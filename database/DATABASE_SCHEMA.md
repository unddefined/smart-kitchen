# 智能厨房系统数据库文档

## 📊 数据库概览

**数据库名称**: smart_kitchen_prod  
**数据库用户**: smart_kitchen_user  
**部署方式**: Docker容器化 (PostgreSQL 15)

## 🏗️ 表结构设计

### 核心业务表

#### 1. stations (工位表)
存储厨房各个工位信息
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(50) NOT NULL UNIQUE  -- 工位名称
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 2. dish_categories (菜品分类表) ⭐新增
存储菜品分类信息
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(50) NOT NULL UNIQUE  -- 分类名称
- description: TEXT                  -- 分类描述
- display_order: INTEGER DEFAULT 0   -- 显示顺序
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 3. dishes (菜品表)
存储菜品基本信息和归属工位
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL        -- 菜品名称
- station_id: INTEGER REFERENCES stations(id)  -- 所属工位
- category_id: INTEGER REFERENCES dish_categories(id)  -- 所属分类 ⭐新增
- shortcut_code: VARCHAR(20)         -- 快捷编码
- recipe: TEXT                       -- 关联菜谱
- countable: BOOLEAN DEFAULT FALSE   -- 是否计数（TRUE:按用餐人数计数，FALSE:固定份量）
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 4. orders (订单表)
存储客户订单主信息
```sql
- id: SERIAL PRIMARY KEY
- hall_number: VARCHAR(20) NOT NULL  -- 厅号/台号
- people_count: INTEGER NOT NULL     -- 用餐人数
- table_count: INTEGER DEFAULT 1     -- 桌数
- status: VARCHAR(20) DEFAULT 'created'  -- 订单状态
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- meal_time: VARCHAR(50)             -- 用餐时间（年月日+午/晚）
- updated_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 5. order_items (订单菜品表)
存储订单中的具体菜品项
```sql
- id: SERIAL PRIMARY KEY
- order_id: INTEGER REFERENCES orders(id) ON DELETE CASCADE
- dish_id: INTEGER REFERENCES dishes(id)
- quantity: INTEGER DEFAULT 1        -- 数量
- weight: VARCHAR(20)                -- 份量
- status: VARCHAR(20) DEFAULT 'pending'  -- 状态(pending → prep → ready → served)
- priority: INTEGER DEFAULT 0        -- 优先级
- remark: TEXT                       -- 备注
- served_at: TIMESTAMP               -- 上菜时间
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 6. users (用户表)
存储系统用户信息
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(50) NOT NULL         -- 名称
- tel: VARCHAR(20)                   -- 手机号
- avatar: TEXT                       -- 头像
- station: VARCHAR(50)               -- 工位
- password: VARCHAR(255)             -- 登陆密码
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 7. recipes (菜谱表)
存储详细菜谱信息
```sql
- id: SERIAL PRIMARY KEY
- name: VARCHAR(100) NOT NULL        -- 菜品名称
- description: TEXT                  -- 描述文字
- ingredient_list: TEXT              -- 用料
- images: TEXT[]                     -- 配图
- steps: TEXT                        -- 做法
- tags: VARCHAR(100)[]               -- 标签
- created_at: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

## 📈 视图和索引

### 视图
- `order_details`: 订单详情视图，关联订单、菜品、工位信息
- `dish_serving_order_mvp`: MVP出餐顺序视图 ⭐新增
- `order_item_serving_status_mvp`: MVP订单菜品状态视图 ⭐新增
- `serving_alerts_mvp`: MVP出餐提醒视图 ⭐新增

### 索引
- `idx_orders_status`: 订单状态索引
- `idx_orders_created_at`: 订单创建时间索引
- `idx_order_items_order_id`: 订单项关联索引
- `idx_order_items_status`: 订单项状态索引
- `idx_order_items_priority`: 订单项优先级索引 ⭐新增
- `idx_dishes_station_id`: 菜品工位关联索引
- `idx_dishes_category_id`: 菜品分类关联索引 ⭐新增
- `idx_dish_categories_display_order`: 分类显示顺序索引 ⭐新增

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
1. 热菜
2. 打荷
3. 凉菜
4. 蒸煮
5. 点心
6. 切配

### 菜品分类数据 (7个) ⭐新增
1. 凉菜 - 开胃凉菜类
2. 前菜 - 餐前小食类 ⭐重点：优先级3
3. 中菜 - 主菜热菜类 ⭐重点：优先级2
4. 点心 - 精致小点类 ⭐MVP阶段按中菜处理
5. 蒸菜 - 蒸制菜品类 ⭐MVP阶段按中菜处理
6. 后菜 - 餐后蔬菜类 ⭐重点：优先级1
7. 尾菜 - 汤品素菜类 ⭐重点：优先级1

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
- 关键业务字段添加了NOT NULL约束

## 📈 性能优化

- 关键字段建立了复合索引
- 使用了适当的约束和触发器
- 实现了视图预计算减少查询复杂度
- 时间戳字段自动更新
- 优先级字段添加了专门索引

此数据库设计完全满足MVP文档的功能需求，支持完整的出餐逻辑、订单管理、工位分配、菜品制作等核心业务流程。