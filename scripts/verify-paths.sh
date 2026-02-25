#!/bin/bash

echo "=== Smart Kitchen 路径验证脚本 ==="
echo

PROJECT_DIRS=("/root/smart-kitchen" "/home/smart-kitchen")
SCRIPTS_DIR="./scripts"

echo "检查项目目录..."
for dir in "${PROJECT_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo "✅ 找到项目目录: $dir"
        PROJECT_DIR="$dir"
        break
    else
        echo "❌ 目录不存在: $dir"
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo "❌ 未找到任何项目目录"
    exit 1
fi

echo
echo "验证脚本中的路径引用..."

# 检查所有shell脚本
for script in $SCRIPTS_DIR/*.sh; do
    if [ -f "$script" ]; then
        echo "检查: $(basename $script)"
        
        # 检查是否包含正确的项目目录路径
        if grep -q "$PROJECT_DIR" "$script"; then
            echo "  ✅ 包含正确路径: $PROJECT_DIR"
        elif grep -q "/home/smart-kitchen\|/root/smart-kitchen" "$script"; then
            echo "  ⚠️  包含其他路径，可能需要修正"
        else
            echo "  ℹ️  未发现项目目录引用"
        fi
    fi
done

echo
echo "=== 路径验证完成 ==="
echo "当前项目目录: $PROJECT_DIR"
