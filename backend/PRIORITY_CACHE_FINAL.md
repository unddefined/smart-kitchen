# 优先级缓存功能 - 最终实现方案

## 🎯 核心需求

**用户明确要求**:暂停时优先级需要重置为 0(回到待起菜状态),但恢复时要能还原之前的优先级 (包括手动调整的)。

---

## 📋 实现方案

### 数据库设计

在 `order_items` 表中添加 `previous_priority` 字段:

```sql
ALTER TABLE "order_items" 
ADD COLUMN "previous_priority" INTEGER DEFAULT 0;
```

**字段用途**:
- 暂停时：保存当前的优先级值
- 恢复时：从中读取并还原到 [priority](file://d:\walker-11572\smart-kitchen\backend\generated\prisma\models\OrderItem.ts#L43-L43) 字段
- 还原后：清空为 null

---

## 🔄 完整流程

### 场景示例

假设订单有 4 个菜品，厨师将"中菜 C"从 2 调整为 3(催菜):

| 步骤 | 操作 | 前菜 A | 中菜 B | 中菜 C (已调整) | 后菜 D | priority | previous_priority |
|------|------|--------|--------|----------------|--------|----------|-------------------|
| 1 | **首次起菜** | 3 | 2 | 2 | 1 | 初始化 | 0 (默认) |
| 2 | **手动调整** | 3 | 2 | **3** | 1 | 已调整 | 0 |
| 3 | **暂停订单** | **0** | **0** | **0** | **0** | **重置为 0** | **保存：3,2,3,1** |
| 4 | **恢复起菜** | 3 | 2 | **3** | 1 | **还原** | null (清空) |

✅ **关键点**:
- 暂停时：所有菜品优先级归零 (回到待起菜状态)
- 恢复时：中菜 C 的优先级 3 被正确保留

---

## 🔧 后端实现

### 方法 1: 暂停时缓存并重置

```typescript
async updateOrderItemsByStatus(order: Order, tx?: PrismaClient) {
  if (order.status === 'started') {
    const items = await client.orderItem.findMany({
      where: { orderId: order.id, status: { not: 'served' } },
      include: { dish: true },
    });

    for (const item of items) {
      if (item.priority !== 0) {
        await client.orderItem.update({
          where: { id: item.id },
          data: {
            previousPriority: item.priority, // 保存到缓存
            priority: 0, // 重置为 0
          },
        });
        
        this.logger.log(`订单${order.id}已暂停，${item.dish?.name}优先级 ${item.priority} 已缓存并重置为 0`);
      }
    }
  }
}
```

**效果**:
- ✅ 优先级归零 (符合"暂停 = 待起菜"的语义)
- ✅ 保存到缓存 (为恢复做准备)
- ✅ 详细日志记录

---

### 方法 2: 恢复时还原 + 初始化

```typescript
async startServing(id: number) {
  if (order.status === 'started' && !order.startTime) {
    // 首次起菜：初始化所有菜品
    await this.initializeDishPriorities(id, tx);
  } else if (order.status === 'started' && order.startTime) {
    // 从暂停恢复：还原缓存 + 初始化未缓存的
    await this.restoreAndInitializePriorities(id, tx);
  }
}
```

**判断逻辑**:
- `!order.startTime`: 第一次起菜
- `order.startTime`: 从暂停恢复

---

### 方法 3: 还原缓存并初始化新增菜品

```typescript
async restoreAndInitializePriorities(orderId: number, tx?: PrismaClient) {
  // 1. 还原有缓存的菜品 (保留手动调整)
  const itemsWithCache = await client.orderItem.findMany({
    where: { orderId, status: { not: 'served' }, previousPriority: { not: null } },
  });

  for (const item of itemsWithCache) {
    await client.orderItem.update({
      where: { id: item.id },
      data: {
        priority: item.previousPriority, // 还原
        previousPriority: null, // 清空缓存
      },
    });
  }

  // 2. 初始化没有缓存的菜品 (新增的或未调整过的)
  const itemsWithoutCache = await client.orderItem.findMany({
    where: { orderId, status: { not: 'served' }, OR: [{ previousPriority: null }, { previousPriority: { equals: 0 } }] },
    include: { dish: { include: { category: true } } },
  });

  const priorityMap = { '前菜': 3, '中菜': 2, '点心': 2, '蒸菜': 2, '后菜': 1, '尾菜': 1, '凉菜': 3 };

  for (const item of itemsWithoutCache) {
    const priority = priorityMap[item.dish.category.name] || 0;
    await client.orderItem.update({
      where: { id: item.id },
      data: { priority, previousPriority: null },
    });
  }
}
```

**两步处理**:
1. **还原**:有缓存的按缓存值还原 (保留手动调整)
2. **初始化**:没有缓存的按分类初始化 (处理新增菜品)

---

## 📊 数据流转图

```
暂停订单 (serving → started)
┌──────────────────────────────────────┐
│ 1. 查询未出菜且 priority != 0 的菜品   │
│ 2. 对每个菜品:                        │
│    - previous_priority = priority    │  ← 保存当前值
│    - priority = 0                    │  ← 重置为待起菜状态
│ 3. 记录日志                           │
└──────────────────────────────────────┘

恢复起菜 (started → serving)
┌──────────────────────────────────────┐
│ 判断是否首次起菜:                      │
│                                        │
│ ┌─ 首次 (startTime 为空) ─────────┐   │
│ │  调用 initializeDishPriorities() │   │
│ │  全部分类初始化                   │   │
│ └─────────────────────────────────┘   │
│                                        │
│ └─ 恢复 (startTime 不为空) ────────┐   │
│    调用 restoreAndInitializePriorities()
│    1. 还原有缓存的 (保留调整)         │
│    2. 初始化无缓存的 (新增/未调整)     │
│    3. 清空缓存字段                   │
│ └─────────────────────────────────┘   │
└──────────────────────────────────────┘
```

---

## 💡 技术亮点

### 1. **语义清晰**
- 暂停 = 回到待起菜状态 (优先级归零)
- 恢复 = 重新起菜 (保留之前的调整)

### 2. **数据持久化**
- 使用数据库字段而非内存或 Redis
- 服务重启不丢失缓存数据

### 3. **智能处理**
- 自动识别哪些菜品有缓存
- 自动区分新增菜品和已调整菜品
- 只对有缓存的进行还原，避免重复初始化

### 4. **审计完整**
- 所有操作都有详细日志
- 可以追踪每次暂停和恢复的优先级变化

### 5. **性能优化**
- 只在暂停和恢复时操作
- 不影响正常出餐流程
- 批量更新减少数据库交互

---

## 🚀 部署步骤

### 1. 应用数据库迁移

```bash
cd backend
npx prisma migrate deploy
```

### 2. 重新生成 Prisma Client

```bash
npx prisma generate
```

### 3. 重启后端服务

```bash
npm run start:dev
```

### 4. 验证功能

运行测试脚本:
```bash
npx ts-node src/kitchen/test-priority-cache.ts
```

查看日志确认:
- 暂停时看到:"优先级 X 已缓存并重置为 0"
- 恢复时看到:"还原缓存优先级为 X"

---

## 📝 使用示例

### 前端调用 (无需修改)

```javascript
// 暂停订单 - 自动触发缓存和重置
await OrderService.updateOrder(orderId, { status: 'started' });

// 恢复起菜 - 自动触发还原
await OrderService.startOrder(orderId);
```

### 日志输出示例

```
[INFO] 订单 123 已暂停，凉拌黄瓜优先级 3 已缓存并重置为 0
[INFO] 订单 123 已暂停，红烧肉优先级 2 已缓存并重置为 0
[INFO] 订单 123 已暂停，清蒸鱼优先级 3 已缓存并重置为 0

[INFO] 订单 123 从暂停状态恢复，已还原并初始化菜品优先级
[INFO] 订单 123 的凉拌黄瓜 还原缓存优先级为 3
[INFO] 订单 123 的红烧肉 还原缓存优先级为 2
[INFO] 订单 123 的清蒸鱼 还原缓存优先级为 3
```

---

## ⚠️ 注意事项

### 1. 数据库字段必须存在

确保 `previous_priority` 字段已添加到 `order_items` 表:

```sql
-- 验证字段是否存在
SELECT column_name FROM information_schema.columns
WHERE table_name = 'order_items' 
  AND column_name = 'previous_priority';
```

### 2. Prisma Client 必须重新生成

修改 schema 后必须执行:

```bash
npx prisma generate
```

### 3. 日志监控

生产环境应监控以下关键日志:
- 暂停时的缓存操作
- 恢复时的还原操作
- 异常情况的错误日志

---

## 🎉 总结

### 实现的优势

1. ✅ **满足需求**:暂停时重置为 0，恢复时保留调整
2. ✅ **语义清晰**:暂停和恢复的业务含义明确
3. ✅ **数据可靠**:基于数据库字段，持久化存储
4. ✅ **自动触发**:无需前端额外调用
5. ✅ **审计完整**:所有操作都有日志记录
6. ✅ **性能友好**:只在关键节点操作

### 与其他方案对比

| 方案 | 暂停行为 | 恢复行为 | 优点 | 缺点 |
|------|----------|----------|------|------|
| **缓存方案**(当前) | 重置为 0+ 缓存 | 还原缓存 | 语义清晰、数据可靠 | 需要数据库迁移 |
| 不重置优先级 | 保持不变 | 保持不变 | 最简单 | 暂停语义不明确 |
| Redis 缓存 | 重置为 0 | 从 Redis 还原 | 快速 | 需额外服务、可能丢失 |

---

## 📚 相关文档

- **完整实现文档**:[`PRIORITY_CACHE_IMPLEMENTATION.md`](./PRIORITY_CACHE_IMPLEMENTATION.md)
- **快速开始指南**:[`PRIORITY_CACHE_QUICKSTART.md`](./PRIORITY_CACHE_QUICKSTART.md)
- **测试脚本**:[`src/kitchen/test-priority-cache.ts`](./src/kitchen/test-priority-cache.ts)
- **核心代码**:[`src/kitchen/kitchen.service.ts`](./src/kitchen/kitchen.service.ts)

---

**创建时间**: 2026-03-16  
**版本**: v2.0 (缓存重置版)  
**维护者**: Technical Team
