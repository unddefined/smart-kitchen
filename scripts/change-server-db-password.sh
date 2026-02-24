#!/bin/bash
# 云服务器数据库密码修改脚本

# 服务器信息
SERVER_IP="8.145.34.30"
SSH_KEY="C:/Users/66948/.ssh/PWA应用密钥.pem"
SSH_USER="root"

# 新旧密码
OLD_PASSWORD="N9J8Vte7Ie7+Pl0hbb36yZ2ByYnkYsTZHual+DO+cOE="
NEW_PASSWORD="13814349230cX"

echo "🔐 修改云服务器数据库密码"
echo "服务器: $SERVER_IP"
echo "旧密码: $OLD_PASSWORD"
echo "新密码: $NEW_PASSWORD"
echo ""

# 检查SSH密钥是否存在
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH密钥文件不存在: $SSH_KEY"
    echo "请确认密钥文件路径正确"
    exit 1
fi

echo "🚀 正在连接到服务器..."

# 连接到服务器并修改数据库密码
ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" << EOF

echo "✅ 成功连接到服务器"
echo "当前时间: \$(date)"
echo ""

# 检查PostgreSQL容器状态
echo "🐳 检查PostgreSQL容器状态..."
CONTAINER_ID=\$(docker ps -q --filter "name=smart-kitchen-postgres-prod")
if [ -z "\$CONTAINER_ID" ]; then
    echo "❌ PostgreSQL容器未运行"
    exit 1
fi

echo "✅ PostgreSQL容器正在运行: \$CONTAINER_ID"

# 修改数据库用户密码
echo "🔐 正在修改数据库密码..."
docker exec \$CONTAINER_ID psql -U postgres -c "ALTER USER smart_kitchen_user WITH PASSWORD '$NEW_PASSWORD';"

if [ \$? -eq 0 ]; then
    echo "✅ 数据库密码修改成功"
else
    echo "❌ 数据库密码修改失败"
    exit 1
fi

# 验证密码修改
echo "🔍 验证密码修改..."
docker exec \$CONTAINER_ID psql -U smart_kitchen_user -d smart_kitchen_prod -c "SELECT current_user;" -W <<< "$NEW_PASSWORD"

if [ \$? -eq 0 ]; then
    echo "✅ 密码验证成功"
else
    echo "❌ 密码验证失败"
    exit 1
fi

# 更新环境变量文件（如果存在）
echo "📝 更新环境变量配置..."
if [ -f "/opt/smart-kitchen/.env.production" ]; then
    sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$NEW_PASSWORD/" /opt/smart-kitchen/.env.production
    echo "✅ 环境变量文件已更新"
else
    echo "⚠️  环境变量文件未找到"
fi

# 重启相关服务以应用新配置
echo "🔄 重启相关服务..."
cd /opt/smart-kitchen
docker-compose -f docker-compose.prod.yml restart backend

echo "✅ 服务重启完成"

echo ""
echo "🎉 数据库密码修改完成！"
echo "新密码: $NEW_PASSWORD"
echo "请确保更新所有客户端的数据库连接配置"

EOF

if [ $? -eq 0 ]; then
    echo "✅ 服务器数据库密码修改成功完成"
else
    echo "❌ 服务器数据库密码修改失败"
    exit 1
fi