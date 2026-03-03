#!/bin/bash

# GitHub Actions 部署问题验证脚本
# 用途：在本地验证关键配置是否正确

set -e

echo "🔍 开始验证 GitHub Actions 部署配置..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 验证计数器
PASS=0
FAIL=0
WARN=0

# 检查函数
check_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARN++))
}

echo "======================================"
echo "1. 检查后端 Dockerfile 构建顺序"
echo "======================================"

# 读取 backend/Dockerfile
DOCKERFILE="backend/Dockerfile"
if [ -f "$DOCKERFILE" ]; then
    # 检查 prisma generate 是否在 npm run build 之前
    PRISMA_LINE=$(grep -n "prisma generate" "$DOCKERFILE" | head -1 | cut -d: -f1)
    BUILD_LINE=$(grep -n "npm run build" "$DOCKERFILE" | head -1 | cut -d: -f1)
    
    if [ ! -z "$PRISMA_LINE" ] && [ ! -z "$BUILD_LINE" ]; then
        if [ "$PRISMA_LINE" -lt "$BUILD_LINE" ]; then
            check_pass "Prisma generate 在 build 之前执行 (行 $PRISMA_LINE < 行 $BUILD_LINE)"
        else
            check_fail "Prisma generate 在 build 之后执行，可能导致类型缺失"
        fi
    else
        check_warn "无法找到 prisma generate 或 npm run build 命令"
    fi
    
    # 检查是否复制了 prisma 目录
    if grep -q "COPY.*prisma" "$DOCKERFILE"; then
        check_pass "Dockerfile 包含 prisma 目录复制"
    else
        check_fail "Dockerfile 未复制 prisma 目录"
    fi
else
    check_fail "后端 Dockerfile 不存在"
fi

echo ""
echo "======================================"
echo "2. 检查镜像地址一致性"
echo "======================================"

# 提取 docker-compose.yml 中的镜像地址
COMPOSE_BACKEND=$(grep -A1 "backend:" docker-compose.yml | grep "image:" | awk '{print $2}')
COMPOSE_FRONTEND=$(grep -A1 "frontend:" docker-compose.yml | grep "image:" | awk '{print $2}')

# 提取 deploy.yml 中的镜像地址
DEPLOY_BACKEND=$(grep "smart-kitchen-backend" .github/workflows/deploy.yml | grep "images:" | awk '{print $2}' | head -1)
DEPLOY_FRONTEND=$(grep "smart-kitchen-frontend" .github/workflows/deploy.yml | grep "images:" | awk '{print $2}' | head -1)

echo "Docker Compose 后端镜像：$COMPOSE_BACKEND"
echo "Actions 推送后端镜像：$DEPLOY_BACKEND"

# 注意：这里不检查 VPC 和非 VPC 的区别，因为两者都是有效的
if [ ! -z "$COMPOSE_BACKEND" ] && [ ! -z "$DEPLOY_BACKEND" ]; then
    # 提取仓库部分进行比较（忽略 -vpc 前缀）
    COMPOSE_REPO=$(echo "$COMPOSE_BACKEND" | sed 's/-vpc\././g')
    DEPLOY_REPO=$(echo "$DEPLOY_BACKEND" | sed 's/-vpc\././g')
    
    if [ "$COMPOSE_REPO" == "$DEPLOY_REPO" ]; then
        check_pass "后端镜像仓库地址一致（忽略 VPC 后缀）"
    else
        check_fail "后端镜像仓库地址不一致"
    fi
else
    check_warn "无法提取镜像地址进行对比"
fi

echo ""
echo "======================================"
echo "3. 检查 Prisma schema 文件"
echo "========================================"

SCHEMA_FILE="backend/prisma/schema.prisma"
if [ -f "$SCHEMA_FILE" ]; then
    check_pass "Prisma schema 文件存在"
    
    # 检查 datasource 配置
    if grep -q "datasource db" "$SCHEMA_FILE"; then
        check_pass "Datasource 配置存在"
    else
        check_fail "Datasource 配置缺失"
    fi
    
    # 检查 generator 配置
    if grep -q "generator client" "$SCHEMA_FILE"; then
        check_pass "Generator 配置存在"
    else
        check_fail "Generator 配置缺失"
    fi
else
    check_fail "Prisma schema 文件不存在"
fi

echo ""
echo "======================================"
echo "4. 检查 Nginx 配置文件"
echo "======================================"

NGINX_CONF="frontend/nginx/default.conf"
if [ -f "$NGINX_CONF" ]; then
    check_pass "Nginx 配置文件存在"
    
    # 检查是否配置了 API 代理
    if grep -q "location /api/" "$NGINX_CONF"; then
        check_pass "API 反向代理配置存在"
        
        # 检查代理目标
        if grep -q "proxy_pass.*backend" "$NGINX_CONF"; then
            check_pass "API 代理目标配置正确"
        else
            check_warn "API 代理目标可能未使用服务名"
        fi
    else
        check_fail "API 反向代理配置缺失"
    fi
else
    check_fail "Nginx 配置文件不存在"
fi

echo ""
echo "======================================"
echo "5. 检查环境变量配置"
echo "======================================"

ENV_PROD=".env.production"
if [ -f "$ENV_PROD" ]; then
    check_pass ".env.production 文件存在"
    
    # 检查必要的环境变量
    if grep -q "DATABASE_URL=" "$ENV_PROD"; then
        check_pass "DATABASE_URL 已配置"
    else
        check_fail "DATABASE_URL 未配置"
    fi
    
    if grep -q "NODE_ENV=" "$ENV_PROD"; then
        check_pass "NODE_ENV 已配置"
    else
        check_warn "NODE_ENV 未配置"
    fi
else
    check_warn ".env.production 文件不存在（可能通过 Secrets 管理）"
fi

echo ""
echo "======================================"
echo "6. 检查健康检查端点"
echo "======================================"

HEALTHCHECK_FILE="backend/src/app.controller.ts"
if [ -f "$HEALTHCHECK_FILE" ]; then
    if grep -q "health" "$HEALTHCHECK_FILE" || grep -q "Health" "$HEALTHCHECK_FILE"; then
        check_pass "健康检查端点可能存在"
    else
        check_warn "未在 app.controller.ts 中找到健康检查端点"
    fi
else
    # 尝试其他可能的文件
    CONTROLLER_FILES=$(find backend/src -name "*.controller.ts" | head -5)
    FOUND=false
    for file in $CONTROLLER_FILES; do
        if grep -q "health" "$file" 2>/dev/null; then
            check_pass "健康检查端点在 $(basename $file) 中找到"
            FOUND=true
            break
        fi
    done
    
    if [ "$FOUND" = false ]; then
        check_warn "未找到健康检查端点定义"
    fi
fi

echo ""
echo "======================================"
echo "7. 检查 Git 状态"
echo "======================================"

# 检查是否有未提交的更改
if git diff --quiet HEAD 2>/dev/null; then
    check_pass "工作目录干净，无未提交更改"
else
    check_warn "存在未提交的更改，请确认是否需要同步到服务器"
    echo "   未提交的文件:"
    git status --short | head -5
fi

# 检查当前分支
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" == "main" ] || [ "$CURRENT_BRANCH" == "master" ]; then
    check_pass "当前在主分支 ($CURRENT_BRANCH)"
else
    check_warn "当前不在主分支，而在: $CURRENT_BRANCH"
fi

echo ""
echo "======================================"
echo "验证总结"
echo "======================================"
echo -e "${GREEN}通过${NC}: $PASS"
echo -e "${YELLOW}警告${NC}: $WARN"
echo -e "${RED}失败${NC}: $FAIL"
echo ""

if [ $FAIL -gt 0 ]; then
    echo -e "${RED}❌ 发现 $FAIL 个严重问题，建议修复后再部署${NC}"
    exit 1
elif [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}⚠️  发现 $WARN 个警告，建议检查但不影响部署${NC}"
    exit 0
else
    echo -e "${GREEN}✅ 所有检查通过，可以安全部署${NC}"
    exit 0
fi
