#!/bin/bash

# Git问题诊断和修复脚本
# 专门解决 'does not have a commit checked out' 错误

echo "🔍 开始Git问题诊断..."

# 1. 检查当前Git状态
echo "📋 当前Git状态:"
git status

# 2. 检查子模块状态
echo "📁 子模块状态:"
git submodule status

# 3. 检查backend目录状态
if [ -d "backend" ]; then
    echo "📂 backend目录存在"
    ls -la backend/
    
    # 检查是否为子模块
    if git ls-files --stage | grep -q "backend"; then
        echo "⚠️ backend被标记为子模块"
        # 获取子模块信息
        git ls-files --stage backend
    else
        echo "✅ backend是普通目录"
    fi
else
    echo "❌ backend目录不存在"
fi

# 4. 修复方案

echo ""
echo "🔧 执行修复方案..."

# 方案1: 如果是子模块问题
if git submodule status | grep -q "backend"; then
    echo "🛠️ 检测到子模块问题，正在修复..."
    
    # 初始化子模块
    git submodule init
    git submodule update
    
    # 或者移除子模块引用（如果不需要）
    # git rm --cached backend
    # rm -rf .git/modules/backend
fi

# 方案2: 重新添加文件
echo "➕ 重新添加文件..."
git add --all

# 方案3: 清理Git索引问题
echo "🧹 清理Git索引..."
git rm --cached -r . 2>/dev/null || echo "无缓存文件需要清理"

# 重新添加所有文件
echo "➕ 重新添加所有文件..."
git add .

# 5. 验证修复结果
echo ""
echo "✅ 修复完成，验证结果:"
git status

# 6. 显示提交建议
echo ""
echo "💡 下一步操作建议:"
echo "   git commit -m \"修复Git子模块问题\""
echo "   git push origin main"
