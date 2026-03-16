# Git 历史中敏感文件清理指南

## ⚠️ 问题严重性

根据检查，你的 Git 历史中多次提交了 `.env` 相关文件：

```
backend/.env
backend/.env.production
frontend/.env
frontend/.env.development
frontend/.env.production
```

**提交记录包括：**
- `90802e9` - feat: 统一后端端口配置为 3001
- `c57e2a2` - feat: 更新生产环境数据库配置
- `a64762c` - feat: 更新生产环境数据库配置并优化部署流程
- 以及其他多次提交...

---

## 🎯 解决方案

### 方案一：BFG Repo-Cleaner（推荐）⭐

**适用场景：** 快速清理大文件、多个文件

#### 步骤 1：安装 BFG

```bash
# Windows (使用 Chocolatey)
choco install bfg

# 或下载 JAR 文件
# https://rtyley.github.io/bfg-repo-cleaner/
```

#### 步骤 2：备份当前仓库

```bash
cd d:\walker-11572\smart-kitchen

# 克隆一个镜像用于备份
git clone --mirror d:\walker-11572\smart-kitchen d:\walker-11572\smart-kitchen-backup
```

#### 步骤 3：使用 BFG 删除敏感文件

```bash
# 删除所有 .env 文件
bfg --delete-files '*.env' --delete-files '*.env.*'

# 等待处理完成
```

#### 步骤 4：清理并推送

```bash
# 清理 reflog
git reflog expire --expire=now --all

# 垃圾回收
git gc --prune=now --aggressive

# 强制推送到远程
git push --force
```

---

### 方案二：Git Filter-Branch（原生方法）

**适用场景：** 不想安装额外工具

#### 步骤 1：创建清理脚本

创建文件 `remove-env-files.sh`：

```bash
#!/bin/bash
# 删除所有 env 相关文件
rm -f .env
rm -f .env.*
rm -f backend/.env
rm -f backend/.env.*
rm -f frontend/.env
rm -f frontend/.env.*
```

#### 步骤 2：执行过滤

```bash
cd d:\walker-11572\smart-kitchen

# 备份当前分支
git branch backup-before-cleanup

# 执行 filter-branch
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch -f .env .env.* backend/.env backend/.env.* frontend/.env frontend/.env.*' \
  --prune-empty HEAD
```

#### 步骤 3：清理引用

```bash
# 删除备份
rm -rf .git/refs/original/

# 清理 reflog
git reflog expire --expire=now --all

# 垃圾回收
git gc --prune=now --aggressive
```

#### 步骤 4：强制推送

```bash
# 强制推送到远程
git push --force --all
git push --force --tags
```

---

### 方案三：Git Rebase（最彻底但最复杂）

**适用场景：** 需要精确控制每个提交

#### 步骤 1：找到第一个包含 .env 的提交

```bash
git log --all --oneline -- "*env*" | tail -n 1
# 假设输出：1ec7339 feat: add TestController
```

#### 步骤 2：开始交互式 rebase

```bash
git rebase -i 1ec7339^
```

#### 步骤 3：编辑每个提交

在编辑器中：
1. 将包含 `.env` 的提交标记为 `edit`
2. 保存并退出

#### 步骤 4：删除 .env 文件

```bash
# 当 rebase 暂停时
git rm --cached .env*
git commit --amend --no-edit
git rebase --continue
```

#### 步骤 5：重复直到完成

可能需要多次重复步骤 3-4。

---

## 🔐 后续安全措施

### 1. 立即更改所有暴露的密码

**必须立即执行！**

```bash
# 1. 修改数据库密码
# 登录阿里云 RDS 或使用管理工具

# 2. 生成新的 APP_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. 生成新的 JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 4. 如果 SSH 私钥也暴露了，重新生成
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 2. 配置 Git 钩子防止再次提交

创建 `.git/hooks/pre-commit`：

```bash
#!/bin/bash
# 阻止 .env 文件被提交

if git diff --cached --name-only | grep -qE '^\.env|^backend/\.env|^frontend/\.env'; then
  echo "❌ 错误：不能提交 .env 文件！"
  echo ""
  echo "请使用以下方式配置本地环境变量："
  echo "  cp .env.example .env"
  echo "  # 然后编辑 .env 文件"
  echo ""
  echo "被阻止的文件:"
  git diff --cached --name-only | grep -E '^\.env|^backend/\.env|^frontend/\.env'
  exit 1
fi
```

赋予执行权限：
```bash
chmod +x .git/hooks/pre-commit
```

### 3. 更新 .gitignore

确认 `.gitignore` 已正确配置：

```gitignore
# Environment files
.env
.env.local
.env.*.local
!.env.example

backend/.env
backend/.env.local
backend/.env.*.local
!backend/.env.example

frontend/.env
frontend/.env.local
frontend/.env.*.local
!frontend/.env.example

# Production files (never commit)
.env.production
backend/.env.production
frontend/.env.production
```

### 4. 通知团队成员

```markdown
@all 

⚠️ **安全警告：Git 历史中暴露了敏感信息**

我们发现在 Git 历史中提交了包含数据库密码的 .env 文件。

**已采取的措施：**
1. ✅ 已清理 Git 历史
2. ✅ 已更新 .gitignore
3. ✅ 已配置 GitHub Secrets

**需要立即执行：**
1. ❗ 修改数据库密码
2. ❗ 更换 APP_SECRET 和 JWT_SECRET
3. ❗ 重新拉取仓库：
   ```bash
   git clone <repo-url> smart-kitchen-new
   # 不要使用旧的 clone！
   ```

抱歉造成不便。
```

---

## 📊 各方案对比

| 方案 | 速度 | 复杂度 | 推荐度 |
|------|------|--------|--------|
| BFG Repo-Cleaner | ⚡⚡⚡ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Filter-Branch | ⚡⚡ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Interactive Rebase | ⚡ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🚀 推荐执行流程

### 最快方案（5 分钟完成）

```bash
# 1. 下载 BFG
# https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# 2. 执行清理
java -jar bfg-1.14.0.jar --delete-files '*.env' --delete-files '*.env.*'

# 3. 清理引用
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 4. 强制推送
git push --force

# 5. 验证
git log --all -- "*env*"
# 应该没有任何输出
```

---

## ✅ 验证清理成功

```bash
# 1. 检查 Git 历史
git log --all --full-history -- "*env*"
# 应该显示为空

# 2. 搜索敏感内容
git log --all -p | grep -i "DB_PASSWORD"
# 应该没有任何输出

# 3. 检查远程仓库
# 访问 GitHub 仓库页面，查看 Commits 标签
# 搜索 ".env" 应该没有结果
```

---

## 🆘 如果遇到问题

### 问题：强制推送被拒绝

```bash
# 原因：远程仓库保护
# 解决：联系仓库管理员或临时关闭保护

# 或在 GitHub 设置中：
# Settings → Branches → Branch protection rules → Edit
# 取消勾选 "Include administrators"
```

### 问题：其他协作者已 clone

```bash
# 通知所有人删除旧仓库
rm -rf smart-kitchen

# 重新 clone
git clone <repo-url> smart-kitchen
```

### 问题：GitHub Actions 失败

```bash
# 清理后可能需要重新触发
# 访问：https://github.com/<user>/smart-kitchen/actions
# 手动运行一次 workflow
```

---

## 📞 获取帮助

- BFG 官方文档：https://rtyley.github.io/bfg-repo-cleaner/
- Git 官方文档：https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository

---

**最后更新：** 2026-03-16  
**维护者：** Smart Kitchen Team
