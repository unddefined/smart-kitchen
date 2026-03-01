# Order Items Quantity 支持一位小数变更说明

## 变更概述

本次更新将 `order_items.quantity` 字段从整数类型改为支持一位小数的 decimal 类型，以满足业务需求中需要精确到 0.1 份的场景。

## 变更详情

### 1. 数据库变更

**字段类型变更：**
- 原类型：`INTEGER`
- 新类型：`DECIMAL(3,1)`
- 数值范围：0.1 - 99.9
- 精度：支持一位小数

**迁移脚本：**
```sql
-- database/update-quantity-to-decimal.sql
ALTER TABLE order_items ADD COLUMN quantity_decimal DECIMAL(3,1) DEFAULT 1.0;
UPDATE order_items SET quantity_decimal = quantity::DECIMAL(3,1);
ALTER TABLE order_items DROP COLUMN quantity;
ALTER TABLE order_items RENAME COLUMN quantity_decimal TO quantity;
```

### 2. Prisma Schema 变更

**schema.prisma 更新：**
```prisma
model OrderItem {
  // ... 其他字段
  quantity  Decimal  @default(1.0) @db.Decimal(3, 1)  // 支持一位小数，最大值99.9
  // ... 其他字段
}
```

### 3. 后端服务变更

#### OrdersService 更新
- `addOrderItem` 方法增加了 quantity 字段的小数处理逻辑
- 添加了数值范围验证（0.1 - 99.9）
- 自动保留一位小数精度

#### ServingService 更新
- 在返回数据时将 Decimal 类型转换为 number 类型
- 保持与前端的兼容性

### 4. 前端兼容性

前端代码无需修改，因为：
- Vue 模板中直接显示 `{{ dish.quantity }}` 会自动处理
- JavaScript 的 number 类型天然支持小数
- 现有的显示逻辑不受影响

## 使用示例

### API 请求示例
```json
{
  "orderId": 1,
  "dishId": 101,
  "quantity": 1.5,
  "status": "pending"
}
```

### 响应数据示例
```json
{
  "id": 1,
  "orderId": 1,
  "dishId": 101,
  "quantity": 1.5,
  "status": "pending"
}
```

### 前端显示示例
```vue
<!-- OrderView.vue 中的显示 -->
<span class="dish-quantity">×{{ dish.quantity }}</span>
<!-- 显示效果：×1.5 -->
```

## 验证测试

### 1. 数据库验证
```sql
-- 验证字段类型
SELECT column_name, data_type, numeric_precision, numeric_scale
FROM information_schema.columns 
WHERE table_name = 'order_items' AND column_name = 'quantity';

-- 测试数据插入
INSERT INTO order_items (order_id, dish_id, quantity, status) 
VALUES (1, 101, 2.5, 'pending');

-- 验证查询结果
SELECT id, quantity FROM order_items WHERE id = LAST_INSERT_ID();
```

### 2. API 测试
```bash
# 创建带小数quantity的订单项
curl -X POST http://localhost:3000/orders/1/items \
  -H "Content-Type: application/json" \
  -d '{"dishId": 101, "quantity": 1.5, "status": "pending"}'

# 查询订单详情
curl http://localhost:3000/orders/1
```

### 3. 前端测试
1. 在订单录入界面输入小数数量
2. 验证订单详情页面正确显示小数
3. 检查总览页面的数量显示

## 注意事项

1. **数据迁移**：现有整数数据会自动转换为小数（如 2 → 2.0）
2. **精度控制**：所有输入会被四舍五入到一位小数
3. **范围限制**：quantity 必须在 0.1 到 99.9 之间
4. **向后兼容**：整数输入仍然有效，会自动转换为小数格式

## 部署步骤

1. 执行数据库迁移脚本
2. 更新 Prisma schema
3. 重新生成 Prisma Client
4. 部署后端服务
5. 验证功能正常

```bash
# 执行迁移
psql -d your_database -f database/update-quantity-to-decimal.sql

# 更新 Prisma
cd backend
npx prisma generate
npm run build

# 部署服务
pm2 restart smart-kitchen-backend
```

## 影响范围

- **数据库**：order_items 表结构变更
- **后端 API**：支持小数 quantity 输入
- **前端显示**：自动支持小数显示
- **现有数据**：无缝迁移，保持兼容性

## 版本信息

- **变更版本**：v1.1.0
- **生效时间**：立即生效
- **兼容性**：向后兼容