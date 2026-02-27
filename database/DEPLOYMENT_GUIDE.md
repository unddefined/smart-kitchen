# 智能厨房数据库部署指南

## 📋 部署前准备

### 环境要求
- PostgreSQL 15+
- 数据库用户: `smart_kitchen_user`
- 数据库名称: `smart_kitchen_prod`
- 必要的扩展: `uuid-ossp`

### 文件清单
确保以下文件存在于database目录中：
```
database/
├── create-tables.sql              # 完整表结构定义 ✅
├── create-dish-categories.sql     # 分类数据管理 ✅
├── insert-dishes.sql              # 菜品数据插入 ✅
├── serving-logic-mvp.sql          # 出餐逻辑部署 ✅
├── validate-database.sql          # 数据库验证 ✅
├── mvp-validation-fixes.sql       # MVP校验修正 ✅
├── meal-fields-update.sql         # meal字段更新 ✅
├── convert-meal-time-to-timestamp.sql # 时间字段优化 ✅
├── DATABASE_SCHEMA.md             # 数据库文档 ✅
├── MVP_TABLE_VALIDATION_REPORT.md # MVP校验报告 ✅
├── TIME_FIELD_OPTIMIZATION.md     # 时间字段优化建议 ✅
├── DEPLOYMENT_GUIDE.md            # 部署指南 ✅
└── UPDATE_LOG.md                  # 更新日志 ✅
```

## 🚀 部署步骤

### 第一步：创建表结构
```bash
# 连接数据库并执行表结构创建
docker exec -i smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod < create-tables.sql
```

**预期输出**：
```
CREATE EXTENSION
CREATE TABLE
...
=== 数据库表结构创建完成 ===
 table_name |   status   
------------+------------
 dishes     | 创建成功
 dish_categories | 创建成功
 order_items | 创建成功
 orders     | 创建成功
 recipes    | 创建成功
 stations   | 创建成功
 users      | 创建成功
(7 rows)
```

### 第二步：MVP文档校验修正
```bash
# 执行MVP校验修正脚本
docker exec -i smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod < mvp-validation-fixes.sql
```

**修正内容**：
- 更新orders表状态枚举，添加`urged`和`done`状态
- 为dishes表添加recipe_id外键关联
- 验证表结构完整性
- 检查数据约束合规性

### 第三步：meal_time和meal_type字段更新 ⭐ **新增步骤**
```bash
# 执行meal字段更新脚本
docker exec -i smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod < meal-fields-update.sql
```

**更新内容**：
- ✅ meal_time字段调整为支持"年月日时分"格式
- ✅ 新增meal_type枚举字段（午/晚/打包）
- ✅ 安全的数据迁移，保持向后兼容
- ✅ 添加必要的索引和约束

### 第四步：初始化分类数据
```bash
# 初始化菜品分类数据
docker exec -i smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod < create-dish-categories.sql
```

**验证查询**：
```sql
-- 检查分类数据
SELECT id, name, display_order FROM dish_categories ORDER BY display_order;
```

### 第五步：插入菜品数据
```bash
# 插入完整菜品数据
docker exec -i smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod < insert-dishes.sql
```

**验证查询**：
```sql
-- 检查菜品统计数据
SELECT 
    dc.name as 分类,
    COUNT(d.id) as 菜品数量,
    COUNT(CASE WHEN d.countable = TRUE THEN 1 END) as 计数菜品数
FROM dish_categories dc
LEFT JOIN dishes d ON dc.id = d.category_id
GROUP BY dc.id, dc.name
ORDER BY dc.display_order;
```

### 第六步：部署出餐逻辑
```bash
# 部署MVP出餐逻辑
docker exec -i smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod < serving-logic-mvp.sql
```

### 第七步：完整验证
```bash
# 执行完整验证
docker exec -i smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod < validate-database.sql
```

## 🔍 验证检查清单

### 表结构验证
- [ ] 7个核心表全部创建成功
- [ ] 所有外键约束正确建立
- [ ] 必要索引全部创建
- [ ] 触发器配置正确
- [ ] MVP状态枚举完整
- [ ] **meal_time使用TIMESTAMP类型**
- [ ] **start_time字段已添加**
- [ ] **meal_time和meal_type字段正确配置**

### 数据完整性验证
- [ ] 工位数据完整（6个工位）
- [ ] 分类数据正确（7个分类，顺序正确）
- [ ] 菜品数据成功插入
- [ ] 计数菜品标识正确
- [ ] recipe_id关联正确建立
- [ ] **meal_type枚举值正确设置**
- [ ] **start_time字段逻辑正确实现**

### 性能优化验证
- [ ] **meal_time字段已优化为TIMESTAMP类型**
- [ ] 时间相关索引已创建
- [ ] 查询性能测试通过
- [ ] 时间函数使用正常

## ⚠️ 常见问题处理

### 1. 权限问题
```bash
# 确保数据库用户权限
docker exec smart-kitchen-postgres psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE smart_kitchen_prod TO smart_kitchen_user;"
```

### 2. 扩展缺失
```sql
-- 手动创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### 3. 数据冲突
```sql
-- 清理现有数据（谨慎使用）
TRUNCATE TABLE dishes, dish_categories, stations RESTART IDENTITY CASCADE;
```

### 4. 约束违反
```sql
-- 检查约束违规
SELECT conname, conrelid::regclass FROM pg_constraint WHERE contype = 'c';
```

### 5. MVP状态修正
如果遇到状态枚举问题：
```sql
-- 手动修正orders状态约束
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders 
ADD CONSTRAINT orders_status_check 
CHECK (status IN ('created', 'started', 'serving', 'urged', 'done', 'cancelled'));
```

### 6. meal字段问题
如果遇到meal字段相关问题：
```sql
-- 检查meal字段状态
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'orders' AND column_name IN ('meal_time', 'meal_type');

-- 手动添加meal_type字段
ALTER TABLE orders ADD COLUMN meal_type VARCHAR(10) CHECK (meal_type IN ('午', '晚', '打包'));
```

### 7. 时间字段优化（推荐）
如果希望获得更好的性能和功能：
```bash
# 执行时间字段优化脚本
docker exec -i smart-kitchen-postgres psql -U smart_kitchen_user -d smart_kitchen_prod < convert-meal-time-to-timestamp.sql
```

**TIMESTAMP优化优势**：
- 存储空间节省84%
- 查询性能显著提升
- 支持丰富的时间函数
- 自动数据验证

## 📊 部署后验证

### 基础功能测试
```sql
-- 测试菜品查询
SELECT d.name, dc.name as category, s.name as station 
FROM dishes d
JOIN dish_categories dc ON d.category_id = dc.id
JOIN stations s ON d.station_id = s.id
LIMIT 5;

-- 测试优先级计算
SELECT calculate_dish_priority_mvp('前菜', FALSE, 0) as priority;

-- 测试MVP状态
SELECT DISTINCT status FROM orders;
SELECT DISTINCT status FROM order_items;

-- 测试meal字段
SELECT 
    meal_time,
    meal_type,
    COUNT(*) as order_count
FROM orders 
WHERE meal_time IS NOT NULL 
GROUP BY meal_time, meal_type
ORDER BY meal_type, meal_time;
```

### 性能测试
```sql
-- 测试关键查询性能
EXPLAIN ANALYZE 
SELECT * FROM order_item_serving_status_mvp 
WHERE item_status = 'pending' 
ORDER BY priority DESC LIMIT 10;
```

### MVP功能验证
```sql
-- 验证催菜状态支持
SELECT 'urged' IN (SELECT DISTINCT status FROM orders) as urged_supported;

-- 验证recipe关联
SELECT 
    COUNT(*) as dishes_with_recipes,
    COUNT(recipe_id) as dishes_with_recipe_links
FROM dishes;

-- 验证出餐逻辑
SELECT * FROM dish_serving_order_mvp ORDER BY serving_sequence;

-- 验证meal字段功能
SELECT 
    meal_type,
    COUNT(*) as orders_count,
    AVG(people_count) as avg_people
FROM orders 
WHERE meal_type IS NOT NULL
GROUP BY meal_type
ORDER BY meal_type;
```

### 时间字段功能测试
```
-- 测试TIMESTAMP功能
SELECT 
    meal_time,
    meal_type,
    EXTRACT(HOUR FROM meal_time) as hour,
    EXTRACT(DOW FROM meal_time) as weekday,
    meal_time::DATE as date_only
FROM orders 
WHERE meal_time IS NOT NULL 
LIMIT 5;

-- 时间范围查询性能测试
EXPLAIN ANALYZE 
SELECT * FROM orders 
WHERE meal_time BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '1 day';

-- 时间统计分析
SELECT 
    meal_type,
    EXTRACT(HOUR FROM meal_time) as hour,
    COUNT(*) as order_count,
    AVG(people_count) as avg_people
FROM orders 
WHERE meal_time IS NOT NULL
GROUP BY meal_type, EXTRACT(HOUR FROM meal_time)
ORDER BY meal_type, hour;
```

## 🛠️ 维护建议

### 定期检查
- 每周执行一次完整验证脚本
- 监控数据库性能指标
- 检查约束违规情况
- 验证MVP功能一致性
- **监控时间字段查询性能**
- **定期评估TIMESTAMP优化效果**

### 备份策略
```bash
# 定期备份命令
docker exec smart-kitchen-postgres pg_dump -U smart_kitchen_user smart_kitchen_prod > backup_$(date +%Y%m%d).sql
```

### 性能监控要点
- 时间范围查询响应时间
- 时间函数计算效率
- 时间索引使用率
- 存储空间利用率
- **对比VARCHAR vs TIMESTAMP性能差异**

### 监控要点
- 表大小增长趋势
- 查询性能变化
- 约束违规频率
- 索引使用效率
- MVP状态流转正确性
- **meal_type枚举值使用情况**

## 📞 技术支持

如遇部署问题，请提供：
1. 错误信息截图
2. 执行的完整命令
3. 数据库版本信息
4. 验证脚本输出结果
5. MVP校验报告内容
6. **meal字段相关的具体问题描述**

## 📚 参考文档

- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - 完整数据库设计文档
- [MVP_TABLE_VALIDATION_REPORT.md](MVP_TABLE_VALIDATION_REPORT.md) - MVP校验详细报告
- [TIME_FIELD_OPTIMIZATION.md](TIME_FIELD_OPTIMIZATION.md) - 时间字段优化详细指南 ⭐
- [UPDATE_LOG.md](UPDATE_LOG.md) - 变更历史记录

---
**部署完成标志**：所有验证检查通过，MVP功能测试正常运行，基础功能完整可用，**时间字段已优化为TIMESTAMP类型**