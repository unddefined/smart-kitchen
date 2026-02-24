#!/bin/bash
# 交互式countable字段管理脚本

set -e

echo "=== dishes表countable字段手动管理工具 ==="
echo

# 数据库连接参数
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"smart_kitchen_dev"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-"postgres"}

# 显示当前状态
echo "当前菜品countable字段状态："
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    CASE 
        WHEN countable = TRUE THEN '按人数计数'
        WHEN countable = FALSE THEN '固定份量'
        ELSE '未设置'
    END as 类型,
    COUNT(*) as 数量
FROM dishes 
GROUP BY countable
ORDER BY countable DESC;
"

echo
echo "选择操作："
echo "1) 查看详细列表"
echo "2) 设置特定菜品为按人数计数"
echo "3) 设置特定菜品为固定份量"
echo "4) 批量设置某工位所有菜品"
echo "5) 退出"
echo

while true; do
    read -p "请输入选项 (1-5): " choice
    
    case $choice in
        1)
            echo "=== 详细菜品列表 ==="
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
            SELECT 
                id,
                name,
                shortcut_code,
                CASE 
                    WHEN countable = TRUE THEN '按人数计数'
                    WHEN countable = FALSE THEN '固定份量'
                    ELSE '未设置'
                END as 计数方式
            FROM dishes 
            ORDER BY countable DESC, name;
            "
            ;;
        2)
            read -p "请输入要设置为按人数计数的菜品ID或名称: " dish_input
            if [[ $dish_input =~ ^[0-9]+$ ]]; then
                # 按ID设置
                PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
                UPDATE dishes SET countable = TRUE WHERE id = $dish_input;
                SELECT '已将ID=' || $dish_input || '的菜品设置为按人数计数' as 结果;
                "
            else
                # 按名称设置
                PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
                UPDATE dishes SET countable = TRUE WHERE name = '$dish_input';
                SELECT '已将名称为\"$dish_input\"的菜品设置为按人数计数' as 结果;
                "
            fi
            ;;
        3)
            read -p "请输入要设置为固定份量的菜品ID或名称: " dish_input
            if [[ $dish_input =~ ^[0-9]+$ ]]; then
                PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
                UPDATE dishes SET countable = FALSE WHERE id = $dish_input;
                SELECT '已将ID=' || $dish_input || '的菜品设置为固定份量' as 结果;
                "
            else
                PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
                UPDATE dishes SET countable = FALSE WHERE name = '$dish_input';
                SELECT '已将名称为\"$dish_input\"的菜品设置为固定份量' as 结果;
                "
            fi
            ;;
        4)
            echo "可用工位："
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT id, name FROM stations ORDER BY id;"
            read -p "请输入工位ID: " station_id
            read -p "设置该工位所有菜品为按人数计数？(y/N): " confirm
            if [[ $confirm == "y" || $confirm == "Y" ]]; then
                PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
                UPDATE dishes SET countable = TRUE WHERE station_id = $station_id;
                SELECT '已将工位ID=' || $station_id || '的所有菜品设置为按人数计数' as 结果;
                "
            fi
            ;;
        5)
            echo "退出管理工具"
            break
            ;;
        *)
            echo "无效选项，请重新输入"
            ;;
    esac
    
    echo
done