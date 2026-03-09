# WebSocket 广播多设备同步问题排查指南

## 📋 问题描述
**现象**: 在手机端触发订单更新后，电脑端没有收到 WebSocket 广播通知

---

## 🔍 快速诊断流程（按顺序执行）

### 步骤 1: 验证后端服务状态

```bash
# SSH 登录服务器
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30

# 查看 PM2 进程列表
pm2 list

# 期望输出：kitchen-backend 状态应为 online
```

**如果服务未运行：**
```bash
cd /root/smart-kitchen/backend
pm2 start dist/src/main.js --name kitchen-backend
pm2 save
```

---

### 步骤 2: 实时查看后端广播日志

```bash
# 在新窗口监控后端日志
pm2 logs kitchen-backend --lines 50
```

**期望看到的日志：**
```
[OrdersService] 已广播 order-updated 事件到房间：orders, all
[EventsGateway] Broadcasted order-updated to room: orders
[EventsGateway] Broadcasted order-updated to room: all
```

**操作验证：**
1. 保持日志监控窗口打开
2. 在手机端修改订单状态（如改为"待起菜"）
3. 观察是否出现上述广播日志

**如果没有广播日志：**
- ❌ 后端代码可能未正确调用 `broadcastOrderEvent()`
- ❌ 数据库更新失败导致未触发广播
- ❌ 广播逻辑被异常捕获未执行

**解决方案：**
```bash
# 检查后端错误日志
pm2 logs kitchen-backend --err --lines 100

# 重启后端服务
pm2 restart kitchen-backend
```

---

### 步骤 3: 验证前端 WebSocket 连接

在**电脑浏览器**打开开发者工具 Console，执行：

```javascript
// 1. 检查 WebSocket 实例
console.log('window.ws 存在:', !!window.ws);
console.log('连接状态:', window.ws?.isConnected?.value);
console.log('Socket ID:', window.ws?.socket?.value?.id);
```

**期望输出：**
```
window.ws 存在：true
连接状态：true
Socket ID: abc123xyz (随机字符串)
```

**如果连接状态为 false：**
```javascript
// 手动连接
window.ws.connect();

// 等待 2 秒后检查
setTimeout(() => {
  console.log('重新连接后状态:', window.ws?.isConnected?.value);
}, 2000);
```

---

### 步骤 4: 验证房间订阅

在**电脑浏览器 Console**执行：

```javascript
// 查看已订阅的房间
console.log('已订阅房间:', [...(window.subscribedRooms || [])]);

// 检查必要房间
const requiredRooms = ['orders', 'all', 'order-items'];
const missingRooms = requiredRooms.filter(room => 
  !(window.subscribedRooms || new Set()).has(room)
);

if (missingRooms.length > 0) {
  console.warn('缺少房间:', missingRooms);
  console.log('正在补订...');
  missingRooms.forEach(room => window.ws.subscribe(room));
} else {
  console.log('✅ 所有必要房间已订阅');
}
```

**期望输出：**
```
已订阅房间：['orders', 'all', 'order-items']
✅ 所有必要房间已订阅
```

---

### 步骤 5: 添加事件监听器测试

在**电脑浏览器 Console**执行：

```javascript
// 清除旧监听器（如果有）
if (window._testUnsubscribe) {
  window._testUnsubscribe();
}

// 添加测试监听器
const events = ['order-created', 'order-updated', 'order-deleted', 
                'item-created', 'item-updated', 'item-deleted'];

events.forEach(event => {
  const unsubscribe = window.ws.listen(event, (data) => {
    console.log(`\n🎯 [${new Date().toLocaleTimeString()}] 收到 ${event}:`, data);
  });
  
  // 保存第一个事件的取消订阅函数
  if (event === 'order-updated') {
    window._testUnsubscribe = unsubscribe;
  }
});

console.log('✅ 已添加所有事件监听器');
console.log('💡 请在手机端触发订单更新...');
```

**然后在手机端操作：**
1. 打开应用
2. 修改任意订单的状态
3. 点击保存

**回到电脑端观察：**
- ✅ 如果看到 `🎯 [时间] 收到 order-updated:`，说明广播正常
- ❌ 如果没有任何输出，继续下一步排查

---

### 步骤 6: 测试主动广播

在**电脑浏览器 Console**执行：

```javascript
// 发送测试广播
console.log('📢 发送测试广播到 "orders" 房间...');

window.ws.broadcast('orders', 'test-message', {
  from: '电脑端',
  message: '这是测试广播消息',
  timestamp: new Date().toISOString(),
  testId: Math.random().toString(36).substring(7)
});

console.log('✅ 测试广播已发送');
console.log('💡 如果手机或平板也打开了应用，应该能收到此消息');
```

**在其他设备（手机/平板）的 Console 中应该看到：**
```
🎯 [时间] 收到 test-message: {from: '电脑端', ...}
```

---

### 步骤 7: 检查网络防火墙

在**本地电脑**执行：

```bash
# Windows PowerShell
Test-NetConnection -ComputerName 8.145.34.30 -Port 3001

# 或使用 curl
curl -v http://8.145.34.30:3001/socket.io/?EIO=4&transport=polling
```

**期望结果：**
- TcpTestSucceeded : True
- 能看到 HTTP 响应头

**如果连接失败：**
1. 检查云服务器安全组规则
2. 检查服务器防火墙设置
   ```bash
   # SSH 到服务器
   ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30
   
   # 查看防火墙状态
   ufw status
   
   # 如果需要，开放 3001 端口
   ufw allow 3001/tcp
   ```

---

## 🔧 常见问题及解决方案

### 问题 1: 后端广播成功，前端没收到

**症状：**
- 后端日志显示 `已广播 order-updated 事件`
- 前端 Console 没有任何输出

**可能原因：**
1. 前端未正确订阅房间
2. 事件名称不匹配
3. WebSocket 连接断开

**解决方案：**
```javascript
// 在前端执行以下代码强制重新订阅
window.ws.disconnect();
window.ws.connect();

setTimeout(() => {
  window.ws.subscribe('orders');
  window.ws.subscribe('all');
  window.ws.subscribe('order-items');
  console.log('✅ 已重新订阅所有房间');
}, 1000);
```

---

### 问题 2: 只有一个设备能收到广播

**症状：**
- 电脑和手机都连接了 WebSocket
- 但只有一个设备能收到广播

**可能原因：**
- Socket.IO 的房间机制问题
- 两个设备使用了相同的 Socket ID（极少见）

**解决方案：**
```javascript
// 检查两个设备的 Socket ID
console.log('当前设备 Socket ID:', window.ws.socket.value.id);

// 确保每个设备都是独立连接
// 不要共享同一个 WebSocket 实例
```

---

### 问题 3: 广播延迟严重（>5 秒）

**症状：**
- 广播能收到，但延迟很长

**可能原因：**
- 网络质量差
- WebSocket 频繁重连

**解决方案：**
```javascript
// 优化重连参数
const socket = io('ws://8.145.34.30:3001/ws', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,      // 初始重连延迟 1 秒
  reconnectionDelayMax: 5000,   // 最大重连延迟 5 秒
  reconnectionAttempts: 10,     // 最多重连 10 次
  timeout: 20000,               // 连接超时 20 秒
});
```

---

### 问题 4: CORS 跨域错误

**症状：**
- Console 显示 `CORS policy` 错误
- WebSocket 连接失败

**解决方案：**
修改后端 `.env` 文件：
```bash
FRONTEND_URL=http://8.145.34.30
```

然后重启后端：
```bash
pm2 restart kitchen-backend
```

---

## 📊 完整验证清单

请按顺序检查以下项目：

### 后端检查
- [ ] PM2 进程正常运行 (`pm2 list`)
- [ ] 后端日志显示广播消息 (`pm2 logs`)
- [ ] 无错误日志 (`pm2 logs --err`)
- [ ] 环境变量配置正确 (`.env` 中的 `FRONTEND_URL`)
- [ ] 防火墙开放 3001 端口

### 前端检查
- [ ] 浏览器 Console 无 WebSocket 连接错误
- [ ] `window.ws` 实例存在
- [ ] `window.ws.isConnected` 为 true
- [ ] 已订阅 `orders`、`all`、`order-items` 房间
- [ ] 已监听 `order-updated` 等事件
- [ ] 不同设备的 Socket ID 不相同

### 网络检查
- [ ] 本地能访问 `http://8.145.34.30:3001`
- [ ] 云服务器安全组开放 3001 端口
- [ ] 服务器防火墙允许 3001 端口入站

---

## 🎯 自动化诊断脚本

### 一键诊断（在电脑浏览器执行）

```javascript
(function() {
  console.clear();
  console.log('🔍 === WebSocket 一键诊断开始 ===\n');
  
  const checks = [];
  let passed = 0;
  let failed = 0;
  
  // 检查 1: window.ws 存在
  if (window.ws) {
    console.log('✅ window.ws 存在');
    checks.push({name: 'window.ws', pass: true});
    passed++;
  } else {
    console.error('❌ window.ws 不存在');
    checks.push({name: 'window.ws', pass: false});
    failed++;
  }
  
  // 检查 2: 连接状态
  const connected = window.ws?.isConnected?.value || window.ws?.isConnected;
  if (connected) {
    console.log('✅ WebSocket 已连接');
    checks.push({name: '连接状态', pass: true});
    passed++;
  } else {
    console.error('❌ WebSocket 未连接');
    checks.push({name: '连接状态', pass: false});
    failed++;
  }
  
  // 检查 3: 房间订阅
  const rooms = window.subscribedRooms || new Set();
  const requiredRooms = ['orders', 'all', 'order-items'];
  const missingRooms = requiredRooms.filter(r => !rooms.has(r));
  
  if (missingRooms.length === 0) {
    console.log('✅ 所有必要房间已订阅');
    checks.push({name: '房间订阅', pass: true});
    passed++;
  } else {
    console.warn('❌ 缺少房间:', missingRooms);
    checks.push({name: '房间订阅', pass: false});
    failed++;
  }
  
  // 检查 4: 事件监听
  const listeners = window.eventListeners || new Map();
  const requiredEvents = ['order-updated', 'item-updated'];
  const missingEvents = requiredEvents.filter(e => !listeners.has(e));
  
  if (missingEvents.length === 0) {
    console.log('✅ 必要事件已监听');
    checks.push({name: '事件监听', pass: true});
    passed++;
  } else {
    console.warn('❌ 缺少事件监听:', missingEvents);
    checks.push({name: '事件监听', pass: false});
    failed++;
  }
  
  // 总结
  console.log('\n📊 诊断结果:');
  console.log(`   通过：${passed}/${checks.length}`);
  console.log(`   失败：${failed}/${checks.length}`);
  
  if (failed === 0) {
    console.log('\n✅ 所有检查通过！WebSocket 配置正常');
    console.log('💡 如果仍然收不到广播，请检查后端日志');
  } else {
    console.log('\n⚠️ 发现问题，请根据上述提示修复');
  }
  
  console.log('\n=== 诊断完成 ===');
})();
```

---

## 📝 调试命令速查

### 服务器端
```bash
# 查看进程状态
pm2 list

# 查看实时日志
pm2 logs kitchen-backend --lines 50

# 查看错误日志
pm2 logs kitchen-backend --err

# 重启服务
pm2 restart kitchen-backend

# 查看 WebSocket 连接
netstat -tlnp | grep 3001
```

### 浏览器端（Console）
```javascript
// 连接 WebSocket
window.ws.connect()

// 订阅房间
window.ws.subscribe('orders')

// 监听事件
window.ws.listen('order-updated', data => console.log(data))

// 发送广播
window.ws.broadcast('orders', 'test', {msg: 'hello'})

// 查看状态
console.log(window.subscribedRooms)
console.log(window.eventListeners)
```

---

## 💡 最佳实践建议

### 1. 开发环境调试
- 始终开启后端日志监控
- 使用多个浏览器标签页模拟多设备
- 利用浏览器 Network 面板查看 WebSocket 消息

### 2. 生产环境部署
- 配置 PM2 开机自启动
- 设置日志轮转防止磁盘占满
- 定期重启服务释放内存

### 3. 代码层面改进
- 统一房间命名常量
- 添加心跳检测机制
- 实现广播确认回调
- 增加离线消息队列

---

**文档更新时间**: 2026-03-09  
**适用场景**: 多设备 WebSocket 实时同步调试  
**优先级**: 🔴 高
