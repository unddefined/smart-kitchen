# 智能厨房出餐逻辑系统

## 概述
根据MVP文档要求设计实现的智能出餐逻辑系统，实现菜品制作和上菜的自动化优先级管理。

## 核心功能

### 1. 智能优先级管理
- **自动优先级分配**: 根据菜品分类自动设置制作优先级
- **动态优先级调整**: 前序菜品完成后自动提升后续菜品优先级
- **特殊处理**: 后来加菜的菜品自动获得最高优先级(3级)

### 2. 标准化出餐顺序
按照MVP文档要求的顺序：
1. **凉菜** (优先级3) - 最高优先级
2. **前菜** (优先级3) - 餐前小食
3. **中菜/点心/蒸菜** (优先级2) - 主菜类
4. **后菜/尾菜** (优先级1) - 餐后菜品
5. **已出** (优先级-1) - 已出
6. **未起** (优先级0) - 待开始

### 3. 状态跟踪与提醒
- 实时跟踪每个菜品的制作状态
- 自动生成出餐提醒和预警
- 提供可视化状态监控

## 系统组成

### 数据库组件
- **serving-logic.sql**: 核心出餐逻辑函数和视图
- **serving-procedures.sql**: 状态管理存储过程

### API接口
- **serving-api-design.md**: 完整的RESTful API设计文档

### 部署脚本
- **deploy-serving-logic.sh**: Linux/Mac部署脚本
- **deploy-serving-logic.bat**: Windows部署脚本

## 部署使用

### 一键部署
```bash
# Linux/Mac
chmod +x scripts/deploy-serving-logic.sh
./scripts/deploy-serving-logic.sh

# Windows
scripts\deploy-serving-logic.bat
```

### 手动部署
```bash
# 部署核心逻辑
psql -h localhost -U postgres -d smart_kitchen_dev -f database/serving-logic.sql

# 部署存储过程
psql -h localhost -U postgres -d smart_kitchen_dev -f database/serving-procedures.sql
```

## 核心算法

### 优先级计算
```sql
-- 前菜/凉菜: 优先级3
-- 中菜/点心/蒸菜: 优先级2  
-- 后菜/尾菜: 优先级1
-- 后来加菜: 优先级3
-- 已出: 优先级-1
-- 未开始: 优先级0
```

### 自动调整机制
1. 当某分类菜品制作完成后，系统自动将后续分类菜品优先级+1
2. 新增菜品（订单起菜10分钟后添加）自动获得优先级3
3. 定期检查并纠正不符合规则的优先级设置

## 状态流转
```
pending(待制作) 
    ↓ 开始制作
prep(制作中)
    ↓ 制作完成
ready(准备完成)
    ↓ 上菜完成
served(已上菜)
```

## 监控与提醒

### 出餐提醒视图
```sql
SELECT * FROM serving_alerts;
```

### 实时状态查询
```sql
-- 查看特定订单状态
SELECT * FROM order_item_serving_status WHERE order_id = 123;

-- 查看所有待处理提醒
SELECT * FROM serving_alerts WHERE alert_type IN ('需要提升优先级', '等待制作');
```

## API集成示例

### 前端调用示例
```javascript
// 获取订单出餐状态
const getOrderServingStatus = async (orderId) => {
  const response = await fetch(`/api/orders/${orderId}/serving-status`);
  return response.json();
};

// 催菜操作
const urgeDish = async (itemId, reason = '客户催菜') => {
  const response = await fetch(`/api/order-items/${itemId}/priority`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority: 3, reason })
  });
  return response.json();
};
```

## 性能优化

### 数据库优化
- 为关键字段创建索引
- 使用物化视图提高查询性能
- 合理设计触发器减少冗余计算

### 系统监控
- 定期清理历史数据
- 监控存储过程执行效率
- 跟踪API响应时间

## 扩展性考虑

### 未来增强功能
- 支持自定义优先级规则
- 集成厨师技能等级影响
- 添加预计完成时间计算
- 实现多厨房协同调度

### 架构设计
- 模块化设计便于功能扩展
- 松耦合的API接口设计
- 支持微服务架构拆分

## 故障排除

### 常见问题
1. **优先级不更新**: 检查存储过程是否正确执行
2. **状态流转异常**: 验证触发器和约束条件
3. **性能问题**: 检查索引和查询优化

### 调试命令
```sql
-- 检查函数是否存在
SELECT proname FROM pg_proc WHERE proname LIKE '%serving%';

-- 查看视图定义
\d+ order_item_serving_status

-- 测试优先级计算
SELECT calculate_dish_priority(1, false, 0);
```

## 维护建议

### 定期维护任务
- 每周检查系统性能指标
- 每月审查优先级规则有效性
- 定期备份关键存储过程

### 监控指标
- 平均出餐时间
- 优先级调整频率
- 系统响应时间
- 错误发生率