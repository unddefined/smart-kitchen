# dishes表countable字段添加说明

## 背景
根据业务需求，在dishes（菜品）表中新增`countable`字段，用于标识某些菜品是否需要按照用餐人数进行计数。
例如：托炉饼等菜品需要按桌上的实际人数来计算份数。

## 字段说明
- **字段名**: `countable`
- **数据类型**: `BOOLEAN` (布尔型)
- **默认值**: `FALSE`
- **含义**: 
  - `TRUE`: 需要按用餐人数计数
  - `FALSE`: 固定份量，不按人数计算

## 实施步骤

### 方案一：使用Shell脚本执行（推荐）
```bash
# 1. 修改脚本中的数据库连接参数
vim deploy/add-countable-field.sh

# 2. 设置执行权限
chmod +x deploy/add-countable-field.sh

# 3. 执行迁移
./deploy/add-countable-field.sh
```

### 方案二：手动执行SQL
```bash
# 使用psql客户端连接数据库后执行
psql -h your-host -U your-user -d your-database -f deploy/add-countable-field.sql
```

### 方案三：通过数据库管理工具
将 `deploy/add-countable-field.sql` 文件内容复制到：
- pgAdmin
- DBeaver  
- Navicat
- 其他PostgreSQL管理工具中执行

## 手动管理模式
**重要变更**：现在采用手动管理模式，所有菜品默认countable=False，需要根据实际业务需求手动设置。

### 手动设置方法

1. **使用管理工具脚本**：
```bash
# 交互式管理工具
./scripts/manage-countable-interactive.sh
```

2. **直接SQL更新**：
```sql
-- 设置特定菜品为按人数计数
UPDATE dishes SET countable = TRUE WHERE name = '托炉饼';

-- 设置特定菜品为固定份量
UPDATE dishes SET countable = FALSE WHERE name = '宫保鸡丁';

-- 批量设置某工位的菜品
UPDATE dishes SET countable = TRUE WHERE station_id = 1;  -- 热菜工位
```

3. **使用预定义管理脚本**：
```bash
psql -h your-host -U your-user -d your-database -f deploy/manage-countable-manually.sql
```

## 验证结果
执行完成后会显示：
1. 字段添加验证信息
2. 当前countable字段的统计信息
3. 默认为FALSE的菜品示例

## 后续操作
1. 建议在前端界面中增加对countable字段的显示和编辑功能
2. 在订单处理逻辑中考虑countable字段的影响
3. 根据实际业务需要手动设置相应的菜品

## 注意事项
- 此操作不会影响现有数据
- 字段添加具有幂等性，可重复执行
- 建议在生产环境执行前先在测试环境验证
- 所有菜品初始状态为countable=False，需要手动配置