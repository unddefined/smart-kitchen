# 后端服务重构总结

## 重构背景

原始 `orders.service.ts` 已经达到 1100 行，违反了单一职责原则。在订单量上来时会暴露严重的性能问题和架构问题。

## 重构方案

### 1. 服务拆分（按领域职责）

#### **KitchenService** - 厨房调度核心
- 📁 位置：`backend/src/kitchen/kitchen.service.ts`
- 🎯 职责：厨房调度业务逻辑
- ✅ 核心功能：
  - 订单状态机管理（验证状态转换合法性）
  - 菜品优先级初始化与批量更新
  - 起菜、催菜、暂停、恢复等调度操作
  - 用餐时间检查与自动状态更新
  - 使用批量更新优化性能（updateMany）
  - 支持事务操作（tx 参数传递）

#### **OrderItemsService** - 订单项资源管理
- 📁 位置：`backend/src/order-items/order-items.service.ts`
- 🎯 职责：订单项的 CRUD 操作
- ✅ 核心功能：
  - 查询订单的所有菜品项
  - 添加、删除、更新订单项
  - 验证订单存在性
  - 广播订单项事件

#### **OrdersService** - 订单资源管理
- 📁 位置：`backend/src/orders/orders.service.ts`
- 🎯 职责：订单的 CRUD 操作
- ✅ 核心功能：
  - 创建、查询、更新、删除订单
  - 取消订单
  - 委托调用 KitchenService 处理调度逻辑
  - 委托调用 OrderItemsService 处理订单项操作

### 2. 模块依赖关系

```
AppModule
├── OrdersModule
│   ├── KitchenModule (导入)
│   └── OrderItemsModule (导入)
├── KitchenModule (独立)
└── OrderItemsModule (独立)
```

### 3. 核心改进

#### ✅ N+1 写入问题已解决

**重构前**（性能问题）：
```typescript
for (const item of orderItems) {
  await this.prisma.orderItem.update({
    where: { id: item.id },
    data: { priority },
  });
}
// 20 桌 × 10 菜 = 200 次数据库写入
```

**重构后**（性能优化）：
```typescript
// 按优先级分组
const groupedByPriority: Record<number, number[]> = {};
for (const item of orderItems) {
  const priority = priorityMap[categoryName] || 0;
  if (!groupedByPriority[priority]) {
    groupedByPriority[priority] = [];
  }
  groupedByPriority[priority].push(item.id);
}

// 批量更新
for (const [priority, ids] of Object.entries(groupedByPriority)) {
  await tx.orderItem.updateMany({
    where: { id: { in: ids } },
    data: { priority: Number(priority) },
  });
}
// 从 200 次减少到 3-4 次数据库写入
```

#### ✅ 事务正确使用

**重构前**（事务错误）：
```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.order.update(...)
  await this.updateOrderItemsByStatus(order) // ❌ 使用 this.prisma
})
```

**重构后**（正确传递 tx）：
```
async updateOrderItemsByStatus(
  order: Order,
  tx?: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
) {
  const client = tx || this.prisma;
  await client.orderItem.updateMany(...) // ✅ 使用传入的 tx
}
```

#### ✅ 状态机设计完善

```typescript
const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  created: ['started', 'cancelled'],
  started: ['serving', 'paused', 'cancelled'],
  serving: ['urged', 'paused', 'done'],
  urged: ['serving', 'paused'],
  paused: ['serving', 'cancelled'],
  done: [],
  cancelled: [],
};

private validateStatusTransition(fromStatus: string, toStatus: string): boolean {
  const allowedTransitions = ORDER_STATUS_TRANSITIONS[fromStatus];
  return allowedTransitions?.includes(toStatus) ?? false;
}
```

#### ✅ 代码行数大幅减少

| 文件 | 重构前 | 重构后 | 减少 |
|------|--------|--------|------|
| orders.service.ts | 945 行 | ~330 行 | -65% |
| kitchen.service.ts | - | ~450 行 | 新增 |
| order-items.service.ts | - | ~180 行 | 新增 |

## 下一步待优化项

### ⚠️ 未解决的问题（需要后续迭代）

1. **时区处理**
   - 当前使用 `new Date()` 可能存在 UTC/本地时间问题
   - 建议：使用 `dayjs.tz` 或统一使用本地时间

2. **日志系统升级**
   - NestJS Logger 不擅长打印对象
   - 建议：升级到 `pino` 或格式化输出 `JSON.stringify(obj)`

3. **WebSocket 房间优化**
   - 当前所有客户端都收到所有订单消息
   - 建议：按 station 分房间（炒锅、蒸箱、凉菜）

4. **数据库设计扩展**
   - 当前只有 priority 字段
   - 建议：预留 `queueIndex`、`stationStatus` 字段

5. **调度算法缺失**
   - 当前只有简单优先级
   - 未来需要：生产调度算法（类似 OS 进程调度）

## 服务依赖注入

所有服务已通过 NestJS 依赖注入正确配置：

```
AppModule
├── OrdersModule
│   ├── KitchenModule ✓
│   └── OrderItemsModule ✓
├── ServingModule
│   ├── KitchenModule ✓
│   └── OrderItemsModule ✓
├── KitchenModule (独立) ✓
└── OrderItemsModule (独立) ✓
```

## 测试验证

### 启动服务
```bash
cd backend
npm run start:dev
```

### 验证要点
- [ ] 订单创建正常
- [ ] 起菜功能正常（优先级正确初始化）
- [ ] 催菜、暂停、恢复功能正常
- [ ] 订单项增删改正常
- [ ] WebSocket 广播正常
- [ ] 数据库性能提升（观察日志）
- [ ] **ServingService 正常工作** ✓ 已修复

## 总结

✅ **已完成**：
1. 服务拆分解耦（单一职责）
2. N+1 写入优化（批量更新）
3. 事务正确使用（tx 传递）
4. 状态机设计（明确定义转换规则）
5. 代码可维护性提升（从 945 行 → 330 行）

⏸️ **待完成**：
1. 时区处理
2. 日志系统升级
3. WebSocket 房间优化
4. 数据库字段扩展
5. 调度算法实现

---

**重构日期**: 2026-03-08  
**重构目标**: 为生产环境高并发场景做准备（20 桌×10 菜 = 200 菜品并发）
