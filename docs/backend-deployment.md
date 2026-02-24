# 智能厨房后端服务部署指南

## 部署前准备

### 1. 服务器环境要求
- Ubuntu 20.04 LTS 或更高版本
- 至少 2GB 内存
- Node.js 18.x
- Docker 和 Docker Compose（可选）
- Nginx（用于反向代理）

### 2. 必要工具
```bash
# 本地机器需要安装
sudo apt-get install rsync openssh-client
```

## 部署步骤

### 方法一：直接部署（推荐）

1. **配置SSH访问**
```bash
# 如果还没有SSH密钥，生成一个
ssh-keygen -t rsa -b 4096 -C "deployment-key"

# 将公钥添加到服务器的 ~/.ssh/authorized_keys 文件中
```

2. **配置生产环境变量**
```bash
# 编辑 backend/.env.production 文件
# 设置正确的数据库密码和其他配置
```

3. **运行部署脚本**
```bash
./deploy-backend.sh
```

### 方法二：Docker部署

1. **上传文件到服务器**
```bash
scp -r . root@8.145.34.30:/opt/smart-kitchen
```

2. **在服务器上运行**
```bash
cd /opt/smart-kitchen
docker-compose -f docker-compose.prod.yml up -d
```

## 服务管理

### 启动服务
```bash
systemctl start smart-kitchen-backend
```

### 停止服务
```bash
systemctl stop smart-kitchen-backend
```

### 查看状态
```bash
systemctl status smart-kitchen-backend
```

### 查看日志
```bash
journalctl -u smart-kitchen-backend -f
```

## 数据库配置

### PostgreSQL设置
```sql
-- 创建生产数据库
CREATE DATABASE smart_kitchen_prod;
CREATE USER smart_kitchen WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE smart_kitchen_prod TO smart_kitchen;
```

### 运行迁移
```bash
# 在服务器上
cd /opt/smart-kitchen/backend
npx prisma migrate deploy
```

## 监控和维护

### 健康检查
```bash
curl http://8.145.34.30:3000/health
```

### 日志轮转配置
```bash
# 添加到 /etc/logrotate.d/smart-kitchen
/opt/smart-kitchen/backend/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
}
```

## 故障排除

### 常见问题

1. **服务无法启动**
   - 检查端口3000是否被占用
   - 查看详细日志：`journalctl -u smart-kitchen-backend --since "1 hour ago"`

2. **数据库连接失败**
   - 验证数据库服务是否运行
   - 检查环境变量配置
   - 测试数据库连接：`npx prisma studio`

3. **内存不足**
   - 调整Node.js内存限制
   - 考虑升级服务器配置

### 性能优化

1. **启用PM2集群模式**
2. **配置Redis缓存**
3. **优化数据库索引**
4. **启用Gzip压缩**

## 安全建议

- [ ] 使用HTTPS
- [ ] 配置防火墙规则
- [ ] 定期更新依赖包
- [ ] 设置适当的文件权限
- [ ] 启用日志审计