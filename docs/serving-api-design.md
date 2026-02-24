# 出餐逻辑API接口设计

## 概述
根据MVP文档要求设计的出餐逻辑API接口，实现智能化的菜品制作和上菜顺序管理。

## 核心API接口

### 1. 获取订单出餐状态
```
GET /api/orders/:orderId/serving-status
```
**功能**: 获取指定订单的详细出餐状态和优先级信息

**响应示例**:
```json
{
  "orderId": 123,
  "hallNumber": "A01",
  "peopleCount": 4,
  "orderStatus": "started",
  "items": [
    {
      "itemId": 456,
      "dishName": "椒盐基围虾",
      "category": "前菜",
      "currentPriority": 3,
      "shouldPriority": 3,
      "status": "prep",
      "quantity": 2,
      "station": "热菜",
      "isAddedLater": false,
      "alertMessage": "制作中"
    },
    {
      "itemId": 457,
      "dishName": "红烧肉",
      "category": "中菜", 
      "currentPriority": 2,
      "shouldPriority": 2,
      "status": "pending",
      "quantity": 1,
      "station": "热菜",
      "isAddedLater": false,
      "alertMessage": "等待制作"
    }
  ],
  "alerts": [
    {
      "type": "等待制作",
      "message": "菜品[红烧肉]等待开始制作",
      "priority": "high"
    }
  ]
}
```

### 2. 更新菜品优先级
```
PUT /api/order-items/:itemId/priority
```
**请求体**:
```json
{
  "priority": 3,
  "reason": "客户催菜"
}
```

### 3. 标记菜品制作完成
```
POST /api/order-items/:itemId/complete-prep
```
**功能**: 将菜品状态从未完成标记为准备完成

### 4. 标记菜品已上菜
```
POST /api/order-items/:itemId/serve
```
**功能**: 将菜品状态从准备完成标记为已上菜

### 5. 自动调整订单优先级
```
POST /api/orders/:orderId/auto-adjust-priorities
```
**功能**: 根据出餐逻辑自动调整订单中所有菜品的优先级

### 6. 获取出餐提醒
```
GET /api/serving/alerts
```
**功能**: 获取所有需要关注的出餐提醒

**响应示例**:
```json
{
  "highPriority": [
    {
      "orderId": 123,
      "hallNumber": "A01", 
      "dishName": "托炉饼",
      "alertType": "需要提升优先级",
      "message": "当前优先级(1)低于应有优先级(3)",
      "currentPriority": 1,
      "shouldPriority": 3
    }
  ],
  "mediumPriority": [
    {
      "orderId": 124,
      "hallNumber": "A02",
      "dishName": "宫保鸡丁", 
      "alertType": "等待制作",
      "message": "菜品[宫保鸡丁]等待开始制作"
    }
  ]
}
```

## 出餐逻辑规则

### 优先级设定
- **凉菜**: 优先级4（最高）
- **前菜**: 优先级3
- **中菜/点心/蒸菜**: 优先级2
- **后菜/尾菜**: 优先级1
- **后来加菜**: 优先级3（统一）

### 自动调整机制
1. 当前分类菜品完成后，后续分类菜品优先级自动+1
2. 新增菜品（10分钟后添加）自动获得优先级3
3. 系统定期检查并调整不符合规则的优先级

### 状态流转
```
pending(待制作) → prep(制作中) → ready(准备完成) → served(已上菜)
```

## 前端集成建议

### 实时更新
- 使用WebSocket订阅出餐状态变化
- 定期轮询获取最新提醒信息
- 状态变化时及时刷新UI

### 用户交互
- 提供一键催菜功能
- 显示菜品预计完成时间
- 突出显示高优先级提醒

### 视觉反馈
- 不同优先级用不同颜色标识
- 制作进度条显示
- 完成状态动画效果

## 错误处理

### 常见错误码
- `400`: 请求参数错误
- `404`: 订单或菜品不存在
- `409`: 状态冲突（如尝试对已完成的菜品进行操作）
- `500`: 系统内部错误

### 错误响应格式
```json
{
  "error": {
    "code": "INVALID_STATUS",
    "message": "当前状态不允许此操作",
    "details": "菜品状态为served，无法再次上菜"
  }
}
```

## 性能优化建议

1. **数据库索引**: 确保order_items表的status、priority字段有索引
2. **查询优化**: 使用分页获取大量订单数据
3. **缓存策略**: 缓存频繁访问的菜品分类信息
4. **批量操作**: 支持批量更新多个菜品状态