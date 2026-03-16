# GitHub 仓库敏感数据清理指南

## ⚠️ 重要警告

即使你已经从本地 Git 历史中删除了敏感文件，**GitHub 可能仍然保留着旧的 Git 对象**。这意味着：

1. 知道旧 commit hash 的人仍然可以访问敏感数据
2. GitHub 搜索可能还会显示已删除的内容（需要等待缓存更新）
3. Fork 的仓库可能还保留着完整的历史

---

## 🔍 检查 GitHub 状态

### 1. 验证强制推送是否成功

```bash
# 查看远程仓库的最新提交
git ls-remote --heads origin main

# 应该显示最新的 commit hash
# 例如：6d63ab44eca6da6ec9f12e55d06bed8024486f41	refs/heads/main
```

✅ **已验证**：你的强制推送已成功，GitHub 上的 main 分支已更新到最新提交。

### 2. 检查 GitHub 搜索

访问以下链接检查是否还能找到敏感文件：

- https://github.com/unddefined/smart-kitchen/search?q=.env.production
- https://github.com/unddefined/smart-kitchen/search?q=DB_PASSWORD
- https://github.com/unddefined/smart-kitchen/search?q=APP_SECRET

✅ **已验证**：搜索结果显示 "0 files"，敏感文件已从搜索中移除。

---

## 🛠️ GitHub 特定清理步骤

### 方法 1：联系 GitHub Support（推荐用于严重泄露）

如果敏感信息非常敏感（如生产数据库密码、API 密钥等），可以请求 GitHub 官方帮助：

1. **访问**：https://support.github.com/contact
2. **选择**："Report a violation" → "I need to remove sensitive information"
3. **提供信息**：
   - 仓库 URL：https://github.com/unddefined/smart-kitchen
   - 需要清理的旧 commit hashes
   - 说明这是意外提交的敏感数据

**GitHub 会做什么：**
- 从他们的备份和缓存中彻底删除旧的 Git 对象
- 确保通过 API 无法访问旧数据
- 通常需要 24-48 小时处理

---

### 方法 2：等待 GitHub 自动清理（适用于一般情况）

GitHub 会自动运行垃圾回收，但时间不确定：

- **浅层克隆缓存**：通常在 24 小时内更新
- **Git 对象存储**：可能需要数周
- **搜索索引**：通常在几小时内更新

**加速方法：**
1. 创建一个新的空分支并删除它
2. 触发 GitHub Actions 运行一次 workflow
3. 这些操作会促使 GitHub 重新索引仓库

---

### 方法 3：删除并重建仓库（最彻底）

**⚠️ 仅在其他方法都无效时使用！**

#### 步骤：

1. **下载当前仓库内容**
   ```bash
   # Clone 最新的（已清理的）版本
   git clone https://github.com/unddefined/smart-kitchen.git smart-kitchen-clean
   cd smart-kitchen-clean
   
   # 创建完整备份
   git bundle create ../smart-kitchen.bundle --all
   ```

2. **删除 GitHub 仓库**
   - 访问：https://github.com/unddefined/smart-kitchen/settings
   - 滚动到底部，点击 "Delete this repository"
   - 确认删除

3. **重新创建仓库**
   ```bash
   cd smart-kitchen-clean
   git remote add origin https://github.com/unddefined/smart-kitchen.git
   git push -u origin main
   ```

**优点：**
- 100% 确保所有旧对象被清除
- Fork 的仓库会断开连接

**缺点：**
- 丢失所有的 stars、watchers
- 破坏现有的 clone 和 PRs
- Issues 会保留，但与新的 commit history 不关联

---

## 🔐 必须立即执行的安全措施

### 1. 更改所有暴露的凭据

**数据库密码：**
```bash
# 登录阿里云控制台
# RDS → 数据库列表 → smart_kitchen → 修改连接地址 → 修改密码

# 更新后，在 GitHub Secrets 中更新：
# Settings → Secrets and variables → Actions → DATABASE_URL
```

**应用密钥：**
```bash
# 生成新的 APP_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 生成新的 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 在 GitHub Secrets 中更新
```

**SSH 密钥（如果私钥曾出现在 .env 文件中）：**
```bash
# 生成新的 SSH 密钥
ssh-keygen -t ed25519 -C "github-deploy-key"

# 将公钥添加到服务器
# ~/.ssh/id_ed25519.pub → 服务器 /root/.ssh/authorized_keys

# 在 GitHub Secrets 中更新 SSH_PRIVATE_KEY
```

### 2. 更新 GitHub Secrets

访问：https://github.com/unddefined/smart-kitchen/settings/secrets/actions

确保以下 Secrets 已配置且使用新值：

- [ ] `DATABASE_URL` - 使用新的数据库密码
- [ ] `DB_PASSWORD` - 新的密码
- [ ] `APP_SECRET` - 新生成的密钥
- [ ] `JWT_SECRET` - 新生成的密钥
- [ ] `SSH_PRIVATE_KEY` - 如果使用新的 SSH 密钥

### 3. 通知团队成员

发送以下通知：

```markdown
## ⚠️ 安全通知：Git 历史重构

我们已从 Git 历史中删除了敏感配置文件。

### 需要立即执行：

1. **删除本地仓库并重新 clone**
   ```bash
   rm -rf smart-kitchen
   git clone https://github.com/unddefined/smart-kitchen.git
   cd smart-kitchen
   ```

2. **配置本地环境变量**
   ```bash
   cp .env.example .env
   nano .env  # 填入你的本地配置
   ```

3. **不要使用旧的 clone**
   旧的本地仓库可能包含已删除的敏感文件

抱歉造成不便。如有问题请联系 @unddefined
```

---

## 📊 验证清单

完成以下检查确保清理彻底：

- [ ] GitHub 搜索找不到 `.env` 文件
- [ ] 无法通过旧 commit hash 访问敏感数据
- [ ] 所有暴露的密码已更改
- [ ] GitHub Secrets 已更新为新值
- [ ] 团队成员已收到通知并重新 clone
- [ ] .gitignore 已正确配置
- [ ] Git hooks 已设置防止再次提交

---

## 🔗 有用的链接

- **GitHub 支持**：https://support.github.com/contact
- **移除敏感数据**：https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository
- **GitHub Secrets**：https://docs.github.com/en/actions/security-guides/encrypted-secrets
- **本仓库的清理文档**：./GIT_HISTORY_SENSITIVE_DATA_CLEANUP.md

---

**最后更新：** 2026-03-16  
**状态：** ✅ 本地清理完成 | ⏳ 等待 GitHub 缓存更新
