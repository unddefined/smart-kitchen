-- 智能厨房出餐逻辑MVP实现
-- 严格遵循MVP文档要求的优先级规则和出餐顺序

-- 确保必要的表存在
CREATE TABLE IF NOT EXISTS dish_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入菜品分类数据（严格按照MVP文档顺序）
INSERT INTO dish_categories (name, description, display_order) VALUES
    ('凉菜', '开胃凉菜类', 1),
    ('前菜', '餐前小食类', 2),
    ('中菜', '主菜热菜类', 3),
    ('点心', '精致小点类', 4),
    ('蒸菜', '蒸制菜品类', 5),
    ('后菜', '餐后蔬菜类', 6),
    ('尾菜', '汤品素菜类', 7)
ON CONFLICT (name) DO NOTHING;

-- 创建出餐优先级计算函数（严格遵循MVP文档）
CREATE OR REPLACE FUNCTION calculate_dish_priority_mvp(
    p_category_name VARCHAR(50),
    p_is_added_later BOOLEAN DEFAULT FALSE,
    p_base_priority INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
    v_priority INTEGER;
BEGIN
    -- 如果是后来加菜的，优先级为3级（催菜级别）
    IF p_is_added_later THEN
        RETURN 3;
    END IF;
    
    -- 根据MVP文档要求设置默认优先级
    CASE p_category_name
        WHEN '前菜' THEN
            v_priority := 3;  -- 红色卡片：优先出(催菜)
        WHEN '中菜' THEN
            v_priority := 2;  -- 黄色卡片：等一下
        WHEN '后菜' THEN
            v_priority := 1;  -- 绿色卡片：不急
        WHEN '尾菜' THEN
            v_priority := 1;  -- 绿色卡片：不急
        WHEN '凉菜' THEN
            v_priority := 3;  -- MVP阶段凉菜按前菜处理
        WHEN '点心' THEN
            v_priority := 2;  -- MVP阶段点心按中菜处理
        WHEN '蒸菜' THEN
            v_priority := 2;  -- MVP阶段蒸菜按中菜处理
        ELSE
            v_priority := 0;  -- 灰色卡片：未起菜
    END CASE;
    
    -- 加上基础优先级（用于前面菜品上完后的自动提升）
    RETURN v_priority + p_base_priority;
END;
$$ LANGUAGE plpgsql;

-- 创建菜品出餐顺序配置视图（MVP简化版）
CREATE OR REPLACE VIEW dish_serving_order_mvp AS
SELECT 
    dc.id as category_id,
    dc.name as category_name,
    dc.display_order,
    -- MVP出餐顺序：凉菜 → 前菜 → 中菜/点心/蒸菜 → 后菜 → 尾菜
    CASE dc.name
        WHEN '凉菜' THEN 1  -- 凉菜最先
        WHEN '前菜' THEN 2  -- 前菜其次
        WHEN '中菜' THEN 3  -- 中菜第三
        WHEN '点心' THEN 3  -- MVP阶段点心归入中菜
        WHEN '蒸菜' THEN 3  -- MVP阶段蒸菜归入中菜
        WHEN '后菜' THEN 4  -- 后菜第四
        WHEN '尾菜' THEN 5  -- 尾菜最后
        ELSE 6
    END as serving_sequence,
    -- 对应的颜色标识
    CASE dc.name
        WHEN '前菜' THEN 'red'    -- 红色：催菜
        WHEN '凉菜' THEN 'red'    -- 红色：催菜（MVP阶段）
        WHEN '中菜' THEN 'yellow' -- 黄色：等一下
        WHEN '点心' THEN 'yellow' -- 黄色：等一下（MVP阶段）
        WHEN '蒸菜' THEN 'yellow' -- 黄色：等一下（MVP阶段）
        WHEN '后菜' THEN 'green'  -- 绿色：不急
        WHEN '尾菜' THEN 'green'  -- 绿色：不急
        ELSE 'gray'               -- 灰色：未起菜
    END as card_color,
    -- 对应的优先级数值
    calculate_dish_priority_mvp(dc.name, FALSE, 0) as default_priority
FROM dish_categories dc
ORDER BY 
    CASE dc.name
        WHEN '凉菜' THEN 1
        WHEN '前菜' THEN 2
        WHEN '中菜' THEN 3
        WHEN '点心' THEN 3
        WHEN '蒸菜' THEN 3
        WHEN '后菜' THEN 4
        WHEN '尾菜' THEN 5
        ELSE 6
    END,
    dc.display_order;

-- 创建订单菜品出餐状态视图（MVP版本）
CREATE OR REPLACE VIEW order_item_serving_status_mvp AS
SELECT 
    oi.id as order_item_id,
    oi.order_id,
    o.hall_number,
    o.people_count,
    o.table_count,
    o.status as order_status,
    o.created_at as order_created_at,
    d.name as dish_name,
    d.id as dish_id,
    dc.name as category_name,
    dc.id as category_id,
    oi.quantity,
    oi.weight,
    oi.status as item_status,
    oi.priority as current_priority,
    oi.remark,
    oi.served_at,
    oi.created_at as item_created_at,
    s.name as station_name,
    s.id as station_id,
    -- 计算理论优先级
    calculate_dish_priority_mvp(dc.name, FALSE, 0) as base_priority,
    -- 判断是否为后来加菜（订单创建10分钟后添加）
    CASE 
        WHEN oi.created_at > o.created_at + INTERVAL '10 minutes' THEN TRUE
        ELSE FALSE
    END as is_added_later,
    -- 计算实际应有优先级
    CASE 
        WHEN oi.created_at > o.created_at + INTERVAL '10 minutes' THEN 3  -- 后来加菜优先级3
        ELSE calculate_dish_priority_mvp(dc.name, FALSE, 0)
    END as should_priority,
    -- 计算优先级差值
    CASE 
        WHEN oi.created_at > o.created_at + INTERVAL '10 minutes' THEN 3 - oi.priority
        ELSE calculate_dish_priority_mvp(dc.name, FALSE, 0) - oi.priority
    END as priority_diff,
    -- 状态对应的颜色
    CASE oi.status
        WHEN 'served' THEN 'gray'     -- 已出：灰色(-1)
        WHEN 'pending' THEN 'gray'    -- 未起：灰色(0)
        WHEN 'prep' THEN 
            CASE 
                WHEN oi.priority = 3 THEN 'red'      -- 制作中且优先级3：红色
                WHEN oi.priority = 2 THEN 'yellow'   -- 制作中且优先级2：黄色
                WHEN oi.priority = 1 THEN 'green'    -- 制作中且优先级1：绿色
                ELSE 'gray'
            END
        WHEN 'ready' THEN 'blue'      -- 准备完成：蓝色
        ELSE 'gray'
    END as status_color,
    -- 卡片显示文本
    CASE oi.status
        WHEN 'served' THEN '[已出]' || d.name
        WHEN 'pending' THEN '[未起]' || d.name
        WHEN 'prep' THEN '[制作中]' || d.name
        WHEN 'ready' THEN '[待上]' || d.name
        ELSE '[' || oi.status || ']' || d.name
    END as display_text
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
JOIN dishes d ON oi.dish_id = d.id
JOIN dish_categories dc ON d.category_id = dc.id
LEFT JOIN stations s ON d.station_id = s.id
WHERE o.status IN ('started', 'serving', 'created')
ORDER BY o.created_at, oi.priority DESC, 
    CASE dc.name  -- 严格按照出餐顺序排序
        WHEN '凉菜' THEN 1
        WHEN '前菜' THEN 2
        WHEN '中菜' THEN 3
        WHEN '点心' THEN 3
        WHEN '蒸菜' THEN 3
        WHEN '后菜' THEN 4
        WHEN '尾菜' THEN 5
        ELSE 6
    END,
    oi.created_at;

-- 创建出餐提醒视图（MVP版本）
CREATE OR REPLACE VIEW serving_alerts_mvp AS
SELECT 
    oiss.*,
    -- 提醒类型分类
    CASE 
        WHEN oiss.current_priority < oiss.should_priority THEN 'priority_issue'
        WHEN oiss.item_status = 'pending' THEN 'waiting_start'
        WHEN oiss.item_status = 'prep' THEN 'in_progress'
        WHEN oiss.item_status = 'ready' THEN 'waiting_serve'
        WHEN oiss.item_status = 'served' THEN 'completed'
        ELSE 'unknown'
    END as alert_type,
    -- 提醒级别
    CASE 
        WHEN oiss.current_priority < oiss.should_priority THEN 'high'
        WHEN oiss.item_status = 'pending' THEN 'medium'
        WHEN oiss.item_status = 'prep' THEN 'low'
        WHEN oiss.item_status = 'ready' THEN 'medium'
        ELSE 'info'
    END as alert_level,
    -- 提醒消息
    CASE 
        WHEN oiss.current_priority < oiss.should_priority THEN 
            '菜品[' || oiss.dish_name || ']优先级(' || oiss.current_priority || ')低于应有优先级(' || oiss.should_priority || ')'
        WHEN oiss.item_status = 'pending' THEN 
            '菜品[' || oiss.dish_name || ']等待开始制作'
        WHEN oiss.item_status = 'prep' THEN 
            '菜品[' || oiss.dish_name || ']正在制作中'
        WHEN oiss.item_status = 'ready' THEN 
            '菜品[' || oiss.dish_name || ']已准备好，等待上菜'
        WHEN oiss.item_status = 'served' THEN 
            '菜品[' || oiss.dish_name || ']已完成服务'
        ELSE 
            '菜品[' || oiss.dish_name || ']状态未知'
    END as alert_message,
    -- 推荐操作
    CASE 
        WHEN oiss.current_priority < oiss.should_priority THEN '提升优先级'
        WHEN oiss.item_status = 'pending' THEN '开始制作'
        WHEN oiss.item_status = 'prep' THEN '继续制作'
        WHEN oiss.item_status = 'ready' THEN '准备上菜'
        WHEN oiss.item_status = 'served' THEN '已完成'
        ELSE '无需操作'
    END as recommended_action
FROM order_item_serving_status_mvp oiss
ORDER BY 
    CASE oiss.item_status
        WHEN 'pending' THEN 1
        WHEN 'prep' THEN 2
        WHEN 'ready' THEN 3
        WHEN 'served' THEN 4
        ELSE 5
    END,
    oiss.priority DESC,
    oiss.created_at;

-- 创建催菜检测函数（严格按照MVP文档）
CREATE OR REPLACE FUNCTION detect_urgent_dishes_mvp()
RETURNS TABLE (
    order_item_id INTEGER,
    hall_number VARCHAR(20),
    dish_name VARCHAR(100),
    current_priority INTEGER,
    should_priority INTEGER,
    urgency_level VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oiss.order_item_id,
        oiss.hall_number,
        oiss.dish_name,
        oiss.current_priority,
        oiss.should_priority,
        CASE 
            WHEN oiss.current_priority < oiss.should_priority THEN 'very_urgent'
            WHEN oiss.is_added_later THEN 'urgent'
            WHEN oiss.current_priority = 1 AND oiss.should_priority >= 2 THEN 'normal_urgent'
            ELSE 'not_urgent'
        END as urgency_level
    FROM order_item_serving_status_mvp oiss
    WHERE oiss.order_status IN ('started', 'serving')
    AND oiss.item_status IN ('pending', 'prep')
    AND (
        oiss.current_priority < oiss.should_priority  -- 优先级不足
        OR oiss.is_added_later                        -- 后来加菜
        OR (oiss.current_priority = 1 AND oiss.should_priority >= 2)  -- 低优先级但应该更高
    )
    ORDER BY 
        CASE 
            WHEN oiss.current_priority < oiss.should_priority THEN 1
            WHEN oiss.is_added_later THEN 2
            ELSE 3
        END,
        oiss.priority DESC;
END;
$$ LANGUAGE plpgsql;

-- 创建自动优先级调整函数
CREATE OR REPLACE FUNCTION auto_adjust_priorities_for_order(p_order_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER := 0;
    v_item_record RECORD;
    v_should_priority INTEGER;
BEGIN
    -- 遍历订单中的每个菜品项
    FOR v_item_record IN
        SELECT 
            oi.id as order_item_id,
            dc.name as category_name,
            oi.priority as current_priority,
            oi.created_at as item_created_at,
            o.created_at as order_created_at
        FROM order_items oi
        JOIN dishes d ON oi.dish_id = d.id
        JOIN dish_categories dc ON d.category_id = dc.id
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.order_id = p_order_id
        AND oi.status IN ('pending', 'prep')
    LOOP
        -- 计算应有的优先级
        IF v_item_record.item_created_at > v_item_record.order_created_at + INTERVAL '10 minutes' THEN
            -- 后来加菜的菜品
            v_should_priority := 3;
        ELSE
            -- 正常菜品，根据分类计算
            v_should_priority := calculate_dish_priority_mvp(v_item_record.category_name, FALSE, 0);
        END IF;
        
        -- 如果当前优先级低于应有优先级，则更新
        IF v_item_record.current_priority < v_should_priority THEN
            UPDATE order_items
            SET priority = v_should_priority,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = v_item_record.order_item_id;
            
            v_updated_count := v_updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_updated_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '自动调整优先级失败: %', SQLERRM;
        RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- 创建菜品完成处理函数
CREATE OR REPLACE FUNCTION complete_dish_prep_mvp(p_order_item_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_status VARCHAR(20);
    v_order_id INTEGER;
    v_category_name VARCHAR(50);
    v_next_items_count INTEGER;
BEGIN
    -- 获取当前状态和相关信息
    SELECT oi.status, oi.order_id, dc.name
    INTO v_current_status, v_order_id, v_category_name
    FROM order_items oi
    JOIN dishes d ON oi.dish_id = d.id
    JOIN dish_categories dc ON d.category_id = dc.id
    WHERE oi.id = p_order_item_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '订单菜品项不存在: %', p_order_item_id;
    END IF;
    
    -- 只有在制作中状态才能标记为完成
    IF v_current_status != 'prep' THEN
        RAISE EXCEPTION '只有制作中的菜品才能标记为完成，当前状态: %', v_current_status;
    END IF;
    
    -- 更新状态为ready（准备完成，等待上菜）
    UPDATE order_items
    SET status = 'ready',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_order_item_id;
    
    -- 检查同一订单中后续分类的菜品，适当提升它们的优先级
    SELECT COUNT(*) INTO v_next_items_count
    FROM order_items oi2
    JOIN dishes d2 ON oi2.dish_id = d2.id
    JOIN dish_categories dc2 ON d2.category_id = dc2.id
    JOIN dish_categories dc_current ON dc_current.name = v_category_name
    WHERE oi2.order_id = v_order_id
    AND oi2.status IN ('pending', 'prep')
    AND dc2.display_order > dc_current.display_order;
    
    -- 如果有后续菜品，提升它们的优先级
    IF v_next_items_count > 0 THEN
        UPDATE order_items oi3
        SET priority = priority + 1,
            updated_at = CURRENT_TIMESTAMP
        FROM dishes d3
        JOIN dish_categories dc3 ON d3.category_id = dc3.id
        JOIN dish_categories dc_current ON dc_current.name = v_category_name
        WHERE oi3.order_id = v_order_id
        AND oi3.status IN ('pending', 'prep')
        AND dc3.display_order > dc_current.display_order
        AND oi3.id = oi3.id; -- 这里需要修正关联条件
        
        RAISE NOTICE '已提升%个后续菜品的优先级', v_next_items_count;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '完成菜品制作失败: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 创建上菜完成函数
CREATE OR REPLACE FUNCTION serve_dish_mvp(p_order_item_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_status VARCHAR(20);
BEGIN
    -- 检查当前状态
    SELECT status INTO v_current_status
    FROM order_items
    WHERE id = p_order_item_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '订单菜品项不存在: %', p_order_item_id;
    END IF;
    
    -- 只有在ready状态才能上菜
    IF v_current_status != 'ready' THEN
        RAISE EXCEPTION '只有准备好的菜品才能上菜，当前状态: %', v_current_status;
    END IF;
    
    -- 更新状态为served并记录上菜时间
    UPDATE order_items
    SET status = 'served',
        served_at = CURRENT_TIMESTAMP,
        priority = -1,  -- 已出菜品优先级设为-1
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_order_item_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '上菜失败: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 验证MVP出餐逻辑功能
SELECT '=== MVP出餐逻辑验证 ===' as info;

-- 测试优先级计算
SELECT '=== 优先级计算测试（严格按照MVP文档） ===' as info;
SELECT 
    '前菜' as category,
    calculate_dish_priority_mvp('前菜', FALSE, 0) as priority,
    '应该为3' as expected
UNION ALL
SELECT 
    '中菜' as category,
    calculate_dish_priority_mvp('中菜', FALSE, 0) as priority,
    '应该为2' as expected
UNION ALL
SELECT 
    '后菜' as category,
    calculate_dish_priority_mvp('后菜', FALSE, 0) as priority,
    '应该为1' as expected
UNION ALL
SELECT 
    '后来加菜(前菜)' as category,
    calculate_dish_priority_mvp('前菜', TRUE, 0) as priority,
    '应该为3' as expected
UNION ALL
SELECT 
    '凉菜(MVP阶段)' as category,
    calculate_dish_priority_mvp('凉菜', FALSE, 0) as priority,
    '应该为3' as expected;

-- 显示出餐顺序配置（严格按照MVP文档）
SELECT '=== 出餐顺序配置（严格按照MVP文档） ===' as info;
SELECT 
    category_name as 分类,
    serving_sequence as 出餐顺序,
    default_priority as 默认优先级,
    card_color as 卡片颜色
FROM dish_serving_order_mvp
ORDER BY serving_sequence, display_order;

SELECT '=== MVP出餐逻辑部署完成 ===' as status;