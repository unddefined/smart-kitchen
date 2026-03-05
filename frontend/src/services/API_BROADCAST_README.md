# 前端 API 自动广播功能说明

## 功能概述

前端所有写操作（POST、PUT、PATCH、DELETE）API 调用后，系统会**自动**通过 WebSocket 广播消息，通知所有连接的客户端。

## 工作原理

### 1. 自动触发
无需手动调用广播函数，所有写操作 API 会自动触发广播：

```javascript
// ✅ 创建订单 - 自动广播
await api.orders.create(orderData);
// 广播事件：order-created
// 广播房间：orders, all

// ✅ 更新订单 - 自动广播
await api.orders.update(orderId, updateData);
// 广播事件：order-updated
// 广播房间：orders, all

// ✅ 删除订单菜品 - 自动广播
await api.orderItems.delete(itemId);
// 广播事件：item-deleted
// 广播房间：order-items, all

// ❌ 获取数据 - 不广播（读操作）
const orders = await api.orders.list();
```

### 2. 广播规则

| HTTP 方法 | 是否广播 | 说明 |
|-----------|---------|------|
| POST | ✅ 是 | 创建资源 |
| PUT | ✅ 是 | 更新资源 |
| PATCH | ✅ 是 | 部分更新 |
| DELETE | ✅ 是 | 删除资源 |
| GET | ❌ 否 | 读取数据 |

### 3. 广播事件类型

#### 订单相关 (room: `orders`)
- `order-created` - 订单创建
- `order-updated` - 订单更新（包括状态变更、催菜、暂停等）
- `order-deleted` - 订单删除

#### 订单菜品相关 (room: `order-items`)
- `item-created` - 菜品添加到订单
- `item-updated` - 菜品信息更新
- `item-deleted` - 菜品从订单删除

#### 菜品相关 (room: `dishes`)
- `dish-created` - 新菜品创建
- `dish-updated` - 菜品信息更新
- `dish-deleted` - 菜品删除

#### 出餐相关 (room: `serving`)
- `serving-updated` - 出餐状态变更

#### 用户相关 (room: `users`)
- `user-created` - 新用户创建
- `user-updated` - 用户信息更新
- `user-deleted` - 用户删除

### 4. 全局通知

除了发送到特定资源房间外，所有写操作还会发送一条 `global-change` 消息到 `all` 房间，让所有客户端都能收到变更通知。

## 监听广播

在前端组件中监听 WebSocket 广播：

```javascript
import { useWebSocket } from "@/utils/websocket";
import { onMounted, onUnmounted } from "vue";

export default function OrderView() {
  const ws = useWebSocket();
  
  // 监听订单变更
  const unsubscribeOrderChanged = ws.listen('order-updated', (data) => {
    console.log('📢 订单被更新:', data);
    // 刷新订单列表
    loadOrders();
  });
  
  // 监听全局变更
  const unsubscribeGlobal = ws.listen('global-change', (data) => {
    console.log('📢 全局数据变更:', data);
    if (data.resource === 'orders') {
      loadOrders();
    }
  });
  
  onMounted(() => {
    // 连接 WebSocket
    ws.connect();
    // 订阅订单房间
    ws.subscribe('orders');
    // 订阅所有房间
    ws.subscribe('all');
  });
  
  onUnmounted(() => {
    // 清理监听器
    unsubscribeOrderChanged();
    unsubscribeGlobal();
    // 断开连接
    ws.disconnect();
  });
}
```

## 广播数据格式

每次广播包含以下信息：

```javascript
{
  type: "order-updated",           // 事件类型
  method: "PATCH",                 // HTTP 方法
  url: "/api/orders/123",          // API 路径
  timestamp: "2026-03-05T16:30:00Z", // 时间戳
  data: {                          // 返回的数据
    id: 123,
    status: "started",
    ...
  }
}
```

## 完整示例

### 场景：多端同步订单状态

```javascript
// 组件 A - 订单列表页面
export default function OrderList() {
  const orders = ref([]);
  const ws = useWebSocket();
  
  // 加载订单
  const loadOrders = async () => {
    orders.value = await api.orders.list();
  };
  
  // 创建订单
  const createOrder = async () => {
    const newOrder = await api.orders.create({
      hallNumber: 'A1',
      covers: 4,
      ...
    });
    // ✅ 自动广播 order-created 事件
    // 其他客户端会收到通知并刷新列表
  };
  
  // 监听订单创建
  ws.listen('order-created', (data) => {
    console.log('新订单创建:', data);
    loadOrders(); // 刷新列表
  });
  
  onMounted(() => {
    ws.connect();
    ws.subscribe('orders');
    loadOrders();
  });
}

// 组件 B - 订单详情页
export default function OrderDetail({ orderId }) {
  const order = ref(null);
  const ws = useWebSocket();
  
  // 更新订单状态
  const startCooking = async () => {
    await api.orders.start(orderId);
    // ✅ 自动广播 order-updated 事件
    // 其他客户端会收到通知
  };
  
  // 监听订单更新
  ws.listen('order-updated', (data) => {
    if (data.data.id === orderId) {
      console.log('订单更新:', data);
      loadOrder(); // 刷新详情
    }
  });
  
  onMounted(() => {
    ws.connect();
    ws.subscribe('orders');
    loadOrder();
  });
}
```

## 注意事项

1. **WebSocket 连接**：确保在使用前已调用 `ws.connect()`
2. **房间订阅**：使用 `ws.subscribe(room)` 订阅感兴趣的房间
3. **错误处理**：广播失败不会影响主流程，只会输出警告日志
4. **性能优化**：避免频繁调用写操作，考虑批量处理
5. **清理资源**：组件卸载时记得移除监听器和断开连接

## 调试

查看浏览器控制台日志：
- 📢 广播数据变更：显示广播详情
- ⚠️ WebSocket 广播失败：显示错误信息

```javascript
// 控制台输出示例
📢 广播数据变更：{
  type: "order-created",
  method: "POST",
  url: "/api/orders",
  timestamp: "2026-03-05T16:30:00Z",
  data: { id: 123, hallNumber: "A1", ... }
}
```

## 相关文件

- API 服务：`frontend/src/services/api.js`
- WebSocket 工具：`frontend/src/utils/websocket.js`
- 后端网关：`backend/src/events.gateway.ts`
