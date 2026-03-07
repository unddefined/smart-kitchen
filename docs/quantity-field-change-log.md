# Order Items Quantity 字段类型变更说明

## 变更概述

将 `order_items` 表中的 `quantity` 字段从 `DECIMAL(3,1)`（支持一位小数）改为 `INTEGER`（整数类型）。

## 变更原因

- 简化业务逻辑：实际使用中菜品数量不需要小数
- 减少数据类型转换的复杂性
- 提高数据一致性和验证准确性

## 影响的文件和组件

### 1. 数据库架构

**文件**: `backend/prisma/schema.prisma`

**变更内容**:
```prisma
model OrderItem {
  quantity  Int       @default(1) // 从 Decimal 改为 Int
  // ... 其他字段
}
```

### 2. 数据库迁移

**文件**: `backend/prisma/migrations/20260307141808_change_quantity_to_integer/migration.sql`

**SQL 变更**:
```sql
ALTER TABLE "order_items" 
ALTER COLUMN "quantity" TYPE INTEGER USING quantity::INTEGER,
ALTER COLUMN "quantity" SET DEFAULT 1;
```

### 3. 后端服务层

**文件**: `backend/src/orders/orders.service.ts`

#### 3.1 addOrderItem 方法
```typescript
// 之前：支持一位小数
let quantity = 1.0;
quantity = parseFloat(createOrderItemDto.quantity.toString());
quantity = Math.round(quantity * 10) / 10;

// 现在：只支持整数
let quantity = 1;
quantity = parseInt(createOrderItemDto.quantity.toString(), 10);
// 验证范围：1-99
if (isNaN(quantity) || quantity < 1 || quantity > 99) {
  throw new Error('数量必须是 1 到 99 之间的整数');
}
```

#### 3.2 updateOrderItem 方法
```typescript
// 处理 quantity 字段，改为整数类型
if (updateData.quantity !== undefined) {
  const quantity = parseInt(updateData.quantity.toString(), 10);
  if (isNaN(quantity) || quantity < 1 || quantity > 99) {
    throw new Error('数量必须是 1 到 99 之间的整数');
  }
  dataToUpdate.quantity = quantity;
}
```

### 4. 前端组件

**文件**: `frontend/src/components/DishSelector.vue`

#### 4.1 移除 +0.5 按钮
```vue
<!-- 之前：包含 +0.5 按钮 -->
<button @click="addHalfQuantity" class="...">+0.5</button>

<!-- 现在：移除了 +0.5 按钮 -->
```

#### 4.2 移除 addHalfQuantity 方法
```javascript
// 之前：支持 0.5 增量
const addHalfQuantity = () => {
  currentDish.value.quantity = parseFloat((currentQuantity + 0.5).toFixed(1));
};

// 现在：该方法已被移除
```

### 5. 文档更新

**文件**: `docs/MVP文档.md`

**变更内容**:
```sql
-- 之前：quantity -- 单桌数量
-- 现在：quantity -- 数量（整数，1-99）
```

## 数据验证规则变更

### 之前（小数）
- 类型：`DECIMAL(3,1)`
- 范围：0.1 - 99.9
- 精度：一位小数
- 示例值：1.0, 1.5, 2.0, 99.9

### 现在（整数）
- 类型：`INTEGER`
- 范围：1 - 99
- 精度：整数
- 示例值：1, 2, 3, ..., 99

## API 接口变更

所有涉及 `quantity` 字段的 API 接口现在都只接受整数值：

### POST /api/orders/:id/items
```json
{
  "dishId": 1,
  "quantity": 3  // 必须是整数
}
```

### PUT /api/orders/:orderId/items/:itemId
```json
{
  "quantity": 5  // 必须是整数
}
```

## Prisma 客户端类型说明

虽然数据库字段已改为 `INTEGER`，但 Prisma 生成的聚合类型（如 `OrderItemAvgAggregateOutputType`、`OrderItemSumAggregateOutputType`）中 `quantity` 字段仍然使用 `runtime.Decimal` 类型。这是 Prisma 的正常行为，用于确保聚合计算的精度。

在实际的模型操作中（如 `create`、`update`、`findUnique`），`quantity` 字段将使用 `number` 类型。

## 迁移步骤

### 已完成步骤

1. ✅ 修改 `schema.prisma` 文件
2. ✅ 创建数据库迁移文件
3. ✅ 标记迁移为已应用
4. ✅ 重新生成 Prisma 客户端
5. ✅ 更新后端服务代码
6. ✅ 更新前端组件
7. ✅ 更新文档

### 如需重新执行迁移

如果数据库需要重新应用此迁移，请执行：

```bash
cd backend
npx prisma migrate resolve --applied "20260307141808_change_quantity_to_integer"
npx prisma generate
```

## 测试建议

### 后端测试
1. 测试创建订单时 quantity 为整数
2. 测试更新订单菜品时 quantity 为整数
3. 测试边界值（1 和 99）
4. 测试无效值（0、100、小数、负数）的验证

### 前端测试
1. 测试菜品选择器的数量增减功能
2. 确认 +0.5 按钮已移除
3. 测试编辑菜品时的数量输入
4. 测试保存后数量正确同步到后端

## 向后兼容性

**此变更不向后兼容**。旧的带有小数值的数据将在迁移时被转换为整数（使用 PostgreSQL 的类型转换）。

## 注意事项

1. **数据丢失风险**：原有的小数值（如 1.5）会被截断为整数（1）
2. **前端交互变更**：用户无法再输入 0.5 增量
3. **API 验证增强**：后端现在严格验证整数值

## 相关文档

- [MVP文档](./MVP文档.md)
- [API 文档](./api-documentation.md)
- [编码规范](./coding-standards.md)

---

**变更日期**: 2026-03-07  
**变更版本**: v1.0.0  
**影响范围**: order_items.quantity 字段
