# GitHub Actions 环境变量配置指南

本文档说明如何在 GitHub Actions 中配置服务器部署所需的环境变量（Secrets）。

## 🔐 什么是 GitHub Secrets？

GitHub Secrets 是加密的环境变量，允许你安全地存储敏感信息（如密码、密钥、连接字符串等），并在 GitHub Actions workflows 中使用。

## 📋 需要配置的 Secrets 列表

### 1. 数据库相关

| Secret 名称 | 说明 | 示例值 | 必填 |
|------------|------|--------|------|
| `DATABASE_URL` | Prisma 数据库连接字符串 | `postgresql://smart_admin:password@8.145.34.30:5432/smart_kitchen` | ✅ |
| `DB_HOST` | 数据库主机地址 | `8.145.34.30` | ✅ |
| `DB_PORT` | 数据库端口 | `5432` | ✅ |
| `DB_USER` | 数据库用户名 | `smart_admin` | ✅ |
| `DB_PASSWORD` | 数据库密码 | `your-password` | ✅ |
| `DB_NAME` | 数据库名称 | `smart_kitchen` | ✅ |

### 2. SSH 连接相关

| Secret 名称 | 说明 | 示例值 | 必填 |
|------------|------|--------|------|
| `SSH_HOST` | 服务器 IP 地址 | `8.145.34.30` | ✅ |
| `SSH_USER` | SSH 用户名 | `root` | ✅ |
| `SSH_PRIVATE_KEY` | SSH 私钥（完整内容） | `-----BEGIN OPENSSH PRIVATE KEY-----...` | ✅ |

### 3. 应用密钥相关

| Secret 名称 | 说明 | 生成方法 | 必填 |
|------------|------|----------|------|
| `APP_SECRET` | 应用密钥（32+ 字符） | 见下方 | ✅ |
| `JWT_SECRET` | JWT 签名密钥 | 见下方 | ✅ |

### 4. 镜像仓库相关

| Secret 名称 | 说明 | 示例值 | 必填 |
|------------|------|--------|------|
| `ALIYUN_USERNAME` | 阿里云容器镜像服务用户名 | `walker_11572` | ✅ |
| `ALIYUN_PASSWORD` | 阿里云容器镜像服务密码 | `your-acr-password` | ✅ |

---

## 🛠️ 配置步骤

### 步骤 1：进入 GitHub 仓库设置

1. 打开 GitHub 仓库页面
2. 点击 **Settings**（设置）标签
3. 在左侧菜单中选择 **Secrets and variables** → **Actions**
4. 点击 **New repository secret** 按钮

### 步骤 2：生成安全的密钥

#### 方法 A：使用 Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 输出：64 字符的十六进制字符串
```

#### 方法 B：使用 OpenSSL

```bash
openssl rand -hex 32
# 输出：64 字符的十六进制字符串
```

#### 方法 C：使用 Linux/Mac 系统命令

```bash
cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
# 输出：32 字符的随机字符串
```

### 步骤 3：添加每个 Secret

#### 示例 1：添加 DATABASE_URL

1. **Name**: `DATABASE_URL`
2. **Value**: 
   ```
   postgresql://smart_admin:your-password@8.145.34.30:5432/smart_kitchen
   ```
3. 点击 **Add secret**

#### 示例 2：添加 SSH 私钥

**重要：** SSH 私钥必须包含完整的头部和尾部标记！

1. 读取你的私钥文件：
   ```bash
   # Windows (Git Bash)
   cat ~/.ssh/id_rsa
   
   # 或使用 VSCode
   code ~/.ssh/id_rsa
   ```

2. 复制完整内容（包括 `-----BEGIN...` 和 `-----END...`）

3. 在 GitHub 中添加：
   - **Name**: `SSH_PRIVATE_KEY`
   - **Value**: 
     ```
     -----BEGIN OPENSSH PRIVATE KEY-----
     b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAlwAAAAdzc2gtcn
     NhAAAAAwEAAQAAAIEA...（中间省略）...
     -----END OPENSSH PRIVATE KEY-----
     ```
   - 点击 **Add secret**

#### 示例 3：添加 APP_SECRET

1. 生成长度至少 32 字符的随机字符串
2. **Name**: `APP_SECRET`
3. **Value**: `生成的随机字符串`
4. 点击 **Add secret**

---

## 📝 完整配置清单

按照以下顺序添加所有 Secrets：

```
✅ DATABASE_URL
✅ DB_HOST=8.145.34.30
✅ DB_PORT=5432
✅ DB_USER=smart_admin
✅ DB_PASSWORD=<你的数据库密码>
✅ DB_NAME=smart_kitchen

✅ SSH_HOST=8.145.34.30
✅ SSH_USER=root
✅ SSH_PRIVATE_KEY=<完整的 SSH 私钥>

✅ APP_SECRET=<生成的 32+ 字符随机密钥>
✅ JWT_SECRET=<生成的 32+ 字符随机密钥>

✅ ALIYUN_USERNAME=walker_11572
✅ ALIYUN_PASSWORD=<阿里云 ACR 密码>
```

---

## 🔍 验证配置

### 方法 1：手动触发 Workflow

1. 进入 GitHub Actions 页面
2. 选择 **Smart Kitchen CI/CD Pipeline**
3. 点击 **Run workflow**（手动触发）
4. 观察日志输出，确保没有环境变量相关的错误

### 方法 2：在服务器上验证

部署成功后，SSH 登录服务器检查：

```bash
# SSH 登录
ssh -i "C:/Users/66948/.ssh/PWA应用密钥.pem" root@8.145.34.30

# 进入项目目录
cd /root/smart-kitchen

# 检查 .env.production 文件是否生成
cat .env.production

# 检查 .env 文件是否正确
cat .env

# 验证 Docker 容器是否使用了正确的环境变量
docker exec smart-kitchen-backend-prod env | grep DATABASE
```

---

## 🚨 常见问题

### Q1: SSH 私钥格式错误

**症状：**
```
Error: unable to decrypt key
```

**解决方法：**
1. 确保私钥包含完整的 BEGIN 和 END 标记
2. 不要有多余的空格或换行
3. 如果是 Windows 生成的密钥，可能需要转换为 OpenSSH 格式

### Q2: 数据库连接失败

**症状：**
```
Error: Can't reach database server at `8.145.34.30:5432`
```

**解决方法：**
1. 检查 `DATABASE_URL` 格式是否正确
2. 验证数据库密码是否已 URL 编码（如果有特殊字符）
3. 确认服务器防火墙允许 5432 端口访问

**URL 编码示例：**
```bash
# 如果密码包含特殊字符如 @#$
# 原始密码：my@pass#word
# URL 编码后：my%40pass%23word

# 使用 Node.js 编码
node -e "console.log(encodeURIComponent('my@pass#word'))"
```

### Q3: Secrets 未生效

**可能原因：**
1. Secret 名称拼写错误（区分大小写）
2. Workflow 文件中引用错误
3. 缓存的旧镜像仍在运行

**解决方法：**
```bash
# 强制重新拉取最新代码和镜像
docker compose down
docker compose pull --policy always
docker compose up -d
```

---

## 🔒 安全最佳实践

### 1. 定期轮换密钥

建议每 90 天更换一次：
- `APP_SECRET`
- `JWT_SECRET`
- `DB_PASSWORD`

### 2. 限制 Secrets 访问权限

- 仅仓库管理员可以管理 Secrets
- 不要在 Issue、PR 评论或代码中提及 Secrets
- 定期审计 Secrets 使用情况

### 3. 使用 Environments 保护生产环境

1. 在 **Settings** → **Environments** 中创建 `production` 环境
2. 配置 **Required reviewers**（需要审核人）
3. 将生产相关的 Secrets 绑定到该环境
4. 在 workflow 中指定 `environment: production`

### 4. 启用 Secret 扫描

GitHub 会自动扫描代码中的 secrets，确保：
- 不提交 `.env` 文件到 Git
- 使用 `.gitignore` 忽略敏感文件

---

## 📊 Secrets 使用位置

了解每个 Secret 在 workflow 中的使用位置：

| Secret | 使用位置 | 用途 |
|--------|----------|------|
| `DATABASE_URL` | database-migration job | Prisma 数据库迁移 |
| `DB_*` | deploy-production job | 生成 .env 文件 |
| `SSH_*` | deploy-production job | SSH 连接到服务器 |
| `APP_SECRET` | deploy-production job | 应用密钥 |
| `JWT_SECRET` | deploy-production job | JWT 签名 |
| `ALIYUN_*` | build-and-push job | 登录阿里云镜像仓库 |

---

## 🔄 更新现有 Secrets

如果需要修改某个 Secret 的值：

1. 进入 **Settings** → **Secrets and variables** → **Actions**
2. 找到要更新的 Secret
3. 点击右侧的 **编辑** 图标
4. 修改 **Value**
5. 点击 **Update secret**

**注意：** 更新后需要重新触发部署才能生效。

---

## 📞 获取帮助

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 检查服务器上的 `/root/smart-kitchen/.env.production` 文件
3. 参考 [GitHub Secrets 官方文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

**最后更新：** 2026-03-16  
**维护者：** Smart Kitchen Team
