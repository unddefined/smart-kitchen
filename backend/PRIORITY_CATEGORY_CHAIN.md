# 菜品优先级按分类链式调整功能

## 📋 功能概述

实现了基于**菜品分类链式反应**的优先级自动调整机制，符合 MVP文档要求:
> "该订单前面的整个分类中的菜上了之后，该订单后面的整个分类中的菜自动 +1"

## 🔄 分类优先级顺序

```
前菜/凉菜 (3 级) 
    ↓ 全部上完后
中菜/点心/蒸菜 (2 级) 
    ↓ 全部上完后
后菜 (1 级) 
    ↓ 全部上完后
尾菜 (1 级 → 2 级)
```

### 分类分组

| 分类级别 | 包含的分类名称 | 默认优先级 |
|---------|--------------|----------|
| 0 | 前菜、凉菜 | 3 级 (红色) |
| 1 | 中菜、点心、蒸菜 | 2 级 (黄色) |
| 2 | 后菜 | 1 级 (绿色) |
| 3 | 尾菜 | 1 级 (绿色) |

## ⚙️ 实现逻辑

### 触发条件
当某道菜品被标记为"已上菜"(status = 'served')时触发检查

### 调整规则
1. **检查当前分类是否全部上完**: 
   - 遍历订单中所有同分类的菜品
   - 确认它们的状态都是'served'或'cancelled'

2. **提升下一分类优先级**:
   - 找到下一个分类级别的所有未上菜菜品
   - 将这些菜品的优先级 +1(最高不超过 3)
   - 记录详细的操作日志

3. **链式反应**:
   - 前菜全上完 → 中菜从 2 级变 3 级
   - 中菜全上完 → 后菜从 1 级变 2 级
   - 后菜全上完 → 尾菜从 1 级变 2 级

### 示例场景

#### 场景 1:标准流程
订单包含：
- 凉拌黄瓜 (前菜，3 级)
- 宫保鸡丁 (中菜，2 级)
- 清炒时蔬 (后菜，1 级)
- 米饭 (尾菜，1 级)

**流程**:
1. 起菜时：凉拌黄瓜 (3 级)、宫保鸡丁 (2 级)、清炒时蔬 (1 级)、米饭 (1 级)
2. 上完凉拌黄瓜 → 检查前菜分类已全部上完 → 宫保鸡丁提升到 3 级
3. 上完宫保鸡丁 → 检查中菜分类已全部上完 → 清炒时蔬提升到 2 级
4. 上完清炒时蔬 → 检查后菜分类已全部上完 → 米饭提升到 2 级

#### 场景 2:同一分类多道菜
订单包含:
- 凉拌黄瓜 (前菜，3 级)
- 口水鸡 (前菜，3 级)
- 宫保鸡丁 (中菜，2 级)
- 麻婆豆腐 (中菜，2 级)
- 清炒时蔬 (后菜，1 级)

**流程**:
1. 上完凉拌黄瓜 → 前菜还有口水鸡未上 → **不调整**
2. 上完口水鸡 → 前菜已全部上完 → 宫保鸡丁和麻婆豆腐都提升到 3 级
3. 上完宫保鸡丁 → 中菜还有麻婆豆腐未上 → **不调整**
4. 上完麻婆豆腐 → 中菜已全部上完 → 清炒时蔬提升到 2 级

## 💻 技术实现

### 核心方法
`ServingService.autoAdjustSubsequentPriorities()`

### 关键代码逻辑

```typescript
// 1. 定义分类优先级顺序
const categoryOrder: Record<string, number> = {
  '前菜': 0, '凉菜': 0,      // 级别 0
  '中菜': 1, '点心': 1, '蒸菜': 1,  // 级别 1
  '后菜': 2,                 // 级别 2
  '尾菜': 3,                 // 级别 3
};

// 2. 获取刚上完的菜品的分类级别
const servedCategoryLevel = categoryOrder[servedCategoryName];

// 3. 检查当前分类是否所有菜都已上完
const allServedInCategory = itemsInSameCategory.every(
  item => item.status === 'served' || item.status === 'cancelled'
);

// 4. 如果全部上完，提升下一分类的优先级
const nextCategoryLevel = servedCategoryLevel + 1;
const itemsToUpgrade = orderItems.filter(item => 
  categoryOrder[item.dish.category.name] === nextCategoryLevel &&
  item.status !== 'served' && item.status !== 'cancelled'
);

// 5. 更新优先级 (最高到 3)
for (const item of itemsToUpgrade) {
  const newPriority = Math.min(currentPriority + 1, 3);
  await this.prisma.orderItem.update({
    where: { id: item.id },
    data: { priority: newPriority }
  });
}
```

## 🎯 特点与优势

### ✅ 符合业务需求
- 严格按照 MVP文档实现"整个分类"的链式调整
- 支持中文分类名称
- 符合实际出餐流程

### ✅ 数据一致性
- 使用 Prisma 事务确保数据原子性
- 异常处理不影响主流程
- 详细的日志便于追踪问题

### ✅ 性能优化
- 只在必要时才更新数据库 (优先级确实改变时)
- 避免重复计算和无效更新
- 静默失败，不影响上菜操作

### ✅ 可扩展性
- 分类配置集中管理 (`categoryOrder` 对象)
- 易于添加新的分类或调整优先级顺序
- 支持多个分类共享同一优先级级别

## 📊 日志记录

系统会记录以下关键信息:

```log
订单 123 的 凉拌黄瓜 (前菜) 已上菜，检查是否需要调整后续分类优先级
订单 123 的前菜分类已全部上完，准备提升下一分类优先级
订单 123 的下一分类为：中菜、点心、蒸菜
订单 123 的宫保鸡丁优先级从 2 提升到 3
订单 123 的麻婆豆腐优先级从 2 提升到 3
订单 123 完成优先级调整，共提升 2 个菜品
```

## 🔍 调试与测试

### 查看实时日志
```bash
pm2 logs kitchen-backend --lines 100
```

### 数据库验证
```sql
-- 查看订单菜品优先级
SELECT oi.id, d.name, dc.name as category, oi.priority, oi.status
FROM "OrderItem" oi
JOIN "Dish" d ON oi."dishId" = d.id
JOIN "DishCategory" dc ON d."categoryId" = dc.id
WHERE oi."orderId" = 123
ORDER BY oi."createdAt";
```

## 🚀 使用说明

### 后端集成
功能已集成到 `ServingService.serveDish()` 方法中，无需额外配置:

```typescript
// 标记菜品已上菜时自动触发
await servingService.serveDish(orderItemId);
```

### 前端展示
前端会实时显示更新后的:
- 颜色编码 (红/黄/绿)
- 卡片排序 (优先级高的在前)
- 催菜提示 (如需要)

## 📝 注意事项

1. **分类必须准确**: 确保每个菜品都有正确的分类
2. **状态流转正确**: 只有'served'状态才会触发调整
3. **Cancelled 菜品**: 被取消的菜品也算作"已完成"
4. **优先级上限**: 最高只能提升到 3 级 (催菜级别)
5. **不影响其他订单**: 每个订单独立计算

## 🎉 完成情况

- ✅ 按分类组调整优先级 (非单个菜品)
- ✅ 链式反应机制
- ✅ 分类级别可配置
- ✅ 完善的日志记录
- ✅ 通过 ESLint 和 TypeScript 检查
- ✅ 符合 MVP文档要求
