# 错误处理使用指南

## 概述

本项目实现了完善的前后端错误处理机制，包括：

- **后端全局异常过滤器**：统一捕获和处理所有未处理的异常
- **前端 API 错误拦截**：友好的错误提示和日志记录

---

## 后端错误处理

### 1. 全局异常过滤器

位置：`backend/src/common/filters/http-exception.filter.ts`

#### 功能特点

- 自动捕获所有未处理的异常
- 区分 HTTP 异常和服务器内部错误
- 返回统一的错误响应格式
- 记录详细错误日志（生产环境不暴露敏感信息）

#### 统一的错误响应格式

```json
{
  "success": false,
  "error": {
    "type": "HTTP_ERROR",
    "message": "具体的错误信息",
    "statusCode": 400,
    "timestamp": "2026-03-16T12:00:00.000Z",
    "path": "/api/orders/123",
    "method": "POST"
  }
}
```

#### 错误类型说明

| 错误类型 | 说明 | HTTP 状态码 |
|---------|------|------------|
| `HTTP_ERROR` | HTTP 请求错误 | 4xx/5xx |
| `INTERNAL_ERROR` | 服务器内部错误 | 500 |
| `PRISMA_ERROR` | 数据库操作失败 | 500 |
| `RECORD_NOT_FOUND` | 记录不存在 | 404 |
| `UNIQUE_CONSTRAINT` | 数据重复 | 409 |
| `VALIDATION_ERROR` | 数据验证失败 | 400 |
| `BUSINESS_ERROR` | 业务逻辑错误 | 400 |
| `PERMISSION_DENIED` | 权限不足 | 403 |

#### 使用示例

```typescript
// Controller 中抛出异常
@Get(':id')
findOne(@Param('id', ParseIntPipe) id: number) {
  return this.ordersService.findOne(id);
}

// Service 中处理异常
async findOne(id: number) {
  const order = await this.prisma.order.findUnique({
    where: { id },
  });
  
  if (!order) {
    throw new HttpException(
      { message: '订单不存在', error: 'RECORD_NOT_FOUND' },
      HttpStatus.NOT_FOUND,
    );
  }
  
  return order;
}
```

---

## 前端错误处理

### 1. 错误处理工具函数

位置：`frontend/src/utils/error-handler.js`

#### 核心函数

##### `handleResponseError(response)`

处理 API 响应错误，解析后端返回的错误信息。

```javascript
const response = await fetch('/api/orders');
if (!response.ok) {
  throw await handleResponseError(response);
}
```

##### `handleNetworkError(error)`

处理网络错误（如连接失败、超时等）。

```javascript
try {
  const data = await fetch('/api/orders');
} catch (error) {
  const formattedError = handleNetworkError(error);
  throw formattedError;
}
```

##### `showError(error, customHandler)`

显示用户友好的错误提示。

```javascript
// 默认控制台输出
showError(error);

// 自定义处理（集成 UI 组件库）
showError(error, (message) => {
  ElMessage.error(message); // Element Plus
  // notification.error({ message, description: error.userMessage }); // Ant Design
});
```

##### `logError(error, context)`

记录错误日志用于调试。

```javascript
logError(error, 'Order creation failed');
```

##### `getRecoverySuggestion(errorType)`

获取错误恢复建议。

```javascript
const suggestion = getRecoverySuggestion('NETWORK_ERROR');
// "请检查网络连接和服务器地址配置"
```

### 2. 集成的 API 服务

位置：`frontend/src/services/api.js`

#### 自动错误处理流程

```javascript
async function request(url, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${url}`, config);
    
    if (!response.ok) {
      throw await handleResponseError(response);
    }
    
    return data;
  } catch (error) {
    const formattedError = error?.statusCode ? error : handleNetworkError(error);
    logError(formattedError, `API Request: ${options.method} ${url}`);
    showError(formattedError);
    throw formattedError;
  }
}
```

#### 使用示例

```javascript
// 创建订单 - 自动错误处理
try {
  const order = await api.orders.create(orderData);
} catch (error) {
  // 已自动显示错误提示并记录日志
  console.error('订单创建失败:', error.userMessage);
  console.error('错误类型:', error.type);
  console.error('状态码:', error.statusCode);
}

// 获取订单列表
try {
  const orders = await api.orders.list();
} catch (error) {
  // 网络错误时显示友好提示
  if (error.type === 'NETWORK_ERROR') {
    alert('无法连接到服务器，请检查后端服务是否正常运行');
  }
}
```

---

## 最佳实践

### 后端

1. **使用 HttpException 抛出具体的业务错误**
   ```typescript
   throw new HttpException(
     { message: '库存不足', error: 'BUSINESS_ERROR' },
     HttpStatus.BAD_REQUEST,
   );
   ```

2. **在 Service 层处理 Prisma 异常**
   ```typescript
   try {
     return await this.prisma.order.create({ data });
   } catch (error) {
     if (error.code === 'P2002') {
       throw new HttpException(
         { message: '订单号已存在', error: 'UNIQUE_CONSTRAINT' },
         HttpStatus.CONFLICT,
       );
     }
     throw error;
   }
   ```

3. **使用参数验证管道**
   ```typescript
   @Post()
   create(@Body(new ValidationPipe()) createOrderDto: CreateOrderDto) {
     return this.ordersService.create(createOrderDto);
   }
   ```

### 前端

1. **捕获并处理特定错误类型**
   ```javascript
   try {
     await api.orders.create(data);
   } catch (error) {
     switch (error.type) {
       case 'NETWORK_ERROR':
         // 显示网络错误提示
         break;
       case 'VALIDATION_ERROR':
         // 显示表单验证错误
         break;
       default:
         showError(error);
     }
   }
   ```

2. **集成 UI 组件库的通知系统**
   ```javascript
   // 在 main.js 中设置全局错误处理器
   app.config.errorHandler = (vm, err) => {
     logError(err, 'Vue Component Error');
     ElMessage.error(err.userMessage || '发生未知错误');
   };
   ```

3. **批量操作时的错误处理**
   ```javascript
   const results = await Promise.allSettled([
     api.orders.create(order1),
     api.orders.create(order2),
   ]);
   
   results.forEach((result, index) => {
     if (result.status === 'rejected') {
       console.error(`订单${index + 1}创建失败:`, result.reason.userMessage);
     }
   });
   ```

---

## 错误监控（未来扩展）

### 集成 Sentry

```javascript
// frontend/src/utils/error-handler.js
import * as Sentry from '@sentry/vue';

export function logError(error, context = '') {
  // ...现有代码
  
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      tags: { context, errorType: error.type },
      extra: { timestamp: new Date().toISOString() },
    });
  }
}
```

### 后端日志收集

```typescript
// backend/src/main.ts
app.useLogger(app.get(Logger));

// 在过滤器中使用 logger
this.logger.error(
  `Unhandled exception: ${request.method} ${request.url}`,
  exception instanceof Error ? exception.stack : exception,
);
```

---

## 常见问题排查

### 1. 网络错误

**现象**: `NETWORK_ERROR: 无法连接到服务器`

**排查步骤**:
1. 检查后端服务是否运行 (`http://8.145.34.30:3001`)
2. 检查防火墙设置
3. 检查 CORS 配置

### 2. 数据库错误

**现象**: `PRISMA_ERROR: 数据库操作失败`

**排查步骤**:
1. 检查数据库连接字符串
2. 查看 Prisma 迁移状态
3. 检查数据库表结构

### 3. 验证错误

**现象**: `VALIDATION_ERROR: 数据验证失败`

**排查步骤**:
1. 检查请求体格式是否正确
2. 确认必填字段是否完整
3. 验证数据类型是否符合要求

---

## 相关文件

- 后端过滤器：`backend/src/common/filters/http-exception.filter.ts`
- 前端错误处理：`frontend/src/utils/error-handler.js`
- 前端 API 服务：`frontend/src/services/api.js`
- 后端入口：`backend/src/main.ts`
