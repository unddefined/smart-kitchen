# 智能厨房系统部署指南

## 📋 部署架构

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   本地开发环境   │    │   阿里云ECS服务器  │    │   用户浏览器     │
│                 │    │                  │    │                 │
│ • 前端开发      │◄──►│ • 后端API服务     │◄──►│ • PWA应用访问    │
│ • PWA调试       │    │ • PostgreSQL数据库 │    │ • 移动端使用     │
│ • Vite开发服务器 │    │ • Nginx反向代理    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 部署步骤

### 1. 服务器准备
```bash
# 确保已将SSH公钥添加到阿里云ECS
# 公钥内容：
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC28dHWlASphEVn6VJkepAH1yICEU/icLqmyQ92FGeUEBQqLYymZMCTaCW5JitTXk1EPaeBA+h2vFPkx40TrUGkQJzBArYMZ/MGLYmLrAsD2coKwSSNZU29bOcLJy3iXP1T55MIbS3/xzY/M3G+rWm87NonKP8T0FXPAwYcOPx1SMaUiyi9qok0DdVFbIFHm4nyCXKI9obJ3XBJeyO4M01w/AJJg2sl1AxeAKHPH5j8m4rD50LkmicBFnq7LcDKNNJ8m+7IFC/fh9+Z/TOzfauA0SZQai6GED91OYYlwwkV3U7U4BlGi3Xz9abQpIObfpdKYeZM8sslQUHdUe0Vco3H
```

### 2. 运行部署脚本
```bash
# 给脚本添加执行权限
chmod +x deploy-backend-production.sh

# 执行部署
./deploy-backend-production.sh
```

### 3. 本地开发配置
```bash
cd frontend
npm install
npm run dev
```

## 📁 项目结构

```
smart-kitchen/
├── backend/                    # 后端服务
│   ├── src/                   # 源代码
│   ├── prisma/                # 数据库Schema
│   ├── .env.production        # 生产环境配置
│   └── Dockerfile             # 容器配置
├── frontend/                  # 前端PWA应用
│   ├── src/                   # Vue3源代码
│   ├── vite.config.js         # Vite配置
│   └── .env.development       # 开发环境配置
├── docs/                      # 文档
├── PWA应用密钥.pem            # PWA签名密钥
├── ecs-ssh-key.pem            # 服务器SSH密钥
└── deploy-backend-production.sh  # 部署脚本
```

## 🔧 开发工作流

### 本地开发
1. 启动前端开发服务器：`npm run dev`
2. 前端API请求自动代理到生产服务器
3. 实时热重载开发体验

### 生产部署
1. 修改后端代码后运行：`./deploy-backend-production.sh`
2. 脚本会自动构建、部署并重启服务
3. 通过健康检查确认部署成功

## 🛡️ 安全配置

### 已实施的安全措施
- [x] SSH密钥认证
- [x] HTTPS准备（SSL证书待配置）
- [x] 安全头部配置
- [x] 数据库访问控制
- [x] 环境变量分离

### 待实施的安全增强
- [ ] SSL证书部署
- [ ] WAF配置
- [ ] 定期安全扫描

## 📊 监控和维护

### 服务管理命令
```bash
# 查看后端服务状态
ssh -i ecs-ssh-key.pem root@8.145.34.30 'systemctl status smart-kitchen-backend'

# 查看实时日志
ssh -i ecs-ssh-key.pem root@8.145.34.30 'journalctl -u smart-kitchen-backend -f'

# 重启服务
ssh -i ecs-ssh-key.pem root@8.145.34.30 'systemctl restart smart-kitchen-backend'
```

### 健康检查
- API健康检查：`http://8.145.34.30/health`
- 响应时间监控
- 错误率统计

## 🚨 故障排除

### 常见问题

1. **SSH连接失败**
   - 确认公钥已添加到服务器
   - 检查阿里云安全组规则

2. **API请求失败**
   - 检查后端服务状态
   - 验证Nginx配置
   - 确认数据库连接

3. **部署脚本失败**
   - 检查服务器资源使用情况
   - 确认依赖包版本兼容性

### 调试工具
- 浏览器开发者工具
- Postman API测试
- 服务器日志分析

## 📞 支持信息

- **生产API地址**：http://8.145.34.30
- **健康检查端点**：http://8.145.34.30/health
- **前端开发地址**：http://localhost:5173
- **文档更新时间**：2026年2月18日