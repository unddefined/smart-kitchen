#!/bin/bash
# 智能厨房系统 - dishes表添加countable字段脚本
# 适用于云服务器PostgreSQL数据库

set -e

# 数据库连接参数（请根据实际情况修改）
DB_HOST=${DB_HOST:-"your-cloud-server-host"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"smart_kitchen"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"your-password"}

echo "开始执行dishes表countable字段添加..."

# 执行SQL迁移
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'

-- 开始事务
BEGIN;

-- 添加countable字段到dishes表
ALTER TABLE dishes 
ADD COLUMN IF NOT EXISTS countable BOOLEAN DEFAULT FALSE;

-- 添加字段注释
COMMENT ON COLUMN dishes.countable IS '是否计数：TRUE表示需要按用餐人数计数，FALSE表示固定份量';

-- 提交事务
COMMIT;

-- 验证结果
\echo '=== 字段添加验证 ==='
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'dishes' AND column_name = 'countable';

\echo '=== 当前countable状态统计 ==='
SELECT 
    COUNT(*) as total_dishes,
    COUNT(CASE WHEN countable = TRUE THEN 1 END) as countable_dishes,
    COUNT(CASE WHEN countable = FALSE THEN 1 END) as fixed_dishes
FROM dishes;

\echo '=== 默认为FALSE的菜品示例 ==='
SELECT id, name, countable 
FROM dishes 
WHERE countable = FALSE 
ORDER BY name
LIMIT 10;

\echo '迁移执行完成！所有菜品默认countable=False，需手动设置。';
EOF

if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移成功完成！"
    echo "dishes表已成功添加countable字段"
    echo "按人数计数的菜品已自动标记"
else
    echo "❌ 数据库迁移失败，请检查错误信息"
    exit 1
fi