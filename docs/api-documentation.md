# API接口文档模板

## 文档信息
- **API版本**: v1.0
- **最后更新**: 2024-01-15
- **基础URL**: `https://api.example.com/v1`
- **协议**: HTTPS

## 认证方式

### JWT Token认证
```http
Authorization: Bearer <jwt_token>
```

### 获取访问令牌
```http
POST /auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password123"
}
```

## 公共响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "uuid-string"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "uuid-string"
}
```

## 错误码说明

| 错误码 | 说明 | HTTP状态码 |
|--------|------|------------|
| 1001 | 参数验证失败 | 400 |
| 1002 | 资源不存在 | 404 |
| 1003 | 权限不足 | 403 |
| 1004 | 认证失败 | 401 |
| 1005 | 服务器内部错误 | 500 |
| 2001 | 订单已存在 | 409 |
| 2002 | 库存不足 | 422 |

## 订单管理接口

### 1. 创建订单

**接口地址**: `POST /orders`

**请求参数**:
```json
{
  "tableNumber": 5,
  "customerCount": 4,
  "waiterId": 123,
  "items": [
    {
      "dishId": 1,
      "quantity": 2,
      "remark": "少辣，不要香菜"
    },
    {
      "dishId": 3,
      "quantity": 1,
      "remark": "加米饭"
    }
  ],
  "remark": "生日聚餐，需要蜡烛"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD20240115001",
    "orderNumber": "20240115-001",
    "tableNumber": 5,
    "customerCount": 4,
    "status": "pending",
    "totalAmount": 158.50,
    "createdAt": "2024-01-15T10:30:00Z",
    "estimatedFinish": "2024-01-15T11:15:00Z",
    "items": [
      {
        "itemId": 1,
        "dishId": 1,
        "dishName": "宫保鸡丁",
        "quantity": 2,
        "unitPrice": 38.00,
        "subtotal": 76.00,
        "remark": "少辣，不要香菜",
        "status": "pending"
      }
    ]
  }
}
```

### 2. 查询订单列表

**接口地址**: `GET /orders`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| status | string | 否 | 订单状态(pending,confirmed,cooking,ready,delivered,cancelled) |
| tableNumber | integer | 否 | 桌号 |
| startDate | string | 否 | 开始日期(YYYY-MM-DD) |
| endDate | string | 否 | 结束日期(YYYY-MM-DD) |
| page | integer | 否 | 页码，默认1 |
| size | integer | 否 | 每页大小，默认20 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "orderId": "ORD20240115001",
        "orderNumber": "20240115-001",
        "tableNumber": 5,
        "customerCount": 4,
        "status": "cooking",
        "priority": "normal",
        "totalAmount": 158.50,
        "createdAt": "2024-01-15T10:30:00Z",
        "items": [
          {
            "dishName": "宫保鸡丁",
            "quantity": 2,
            "status": "cooking"
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "size": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

### 3. 获取订单详情

**接口地址**: `GET /orders/{orderId}`

**路径参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| orderId | string | 是 | 订单ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD20240115001",
    "orderNumber": "20240115-001",
    "tableNumber": 5,
    "customerCount": 4,
    "status": "cooking",
    "priority": "urgent",
    "totalAmount": 158.50,
    "remark": "生日聚餐，需要蜡烛",
    "createdAt": "2024-01-15T10:30:00Z",
    "createdBy": {
      "userId": 123,
      "username": "服务员A"
    },
    "items": [
      {
        "itemId": 1,
        "dishId": 1,
        "dishName": "宫保鸡丁",
        "quantity": 2,
        "unitPrice": 38.00,
        "subtotal": 76.00,
        "remark": "少辣，不要香菜",
        "status": "cooking",
        "assignedStation": {
          "stationId": 1,
          "stationName": "炒菜间"
        },
        "chef": {
          "userId": 456,
          "username": "厨师甲"
        },
        "startedAt": "2024-01-15T10:35:00Z"
      }
    ]
  }
}
```

### 4. 更新订单状态

**接口地址**: `PUT /orders/{orderId}/status`

**请求参数**:
```json
{
  "status": "ready",
  "remark": "所有菜品已准备好"
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "orderId": "ORD20240115001",
    "status": "ready",
    "updatedAt": "2024-01-15T11:15:00Z"
  }
}
```

### 5. 取消订单

**接口地址**: `DELETE /orders/{orderId}`

**请求参数**:
```json
{
  "reason": "客人临时取消"
}
```

## 菜品管理接口

### 1. 获取菜品列表

**接口地址**: `GET /dishes`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| categoryId | integer | 否 | 分类ID |
| status | string | 否 | 状态(active,inactive) |
| keyword | string | 否 | 关键词搜索 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "dishes": [
      {
        "dishId": 1,
        "name": "宫保鸡丁",
        "description": "经典川菜，鸡肉嫩滑，花生香脆",
        "price": 38.00,
        "category": {
          "categoryId": 1,
          "name": "热菜"
        },
        "station": {
          "stationId": 1,
          "name": "炒菜间"
        },
        "preparationTime": 15,
        "imageUrl": "https://example.com/images/kungpao-chicken.jpg",
        "tags": ["川菜", "辣味", "招牌"],
        "isActive": true
      }
    ]
  }
}
```

### 2. 获取菜品详情

**接口地址**: `GET /dishes/{dishId}`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "dishId": 1,
    "name": "宫保鸡丁",
    "description": "经典川菜，鸡肉嫩滑，花生香脆",
    "price": 38.00,
    "category": {
      "categoryId": 1,
      "name": "热菜"
    },
    "station": {
      "stationId": 1,
      "name": "炒菜间"
    },
    "ingredients": [
      {
        "name": "鸡胸肉",
        "quantity": "300g",
        "unit": "克"
      },
      {
        "name": "花生米",
        "quantity": "50g",
        "unit": "克"
      }
    ],
    "preparationSteps": [
      "鸡肉切丁腌制",
      "花生米炸至金黄",
      "调制宫保汁",
      "大火快炒"
    ],
    "nutritionalInfo": {
      "calories": 450,
      "protein": 25,
      "fat": 18,
      "carbohydrates": 35
    },
    "preparationTime": 15,
    "difficultyLevel": 3,
    "imageUrl": "https://example.com/images/kungpao-chicken.jpg",
    "tags": ["川菜", "辣味", "招牌"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## 工位管理接口

### 1. 获取工位列表

**接口地址**: `GET /stations`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "stations": [
      {
        "stationId": 1,
        "name": "炒菜间",
        "description": "负责各类炒制菜品",
        "type": "cooking",
        "capacity": 3,
        "currentLoad": 2,
        "equipment": ["炒炉", "油烟机", "调料台"],
        "isActive": true
      }
    ]
  }
}
```

### 2. 分配菜品到工位

**接口地址**: `POST /stations/{stationId}/assign`

**请求参数**:
```json
{
  "orderId": "ORD20240115001",
  "itemId": 1,
  "chefId": 456,
  "priority": "normal"
}
```

## 实时通信接口 (WebSocket)

### 连接地址
```
wss://api.example.com/ws
```

### 认证
```javascript
const socket = io('wss://api.example.com/ws', {
  auth: {
    token: 'jwt-token-here'
  }
});
```

### 事件订阅
```javascript
// 订阅厨房订单更新
socket.emit('subscribe', {
  room: 'kitchen-orders',
  stationId: 1  // 可选，订阅特定工位
});

// 订阅特定订单更新
socket.emit('subscribe', {
  room: 'order-updates',
  orderId: 'ORD20240115001'
});
```

### 接收消息事件

#### 新订单到达
```javascript
socket.on('order:new', (data) => {
  console.log('新订单:', data);
  /*
  {
    "orderId": "ORD20240115001",
    "orderNumber": "20240115-001",
    "tableNumber": 5,
    "items": [...],
    "priority": "urgent",
    "createdAt": "2024-01-15T10:30:00Z"
  }
  */
});
```

#### 订单状态更新
```javascript
socket.on('order:status', (data) => {
  console.log('订单状态更新:', data);
  /*
  {
    "orderId": "ORD20240115001",
    "status": "cooking",
    "updatedAt": "2024-01-15T10:35:00Z"
  }
  */
});
```

#### 菜品制作完成
```javascript
socket.on('item:completed', (data) => {
  console.log('菜品完成:', data);
  /*
  {
    "orderId": "ORD20240115001",
    "itemId": 1,
    "dishName": "宫保鸡丁",
    "completedBy": {
      "userId": 456,
      "username": "厨师甲"
    },
    "completedAt": "2024-01-15T10:45:00Z"
  }
  */
});
```

#### 系统通知
```javascript
socket.on('notification', (data) => {
  console.log('系统通知:', data);
  /*
  {
    "type": "urgent",
    "title": "紧急催单",
    "message": "5号桌客人催促宫保鸡丁",
    "orderId": "ORD20240115001",
    "timestamp": "2024-01-15T10:40:00Z"
  }
  */
});
```

## 数据统计接口

### 1. 订单统计

**接口地址**: `GET /statistics/orders`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| startDate | string | 是 | 开始日期(YYYY-MM-DD) |
| endDate | string | 是 | 结束日期(YYYY-MM-DD) |
| groupBy | string | 否 | 分组方式(hour,day,week,month) |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 150,
      "totalRevenue": 8950.00,
      "averageOrderValue": 59.67,
      "peakHour": "18:00"
    },
    "trends": [
      {
        "period": "2024-01-15",
        "orderCount": 25,
        "revenue": 1487.50
      }
    ]
  }
}
```

### 2. 菜品销售排行

**接口地址**: `GET /statistics/dishes/ranking`

**查询参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| startDate | string | 是 | 开始日期 |
| endDate | string | 是 | 结束日期 |
| limit | integer | 否 | 返回条数，默认10 |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "rankings": [
      {
        "rank": 1,
        "dishId": 1,
        "dishName": "宫保鸡丁",
        "salesCount": 45,
        "totalRevenue": 1710.00,
        "percentage": 19.1
      }
    ]
  }
}
```

## 文件上传接口

### 1. 上传菜品图片

**接口地址**: `POST /upload/dish-image`

**请求格式**: `multipart/form-data`

**表单参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | file | 是 | 图片文件 |
| dishId | integer | 是 | 菜品ID |

**响应示例**:
```json
{
  "success": true,
  "data": {
    "fileId": "IMG20240115001",
    "fileName": "kungpao-chicken.jpg",
    "fileSize": 1024000,
    "url": "https://cdn.example.com/images/kungpao-chicken.jpg",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

## 限流与配额

### API调用限制
- **普通用户**: 1000次/小时
- **付费用户**: 10000次/小时
- **管理员**: 无限制

### WebSocket连接限制
- 单个用户最多保持5个并发连接
- 连接空闲超时: 30分钟

## 版本管理

### API版本控制
```
v1: 当前稳定版本
v2: 开发中版本（预览）
```

### 向后兼容性
- 主版本号变更可能包含破坏性更新
- 次版本号变更保证向后兼容
- 修订版本号仅包含bug修复

## 更新日志

### v1.0.0 (2024-01-15)
- 初始版本发布
- 实现基础订单管理功能
- 添加WebSocket实时通信
- 完善菜品和工位管理

---
*文档维护: 技术文档团队* | *联系方式: docs@example.com*