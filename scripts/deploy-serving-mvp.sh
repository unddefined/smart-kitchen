#!/bin/bash
# 智能厨房出餐逻辑MVP系统部署脚本

set -e

echo "🚀 开始部署智能厨房出餐逻辑MVP系统..."

# 数据库连接参数
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"smart_kitchen_prod"}
DB_USER=${DB_USER:-"smart_kitchen_user"}
DB_PASSWORD=${DB_PASSWORD:-""}

# 检查环境变量
if [ -z "$DB_PASSWORD" ]; then
    echo "❌ 请设置数据库密码环境变量: export DB_PASSWORD=your_password"
    exit 1
fi

# 1. 部署数据库逻辑
echo "📋 1. 部署数据库出餐逻辑..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/serving-logic-mvp.sql

# 2. 验证部署结果
echo "✅ 2. 验证部署结果..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'

-- 验证MVP函数是否存在
SELECT '=== 验证MVP出餐逻辑函数 ===' as info;
SELECT proname as function_name, 
       pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND proname IN ('calculate_dish_priority_mvp', 'auto_adjust_priorities_for_order', 
                'complete_dish_prep_mvp', 'serve_dish_mvp', 'detect_urgent_dishes')
ORDER BY proname;

-- 验证MVP视图是否存在
SELECT '=== 验证MVP出餐逻辑视图 ===' as info;
SELECT viewname as view_name
FROM pg_views
WHERE schemaname = 'public'
AND viewname IN ('dish_serving_order_mvp', 'order_item_serving_status_mvp', 'serving_alerts_mvp')
ORDER BY viewname;

-- 测试基本功能
SELECT '=== 测试MVP优先级计算 ===' as info;
SELECT 
    '前菜测试' as test_case,
    calculate_dish_priority_mvp('前菜', FALSE, 0) as result
UNION ALL
SELECT 
    '后来加菜测试' as test_case,
    calculate_dish_priority_mvp('前菜', TRUE, 0) as result
UNION ALL
SELECT 
    '中菜测试' as test_case,
    calculate_dish_priority_mvp('中菜', FALSE, 0) as result;

SELECT '=== MVP出餐逻辑部署验证完成 ===' as status;

EOF

# 3. 部署后端API
echo "🔧 3. 部署后端API服务..."
cd backend

# 安装依赖
npm install

# 构建项目
npm run build

# 启动服务（可根据实际情况调整）
# npm run start:prod &

cd ..

# 4. 部署前端应用
echo "🌐 4. 部署前端应用..."
cd frontend

# 安装依赖
npm install

# 构建项目
npm run build

# 部署到服务器（示例，根据实际情况调整）
# scp -r dist/* user@server:/var/www/smart-kitchen/

cd ..

echo "🎉 MVP出餐逻辑系统部署完成！"

# 5. 显示使用说明
echo ""
echo "📚 === 使用说明 ==="
echo ""
echo "📊 数据库查询示例:"
echo "   # 查看MVP出餐顺序配置"
echo "   SELECT * FROM dish_serving_order_mvp ORDER BY serving_sequence;"
echo ""
echo "   # 查看订单出餐状态"
echo "   SELECT * FROM order_item_serving_status_mvp WHERE order_id = [订单ID];"
echo ""
echo "   # 查看MVP出餐提醒"
echo "   SELECT * FROM serving_alerts_mvp;"
echo ""
echo "   # 检测紧急菜品"
echo "   SELECT * FROM detect_urgent_dishes();"
echo ""
echo "🖥️  API接口文档:"
echo "   GET    /api/serving/orders/:orderId/status     # 获取订单出餐状态"
echo "   PUT    /api/serving/items/:itemId/priority     # 更新菜品优先级（催菜）"
echo "   POST   /api/serving/items/:itemId/complete-prep # 标记制作完成"
echo "   POST   /api/serving/items/:itemId/serve        # 标记已上菜"
echo "   POST   /api/serving/orders/:orderId/auto-adjust # 自动调整优先级"
echo "   GET    /api/serving/alerts                     # 获取出餐提醒"
echo "   GET    /api/serving/urgent-dishes              # 检测紧急菜品"
echo ""
echo "📱 前端访问:"
echo "   构建文件位于: frontend/dist/"
echo "   可通过Web服务器部署访问"
echo ""
echo "⚙️  MVP核心功能:"
echo "   • 红色卡片: 优先级3，催菜处理"
echo "   • 黄色卡片: 优先级2，等待处理"  
echo "   • 绿色卡片: 优先级1，正常处理"
echo "   • 灰色卡片: 优先级0，未起菜"
echo "   • 已出菜品: 优先级-1"
echo ""
echo "📋 出餐顺序:"
echo "   前菜(3) → 中菜(2) → 后菜(1) → 尾菜(1)"
echo "   后来加菜自动获得优先级3"
echo "   前面菜品完成后后面菜品自动+1优先级"