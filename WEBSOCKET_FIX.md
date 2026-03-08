# WebSocket 生产环境连接修复

## 🔍 问题分析

### 错误信息
```
Uncaught Error: Attempting to use a disconnected port object
WebSocket connection to 'ws://8.145.34.30/socket.io/?EIO=4&transport=websocket' failed
❌ 连接错误：websocket error
```

### 根本原因
1. **URL 路径错误**：前端尝试连接 `ws://8.145.34.30/socket.io/` 而不是 `ws://8.145.34.30:3001/ws`
   - 缺少 `/ws` 命名空间（后端配置的 namespace）
   - 缺少端口号 `:3001`

2. **协议不匹配**：如果站点使用 HTTPS，应使用 `wss://` 而不是 `ws://`

3. **CORS 配置过于宽松**：生产环境应配置具体域名白名单

---

## ✅ 已修复内容

### 1. 前端 WebSocket URL 修复 (`frontend/src/utils/websocket.js`)

**修改前：**
```javascript
const getWebSocketUrl = () => {
  if (import.meta.env.PROD) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`; // ❌ 缺少端口号
  }
  return import.meta.env.VITE_WS_URL || "ws://localhost:3001/ws";
};
```

**修改后：**
```javascript
const getWebSocketUrl = () => {
  if (import.meta.env.PROD) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}:3001/ws`; // ✅ 添加端口号
  }
  return import.meta.env.VITE_WS_URL || "ws://localhost:3001/ws";
};
```

### 2. 后端 CORS 配置优化 (`backend/src/events.gateway.ts`)

**修改前：**
```typescript
@WebSocketGateway({
  cors: {
    origin: '*', // ❌ 允许所有来源
    credentials: true,
  },
  namespace: 'ws',
})
```

**修改后：**
```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*', // ✅ 支持环境变量配置
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
  namespace: 'ws',
})
```

---

## 📋 部署步骤

### 1. 更新后端环境变量

在服务器上编辑 `.env` 文件：

```bash
# SSH 到服务器
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30

# 进入项目目录
cd /root/smart-kitchen/backend

# 编辑 .env 文件
nano .env
```

添加或修改以下配置：
```bash
# WebSocket CORS 白名单
FRONTEND_URL=http://8.145.34.30

# 服务器监听配置
HOST=0.0.0.0
PORT=3001
```

### 2. 重启后端服务

```bash
# 查看 PM2 进程
pm2 list

# 重启后端服务
pm2 restart kitchen-backend

# 查看日志验证
pm2 logs kitchen-backend --lines 50
```

### 3. 更新前端代码

```bash
# 在本地提交并推送代码
git add .
git commit -m "fix: 修复生产环境 WebSocket 连接问题"
git push origin main

# 等待自动部署完成
```

### 4. 验证 WebSocket 连接

#### 方法 1：浏览器开发者工具
```javascript
// 打开浏览器 Console，执行：
console.log('WebSocket URL:', 
  window.location.protocol === 'https:' ? 'wss:' : 'ws:', 
  '//', 
  window.location.host, 
  ':3001/ws'
);
```

#### 方法 2：使用在线工具测试
访问：https://www.websocketking.com/
- URL: `ws://8.145.34.30:3001/ws`
- 点击 Connect

#### 方法 3：使用 curl 测试
```bash
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: SGVsbG8sIHdvcmxkIQ==" \
  -H "Sec-WebSocket-Version: 13" \
  http://8.145.34.30:3001/ws
```

---

## 🔧 故障排查

### 如果仍然无法连接，检查以下内容：

#### 1. 防火墙配置
```bash
# 检查防火墙状态
ufw status

# 开放 3001 端口
ufw allow 3001/tcp

# 验证端口监听
netstat -tlnp | grep 3001
```

#### 2. 云服务器安全组
登录云服务商控制台，确保安全组规则：
- 协议类型：TCP
- 端口范围：3001
- 授权对象：0.0.0.0/0

#### 3. 后端服务状态
```bash
# 检查 PM2 进程
pm2 list

# 查看详细日志
pm2 logs kitchen-backend

# 如果服务未运行，重新启动
cd /root/smart-kitchen/backend
pm2 start dist/src/main.js --name kitchen-backend
```

#### 4. 前端缓存清理
- 强制刷新页面：`Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac)
- 清除浏览器缓存和 Cookie
- 在无痕模式下测试

---

## 🎯 验证清单

- [ ] 后端 `.env` 文件包含 `FRONTEND_URL` 配置
- [ ] 后端服务已重启 (`pm2 restart kitchen-backend`)
- [ ] 前端代码已推送到服务器
- [ ] 防火墙已开放 3001 端口
- [ ] 云服务器安全组已配置 3001 端口入方向规则
- [ ] 浏览器 Console 无 WebSocket 连接错误
- [ ] 能够成功建立 WebSocket 连接

---

## 📊 技术细节

### WebSocket 连接流程

```
前端初始化
    ↓
调用 getWebSocketUrl()
    ↓
返回：ws://8.145.34.30:3001/ws
    ↓
Socket.IO 发起连接
    ↓
后端 EventsGateway 接收
    ↓
验证 CORS 配置
    ↓
建立 WebSocket 连接 ✅
    ↓
客户端订阅房间
    ↓
开始实时通信
```

### 房间命名规范

当前使用的房间：
- `orders` - 订单相关事件
- `order-items` - 订单项相关事件
- `all` - 全局事件广播
- `stations-{id}` - 特定工位（可选）

### 事件类型

| 事件名 | 说明 | 触发时机 |
|--------|------|----------|
| `order-created` | 订单创建 | 新订单到达 |
| `order-updated` | 订单更新 | 状态变更、信息修改 |
| `order-deleted` | 订单删除 | 订单被删除 |
| `item-created` | 菜品添加 | 添加到订单 |
| `item-updated` | 菜品更新 | 菜品状态变更 |
| `item-deleted` | 菜品删除 | 从订单移除 |

---

## 🔒 安全建议（未来改进）

### 1. 实现 WebSocket 认证
```typescript
// backend/src/events.gateway.ts
handleConnection(client: Socket) {
  const token = client.handshake.auth.token;
  
  try {
    const user = this.authService.validateToken(token);
    this.logger.log(`用户 ${user.username} 已连接`);
  } catch (error) {
    this.logger.warn(`无效的连接尝试`);
    client.disconnect();
  }
}
```

### 2. 启用 WSS（WebSocket Secure）
如果使用 HTTPS，应配置 Nginx 反向代理 WebSocket：

```nginx
location /ws {
  proxy_pass http://localhost:3001/ws;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. 添加心跳检测
```javascript
// frontend/src/utils/websocket.js
let pingInterval = null;

const startPing = () => {
  pingInterval = setInterval(() => {
    sendMessage('ping');
  }, 30000); // 每 30 秒
};

const stopPing = () => {
  if (pingInterval) {
    clearInterval(pingInterval);
  }
};
```

---

## 📝 相关文档

- [Socket.IO 官方文档](https://socket.io/docs/v4/)
- [NestJS WebSocket Gateway](https://docs.nestjs.com/websockets/gateways)
- [前后端联调规范](./LOCAL_VS_PRODUCTION_GUIDE.md)

---

**修复完成时间**: 2026-03-09  
**影响范围**: 所有生产环境的实时通信功能  
**优先级**: 🔴 高（阻塞性功能问题）
