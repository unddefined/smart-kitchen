# 菜品分类和数据管理系统

## 概述
根据菜品库.md文件内容，为数据库新增了菜品分类表，并录入了完整的菜品数据。菜谱部分按照要求只新增了id和name字段。

## 新增的表结构

### dish_categories (菜品分类表)
```sql
CREATE TABLE dish_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,          -- 分类名称
    description TEXT,                           -- 分类描述
    display_order INTEGER DEFAULT 0,           -- 显示顺序
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### dishes表更新
为dishes表添加了category_id外键，关联到dish_categories表。

## 菜品分类体系

系统包含以下7个菜品分类：

1. **凉菜** - 开胃凉菜类 (display_order: 1)
2. **前菜** - 餐前小食类 (display_order: 2)  
3. **中菜** - 主菜热菜类 (display_order: 3)
4. **点心** - 精致小点类 (display_order: 4)
5. **蒸菜** - 蒸制菜品类 (display_order: 5)
6. **后菜** - 餐后蔬菜类 (display_order: 6)
7. **尾菜** - 汤品素菜类 (display_order: 7)

## 文件说明

### 数据库脚本
- `database/create-dish-categories.sql` - 创建菜品分类表和基础数据
- `database/insert-dishes.sql` - 录入完整菜品数据
- `database/insert-recipes-basic.sql` - 创建菜谱基础数据（仅id和name）

### 执行脚本
- `scripts/setup-dish-data.sh` - Linux/Mac 环境一键执行脚本
- `scripts/setup-dish-data.bat` - Windows 环境一键执行脚本

## 执行步骤

### 方法一：使用一键执行脚本（推荐）

**Linux/Mac环境：**
```bash
chmod +x scripts/setup-dish-data.sh
./scripts/setup-dish-data.sh
```

**Windows环境：**
```cmd
scripts\setup-dish-data.bat
```

### 方法二：分步手动执行

1. 创建菜品分类表：
```bash
psql -h localhost -U postgres -d smart_kitchen_dev -f database/create-dish-categories.sql
```

2. 录入菜品数据：
```bash
psql -h localhost -U postgres -d smart_kitchen_dev -f database/insert-dishes.sql
```

3. 创建菜谱基础数据：
```bash
psql -h localhost -U postgres -d smart_kitchen_dev -f database/insert-recipes-basic.sql
```

## 数据统计

执行完成后，系统将包含：
- **7个菜品分类**
- **约50个具体菜品**
- **对应的菜谱基础记录**

## 特殊标记说明

部分菜品名称中标注了"（计数）"，表示这些菜品需要按用餐人数计算：
- 椒盐排骨（计数）
- 托炉饼（计数）
- 小笼馒头（计数）
- 手工米糕（计数）
- 蒜蓉小鲍鱼（计数）
- 乌米饭（计数）
- 铁板豆腐（计数）
- 沙拉牛排（计数）

## 验证查询

执行完成后可以使用以下SQL验证数据：

```sql
-- 查看分类统计
SELECT 
    dc.name as 分类,
    COUNT(d.id) as 菜品数量
FROM dish_categories dc
LEFT JOIN dishes d ON dc.id = d.category_id
GROUP BY dc.id, dc.name
ORDER BY dc.display_order;

-- 查看需要计数的菜品
SELECT d.name as 菜品名称
FROM dishes d
WHERE d.name LIKE '%（计数）'
ORDER BY d.name;
```

## 注意事项

- 脚本具有幂等性，可重复执行
- 不会影响现有数据
- 建议在生产环境执行前先在测试环境验证
- 菜谱数据仅为基础结构，后续可根据需要补充详细制作工艺