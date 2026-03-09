# WebSocket 广播调试指南

## 🔍 问题现象
手机触发广播后，电脑没有收到更新

## 📊 调试步骤

### 步骤 1: 验证后端广播是否执行

在服务器上查看后端日志：

```bash
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30
pm2 logs kitchen-backend --lines 100
```

**期望输出：**
```
[OrdersService] 已广播 order-updated 事件到房间：orders, all
[EventsGateway] Broadcasted order-updated to room: orders
[EventsGateway] Broadcasted order-updated to room: all
```

如果看不到这些日志，说明后端没有执行广播逻辑。

---

### 步骤 2: 验证前端是否订阅了正确的房间

在**电脑浏览器**打开开发者工具 Console，执行：

```javascript
// 检查 WebSocket 是否连接
console.log('WebSocket 连接状态:', window.socket?.isConnected);

// 手动订阅房间测试
window.ws?.subscribe('orders');
window.ws?.subscribe('all');

// 监听订单更新事件
const testListener = (data) => {
  console.log('✅ 收到订单更新:', data);
};
window.ws?.listen('order-updated', testListener);

console.log('✅ 已添加监听器，请在手机上触发订单更新...');
```

然后在**手机端**修改一个订单的状态（如改为"待起菜"）。

**观察电脑端 Console：**
- ✅ 如果看到 `✅ 收到订单更新:`，说明 WebSocket 正常
- ❌ 如果没看到任何输出，说明广播未送达

---

### 步骤 3: 检查房间订阅状态

在**电脑浏览器**执行：

```javascript
// 查看已订阅的房间
console.log('已订阅的房间:', window.subscribedRooms);

// 查看当前监听的事件
console.log('事件监听器:', window.eventListeners);
```

**期望输出：**
```
已订阅的房间：Set(2) {'orders', 'all'}
事件监听器：Map(1) {'order-updated' => Set(1) {…}}
```

---

### 步骤 4: 测试后端直接广播

在**服务器后端**执行一个简单的广播测试：

```bash
# 进入项目目录
cd /root/smart-kitchen/backend

# 创建一个测试脚本
cat > test-broadcast.js << 'EOF'
const { io } = require('socket.io-client');

// 连接到 WebSocket
const socket = io('ws://localhost:3001/ws', {
  transports: ['websocket'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ 测试客户端已连接');
  
  // 订阅所有房间
  socket.emit('subscribe', { room: 'orders' });
  socket.emit('subscribe', { room: 'all' });
  
  console.log('📡 已订阅 rooms: orders, all');
  
  // 监听订单更新
  socket.on('order-updated', (data) => {
    console.log('🎯 收到 order-updated 事件:', data);
    socket.disconnect();
    process.exit(0);
  });
  
  // 5 秒后发送测试广播
  setTimeout(() => {
    console.log('📢 发送测试广播...');
    socket.emit('broadcast', {
      room: 'orders',
      event: 'order-updated',
      data: { 
        id: 999, 
        test: true, 
        message: '这是测试广播' 
      }
    });
  }, 2000);
});

socket.on('connect_error', (err) => {
  console.error('❌ 连接失败:', err.message);
  process.exit(1);
});

// 10 秒超时
setTimeout(() => {
  console.error('❌ 超时未收到响应');
  process.exit(1);
}, 10000);
EOF

# 运行测试
node test-broadcast.js
```

---

### 步骤 5: 检查 CORS 配置

在**电脑浏览器**执行以下测试：

```javascript
// 测试跨域连接
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = `${protocol}//${window.location.host}:3001/ws`;

console.log('尝试连接:', wsUrl);

const testSocket = io(wsUrl, {
  transports: ['websocket', 'polling'],
  timeout: 5000
});

testSocket.on('connect', () => {
  console.log('✅ 跨域连接成功');
  testSocket.disconnect();
});

testSocket.on('connect_error', (err) => {
  console.error('❌ 跨域连接失败:', err.message);
  console.error('可能是 CORS 配置问题');
});
```

---

## 🔧 常见问题排查

### 问题 1: 后端日志显示广播成功，但前端没收到

**可能原因：**
- 前端没有正确订阅房间
- 房间名称不匹配（大小写、拼写错误）
- WebSocket 连接断开

**解决方案：**
```javascript
// 在前端手动重新订阅
ws.connect();
ws.subscribe('orders');
ws.subscribe('all');
ws.subscribe('order-items');
```

---

### 问题 2: 多个客户端只有一个能收到广播

**可能原因：**
- Socket.IO 的房间机制问题
- 客户端使用了相同的 socket ID

**解决方案：**
确保每个客户端都是独立的连接，检查：
```javascript
console.log('Socket ID:', socket.id);
```

不同客户端应该有不同的 Socket ID。

---

### 问题 3: 广播延迟严重

**可能原因：**
- 网络延迟
- 重连机制频繁触发

**解决方案：**
1. 检查网络质量
2. 调整重连参数：
```javascript
socket.value = io(wsUrl, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 10,
  timeout: 20000,
});
```

---

## 📝 验证清单

完成以下检查以确保 WebSocket 广播正常工作：

- [ ] 后端服务正常运行 (`pm2 list`)
- [ ] 后端日志显示广播消息 (`pm2 logs`)
- [ ] 前端 Console 无 WebSocket 连接错误
- [ ] 前端成功订阅了 `orders` 和 `all` 房间
- [ ] 前端监听了 `order-updated` 等事件
- [ ] 手机和电脑都能成功连接 WebSocket
- [ ] 防火墙开放了 3001 端口
- [ ] CORS 配置允许跨域访问

---

## 🎯 快速测试命令

### 服务器端
```bash
# 查看 WebSocket 连接数
curl http://localhost:3001/socket.io/?EIO=4&transport=polling

# 查看后端日志
pm2 logs kitchen-backend --lines 50

# 重启后端
pm2 restart kitchen-backend
```

### 浏览器端（Console）
```javascript
// 一键诊断脚本
(function() {
  console.log('=== WebSocket 诊断报告 ===');
  console.log('1. 连接状态:', window.socket?.isConnected ? '✅ 已连接' : '❌ 未连接');
  console.log('2. 已订阅房间:', window.subscribedRooms ? [...window.subscribedRooms] : '无数据');
  console.log('3. 监听事件:', window.eventListeners ? [...window.eventListeners.keys()] : '无数据');
  
  if (!window.socket?.isConnected) {
    console.log('⚠️ WebSocket 未连接，尝试重新连接...');
    window.ws?.connect();
  }
  
  console.log('========================');
})();
```

---

## 💡 改进建议

### 1. 添加广播确认机制
在后端的 `broadcastOrderEvent` 中添加回调：

```typescript
private broadcastOrderEvent(event: string, data: any, rooms: string[] = ['orders', 'all']) {
  const timestamp = new Date().toISOString();
  
  rooms.forEach((room) => {
    this.eventsGateway.server.to(room).emit(event, { data, timestamp }, (error?: Error) => {
      if (error) {
        this.logger.error(`广播 ${event} 到房间 ${room} 失败:`, error.message);
      } else {
        this.logger.debug(`广播 ${event} 到房间 ${room} 成功`);
      }
    });
  });
}
```

### 2. 前端添加心跳检测
```javascript
let pingInterval = null;

const startPing = () => {
  pingInterval = setInterval(() => {
    if (socket.value && isConnected.value) {
      socket.value.emit('ping', { timestamp: Date.now() });
    }
  }, 30000);
};

const stopPing = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
};
```

### 3. 统一房间命名常量
创建全局常量管理房间名称：

```javascript
// constants/websocket.js
export const WS_ROOMS = {
  ORDERS: 'orders',
  ORDER_ITEMS: 'order-items',
  DISHES: 'dishes',
  SERVING: 'serving',
  USERS: 'users',
  ALL: 'all',
};
```

---

**最后更新**: 2026-03-09  
**优先级**: 🔴 高（影响多设备同步）
