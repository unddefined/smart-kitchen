# CORS跨域问题修复部署指南

## 🎯 问题分析

**错误信息**: 
```
Access to fetch at 'http://8.145.34.30:3000/api/dishes' from origin 'http://localhost:5173' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**根本原因**:
1. 后端CORS配置过于严格，只允许特定源
2. 前端环境变量IP地址配置错误
3. 缺乏对生产环境多源的支持

## 🔧 已完成的修复

### 1. 后端CORS配置增强

**文件**: `backend/src/main.ts`

```typescript
// 新增多个可信源支持
app.enableCors({
  origin: [
    'http://localhost:5173',           // 本地开发
    'http://8.145.34.30:5173',         // 生产环境前端
    'http://8.145.34.30',              // 生产环境根域名
    'https://8.145.34.30'              // HTTPS生产环境
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Authorization']
});
```

### 2. 前端环境变量修正

**文件**: `frontend/.env`

```env
# 修正前: VITE_API_BASE_URL=http://8.145.30.34:3000
# 修正后:
VITE_API_BASE_URL=http://8.145.34.30:3000
```

## 🚀 部署步骤

### 第一步：部署后端更新

1. **连接服务器**
```bash
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30
```

2. **进入项目目录并拉取最新代码**
```bash
cd /root/smart-kitchen
git pull
```

3. **重新安装依赖**
```bash
cd backend
npm install
```

4. **重启后端服务**
```bash
# 停止现有服务
pm2 stop smart-kitchen-backend

# 启动新服务
pm2 start npm --name "smart-kitchen-backend" -- run start

# 保存进程状态
pm2 save
```

### 第二步：部署前端更新

1. **构建前端项目**
```bash
cd /root/smart-kitchen/frontend
npm run build
```

2. **重启Nginx服务**
```bash
nginx -s reload
```

## ✅ 验证测试

### 1. 使用测试页面验证

打开本地测试文件: `test-cors-fix.html`

这个页面会自动测试:
- ✅ 健康检查接口
- ✅ 菜品API接口  
- ✅ 订单API接口

### 2. 命令行验证

```bash
# 测试健康检查
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://8.145.34.30:3000/health

# 测试菜品API
curl -H "Origin: http://localhost:5173" http://8.145.34.30:3000/api/dishes
```

### 3. 实际应用测试

1. 访问前端应用
2. 尝试添加订单或搜索菜品
3. 检查浏览器控制台是否还有CORS错误

## 📋 故障排除

### 如果仍有CORS问题:

1. **检查后端服务状态**
```bash
pm2 status
pm2 logs smart-kitchen-backend
```

2. **验证CORS响应头**
```bash
curl -I -H "Origin: http://localhost:5173" http://8.145.34.30:3000/health
```
应该看到类似响应:
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Credentials: true
```

3. **检查防火墙设置**
```bash
ufw status
# 确保端口3000开放
```

### 常见问题解决:

**Q: 仍然提示CORS错误**
A: 确认后端服务已重启，检查PM2进程状态

**Q: IP地址无法访问**
A: 检查服务器网络安全组规则，确保3000端口对外开放

**Q: 前端页面空白**
A: 检查Nginx配置和前端构建文件是否存在

## 🛡️ 安全考虑

当前配置已平衡功能性和安全性:
- ✅ 明确列出可信源，避免开放所有域
- ✅ 启用凭证支持用于认证场景
- ✅ 限制允许的HTTP方法和请求头
- ❌ 不使用通配符`*`来避免安全风险

## 📊 监控建议

建议监控以下指标:
- CORS预检请求成功率
- API响应时间
- 错误率统计
- 用户访问日志

---
**更新时间**: 2026-02-24
**版本**: v1.1
**负责人**: 开发团队