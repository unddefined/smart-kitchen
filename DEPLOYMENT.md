# 智能厨房系统云服务器部署指南

## 📋 部署前准备

### 1. 服务器要求
- Ubuntu 20.04 LTS 或更高版本
- 至少 2GB RAM
- 至少 20GB 存储空间
- 公网IP地址
- 域名解析已完成

### 2. 必需工具
- Git
- Docker & Docker Compose
- Nginx
- Certbot (用于SSL证书)

## 🚀 部署步骤

### 第一步：服务器环境准备

```bash
# 连接到云服务器
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30

# 下载并运行服务器准备脚本
wget https://raw.githubusercontent.com/your-repo/smart-kitchen/main/setup-server.sh
chmod +x setup-server.sh
./setup-server.sh

# 重新登录以激活docker权限
exit
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30
```

### 第二步：获取项目代码

```bash
# 克隆项目代码
git clone https://github.com/your-repo/smart-kitchen.git /opt/smart-kitchen
cd /opt/smart-kitchen

# 或者如果是私有仓库，先上传代码到服务器
```

### 第三步：配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑环境变量文件
nano .env.production
```

在 `.env.production` 文件中设置：
```env
# 数据库配置
DB_USER=smart_kitchen_user
DB_PASSWORD=13814349230cX  # 已更新的新密码
DB_NAME=smart_kitchen_prod

# 应用配置
NODE_ENV=production
PORT=3000

# JWT配置
JWT_SECRET=your_jwt_secret_key_here  # 修改为随机字符串
JWT_EXPIRES_IN=24h
```

### 第四步：配置SSL证书

```bash
# 编辑SSL配置脚本
nano setup-ssl.sh

# 修改域名和邮箱
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"

# 运行SSL证书申请脚本
chmod +x setup-ssl.sh
./setup-ssl.sh
```

### 第五步：修改Nginx配置

```bash
# 编辑Nginx配置文件
nano nginx/conf.d/backend.conf
```

将 `your-domain.com` 替换为实际域名。

### 第六步：部署应用

```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

或者手动部署：
```bash
# 构建并启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 常用管理命令

### 服务管理
```bash
# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 查看服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 数据库管理
```bash
# 进入数据库容器
docker exec -it smart-kitchen-postgres-prod psql -U smart_kitchen_user -d smart_kitchen_prod

# 备份数据库
docker exec smart-kitchen-postgres-prod pg_dump -U smart_kitchen_user smart_kitchen_prod > backup.sql

# 恢复数据库
docker exec -i smart-kitchen-postgres-prod psql -U smart_kitchen_user smart_kitchen_prod < backup.sql
```

### 应用更新
```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## 🛡️ 安全配置

### 防火墙设置
```bash
# 查看防火墙状态
sudo ufw status

# 允许必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (仅内网访问建议)

# 启用防火墙
sudo ufw enable
```

### 定期维护
```bash
# 系统更新
sudo apt update && sudo apt upgrade -y

# 清理Docker资源
docker system prune -af

# 查看磁盘使用情况
df -h

# 查看内存使用情况
free -h
```

## 🧪 验证部署

### 健康检查
```bash
# 检查应用健康状态
curl -f https://your-domain.com/health

# 检查API接口
curl -f https://your-domain.com/api/health
```

### 测试API接口
```bash
# 获取菜品列表
curl -X GET https://your-domain.com/api/dishes

# 获取工位列表
curl -X GET https://your-domain.com/api/stations

# 创建测试订单
curl -X POST https://your-domain.com/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "hall_number": "A01",
    "people_count": 4,
    "table_count": 1,
    "meal_time": "2026-02-18 午餐"
  }'
```

## 🆘 故障排除

### 常见问题

1. **服务无法启动**
   ```bash
   # 查看详细错误日志
   docker-compose -f docker-compose.prod.yml logs
   
   # 检查端口占用
   sudo netstat -tlnp | grep :3000
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库容器状态
   docker-compose -f docker-compose.prod.yml ps postgres
   
   # 查看数据库日志
   docker-compose -f docker-compose.prod.yml logs postgres
   ```

3. **SSL证书问题**
   ```bash
   # 检查证书有效性
   openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout
   
   # 手动续期证书
   sudo certbot renew --dry-run
   ```

4. **Nginx配置错误**
   ```bash
   # 测试Nginx配置
   sudo nginx -t
   
   # 重新加载Nginx
   sudo systemctl reload nginx
   ```

## 📊 监控和日志

### 日志位置
- 应用日志: `/opt/smart-kitchen/logs/`
- Nginx访问日志: `/var/log/nginx/access.log`
- Nginx错误日志: `/var/log/nginx/error.log`
- Docker日志: `docker-compose logs`

### 性能监控
```bash
# 查看系统资源使用
htop

# 查看Docker资源使用
docker stats

# 查看网络连接
ss -tuln
```

## 🔄 自动化部署

可以使用GitHub Actions或GitLab CI/CD来实现自动化部署：

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.KEY }}
        script: |
          cd /opt/smart-kitchen
          git pull origin main
          docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

## 📞 技术支持

如有部署问题，请联系：
- 邮箱: support@your-company.com
- 文档: https://docs.your-domain.com