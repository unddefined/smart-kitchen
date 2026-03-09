# WebSocket 全局实例修复指南

## 🔧 问题原因
诊断脚本显示 `window.ws 不存在`，原因是：
- `useWebSocket()` 是一个 Vue Composable，只能在组件内部使用
- 没有暴露到全局 `window` 对象
- 浏览器 Console 无法直接访问 WebSocket 实例

## ✅ 已完成的修复

### 1. 修改 `frontend/src/utils/websocket.js`
添加了两个新函数：

```javascript
// 初始化全局 WebSocket 实例
export function initGlobalWebSocket() {
  if (!globalWebSocket) {
    globalWebSocket = useWebSocket();
    // 暴露到 window 对象
    if (typeof window !== 'undefined') {
      window.ws = globalWebSocket;
      window.subscribedRooms = subscribedRooms;
      window.eventListeners = eventListeners;
      console.log('🌐 全局 WebSocket 已初始化并暴露到 window.ws');
    }
  }
  return globalWebSocket;
}

// 获取全局 WebSocket 实例
export function getGlobalWebSocket() {
  return globalWebSocket || initGlobalWebSocket();
}
```

### 2. 修改 `frontend/src/main.js`
在应用启动时自动初始化全局 WebSocket：

```javascript
import { initGlobalWebSocket } from "@/utils/websocket";

// ... existing code ...

// 初始化全局 WebSocket（用于浏览器 Console 调试和多设备同步）
initGlobalWebSocket();

// ... existing code ...
```

---

## 📋 部署步骤

### 方式 A: 本地构建后上传（推荐）

#### 1. 本地构建
```bash
cd d:\walker-11572\smart-kitchen\frontend
npm run build
```

#### 2. 上传到服务器
```bash
# 上传 dist 目录
scp -r dist/* root@8.145.34.30:/var/www/smart-kitchen/

# 或者使用 rsync（更快）
rsync -avz --delete dist/ root@8.145.34.30:/var/www/smart-kitchen/
```

#### 3. 验证部署
```bash
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30
cd /var/www/smart-kitchen
ls -la
```

---

### 方式 B: 服务器直接构建

#### 1. SSH 登录服务器
```bash
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30
```

#### 2. 进入项目目录
```bash
cd /root/smart-kitchen/frontend
```

#### 3. 拉取最新代码（如果使用 git）
```bash
git pull origin main
```

#### 4. 安装依赖并构建
```bash
npm install
npm run build
```

#### 5. 复制构建产物到 nginx 目录
```bash
cp -r dist/* /var/www/smart-kitchen/
```

#### 6. 重启 nginx（可选）
```bash
nginx -s reload
```

---

## 🧪 测试步骤

### 步骤 1: 刷新浏览器页面

在**电脑和手机**上同时刷新页面（强制刷新）：
- Windows: `Ctrl + F5`
- Mac: `Cmd + Shift + R`
- 手机：关闭标签页重新打开

### 步骤 2: 检查 Console 日志

打开浏览器开发者工具 Console，应该看到：
```
🌐 全局 WebSocket 已初始化并暴露到 window.ws
Connecting to WebSocket: ws://8.145.34.30:3001/ws
✅ WebSocket 连接成功
```

### 步骤 3: 验证 window.ws 存在

在 Console 执行：
```javascript
console.log('window.ws:', window.ws);
console.log('连接状态:', window.ws?.isConnected?.value);
console.log('Socket ID:', window.ws?.socket?.value?.id);
```

**期望输出：**
```
window.ws: {ws: {...}, cleanup: ƒ}
连接状态：true
Socket ID: abc123xyz
```

### 步骤 4: 运行完整诊断脚本

在 Console 粘贴并执行：
```javascript
(function() {
  console.log('=== WebSocket 诊断开始 ===');
  
  if (!window.ws) {
    console.error('❌ window.ws 仍不存在，请刷新页面');
    return;
  }
  
  console.log('✅ window.ws 存在');
  console.log('✅ 连接状态:', window.ws.isConnected?.value ? '已连接' : '未连接');
  console.log('✅ 已订阅房间:', [...(window.subscribedRooms || [])]);
  
  // 添加测试监听器
  window.ws.listen('order-updated', (data) => {
    console.log('🎯 收到订单更新:', data);
  });
  
  console.log('✅ 请在手机端触发订单更新...');
})();
```

### 步骤 5: 多设备测试

1. **电脑端**保持 Console 打开
2. **手机端**修改一个订单的状态
3. **电脑端**应该看到：
   ```
   🎯 收到订单更新：{...}
   ```

---

## 🔍 故障排查

### 问题 1: 仍然显示 `window.ws 不存在`

**解决方案：**
```javascript
// 手动初始化
import { initGlobalWebSocket } from './utils/websocket.js';
initGlobalWebSocket();

// 或者直接创建
const ws = {
  connect: () => console.log('手动连接'),
  subscribe: (room) => console.log('订阅', room),
  listen: (event, cb) => console.log('监听', event)
};
window.ws = ws;
```

**更可能的原因：**
- 页面未完全加载就执行了诊断脚本
- 浏览器缓存了旧版本的 JS 文件

**解决方法：**
1. 清除浏览器缓存
2. 强制刷新页面（Ctrl+F5）
3. 等待 3 秒后再执行诊断脚本

---

### 问题 2: 看到连接错误

**错误示例：**
```
❌ 连接错误: websocket error
WebSocket connection to 'ws://8.145.34.30:3001/ws' failed
```

**可能原因：**
1. 后端服务未运行
2. 防火墙阻止连接
3. CORS 配置错误

**解决步骤：**

#### 检查后端服务
```bash
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30
pm2 list | grep kitchen-backend
```

如果服务未运行：
```bash
cd /root/smart-kitchen/backend
pm2 start dist/src/main.js --name kitchen-backend
pm2 save
```

#### 检查防火墙
```bash
# 查看防火墙状态
ufw status

# 如果需要，开放 3001 端口
ufw allow 3001/tcp
```

#### 检查 CORS 配置
查看后端 `.env` 文件：
```bash
cat /root/smart-kitchen/backend/.env
```

应该有：
```
FRONTEND_URL=http://8.145.34.30
```

修改后重启后端：
```bash
pm2 restart kitchen-backend
```

---

### 问题 3: 连接成功但收不到广播

**症状：**
- Console 显示 `✅ WebSocket 连接成功`
- 但手机端触发更新后，电脑端没反应

**排查步骤：**

#### 1. 检查房间订阅
```javascript
console.log('已订阅房间:', [...window.subscribedRooms]);

// 如果没有看到 orders 和 all，手动订阅
window.ws.subscribe('orders');
window.ws.subscribe('all');
window.ws.subscribe('order-items');
```

#### 2. 检查事件监听
```javascript
// 添加所有必要的事件监听
['order-created', 'order-updated', 'order-deleted', 
 'item-created', 'item-updated', 'item-deleted'].forEach(event => {
  window.ws.listen(event, (data) => {
    console.log(`收到 ${event}:`, data);
  });
});
```

#### 3. 检查后端日志
```bash
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30
pm2 logs kitchen-backend --lines 50
```

在手机端触发订单更新，观察是否看到：
```
[OrdersService] 已广播 order-updated 事件到房间：orders, all
```

---

## 📊 验证清单

完成以下检查确保一切正常：

### 前端检查
- [ ] 刷新页面后看到 `🌐 全局 WebSocket 已初始化`
- [ ] Console 无 WebSocket 连接错误
- [ ] `window.ws` 对象存在
- [ ] `window.ws.isConnected.value` 为 true
- [ ] `window.subscribedRooms` 包含 `orders` 和 `all`
- [ ] 能执行 `window.ws.broadcast()` 发送消息

### 后端检查
- [ ] `pm2 list` 显示 kitchen-backend 在线
- [ ] `pm2 logs` 显示广播消息
- [ ] 无 CORS 相关错误
- [ ] 3001 端口正常监听

### 多设备同步检查
- [ ] 电脑端能收到手机端的更新
- [ ] 手机端能收到电脑端的更新
- [ ] 不同设备的 Socket ID 不相同
- [ ] 广播延迟 < 2 秒

---

## 🎯 快速测试命令

### 一键测试脚本（在浏览器 Console 执行）

```javascript
// 测试 WebSocket 全功能
(async function() {
  console.clear();
  console.log('🧪 === WebSocket 全功能测试 ===\n');
  
  // 1. 检查基础连接
  console.log('1️⃣ 基础连接检查:');
  console.log('   - window.ws 存在:', !!window.ws);
  console.log('   - 连接状态:', window.ws?.isConnected?.value);
  console.log('   - Socket ID:', window.ws?.socket?.value?.id);
  
  // 2. 测试房间订阅
  console.log('\n2️⃣ 房间订阅测试:');
  const testRoom = 'test-' + Date.now();
  window.ws.subscribe(testRoom);
  console.log('   ✅ 已订阅测试房间:', testRoom);
  
  // 3. 测试广播接收
  console.log('\n3️⃣ 广播接收测试:');
  let receivedTestMessage = false;
  const testEvent = 'test-websocket-check';
  
  window.ws.listen(testEvent, (data) => {
    console.log('   🎯 收到测试消息:', data);
    receivedTestMessage = true;
  });
  
  // 4. 发送测试广播
  console.log('\n4️⃣ 发送测试广播:');
  setTimeout(() => {
    window.ws.broadcast('all', testEvent, {
      message: 'WebSocket 功能测试',
      timestamp: new Date().toISOString(),
      testId: Math.random().toString(36).substring(7)
    });
    console.log('   ✅ 测试广播已发送到 "all" 房间');
  }, 1000);
  
  // 5. 总结
  setTimeout(() => {
    console.log('\n📊 测试总结:');
    console.log('   - 连接:', window.ws?.isConnected?.value ? '✅' : '❌');
    console.log('   - 订阅:', window.ws?.subscribe ? '✅' : '❌');
    console.log('   - 监听:', window.ws?.listen ? '✅' : '❌');
    console.log('   - 广播:', window.ws?.broadcast ? '✅' : '❌');
    console.log('   - 接收:', receivedTestMessage ? '✅' : '❌');
    
    if (receivedTestMessage) {
      console.log('\n🎉 所有测试通过！WebSocket 工作正常');
    } else {
      console.log('\n⚠️ 部分测试失败，请检查控制台详细日志');
    }
    
    console.log('\n=== 测试完成 ===');
  }, 3000);
})();
```

---

## 💡 后续优化建议

### 1. 生产环境改进
- 添加心跳检测机制（每 30 秒 ping 一次）
- 实现 JWT 认证（防止未授权连接）
- 统一房间命名常量（避免硬编码）
- 添加离线消息队列（重连后补发）

### 2. 开发环境工具
- 创建 WebSocket 调试面板
- 添加广播消息历史记录
- 实现可视化连接状态监控

### 3. 性能优化
- 实现引用计数管理（避免过早断开）
- 优化重连策略（指数退避）
- 减少不必要的广播（增加过滤逻辑）

---

**修复时间**: 2026-03-09  
**影响范围**: 所有前端页面  
**优先级**: 🔴 高（影响多设备同步）  
**预计部署时间**: 5-10 分钟
