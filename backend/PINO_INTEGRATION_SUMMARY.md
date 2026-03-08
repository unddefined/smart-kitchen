# Pino 日志集成总结

## ✅ 已完成的工作

### 1. 安装依赖
- ✅ `pino` (v10.3.1) - 核心日志库
- ✅ `pino-http` (v11.0.0) - HTTP 请求日志中间件
- ✅ `pino-pretty` (v13.1.3) - 开发环境美观输出（devDependencies）

### 2. 创建的文件

#### 核心模块
- ✅ `src/logger/pino-logger.service.ts` - 可注入的日志服务
- ✅ `src/logger/logger.module.ts` - 全局日志模块
- ✅ `src/logger/index.ts` - 模块导出文件

#### 文档和测试
- ✅ `PINO_LOGGER_GUIDE.md` - 详细使用指南
- ✅ `test-logger.ts` - 日志功能测试脚本

### 3. 修改的文件

#### 配置更新
- ✅ `src/main.ts` - 配置全局 pino logger 和 HTTP 中间件
- ✅ `src/app.module.ts` - 导入 LoggerModule
- ✅ `src/app.service.ts` - 添加日志使用示例
- ✅ `src/dishes/dishes.service.ts` - 替换为 PinoLoggerService
- ✅ `package.json` - 添加 test:logger 脚本

## 📋 功能特性

### 1. 全局 HTTP 请求日志
所有 HTTP 请求自动记录：
- 请求方法和路径
- 响应状态码
- 处理时间
- 错误信息

### 2. 多级日志支持
- `trace` - 最详细的调试信息
- `debug` - 调试信息
- `info` - 一般业务信息（默认级别）
- `warn` - 警告信息
- `error` - 错误信息
- `fatal` - 致命错误

### 3. 上下文支持
每个日志可以带 context 参数，标识来源服务/组件。

### 4. 结构化数据
支持记录对象数据，便于日志分析。

### 5. 开发/生产环境区分
- **开发环境**: 彩色美观输出，带时间戳
- **生产环境**: JSON 格式，便于日志收集系统解析

## 🚀 使用方法

### 在 Service/Controller 中使用

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '../logger/pino-logger.service';

@Injectable()
export class YourService {
  constructor(private readonly logger: PinoLoggerService) {}

  yourMethod() {
    // 记录信息
    this.logger.log('操作成功', 'YourService');
    
    // 不同级别
    this.logger.debug('调试详情', 'YourService');
    this.logger.warn('潜在问题', 'YourService');
    this.logger.error('发生错误', '错误堆栈', 'YourService');
    
    // 带结构化数据
    this.logger.info(
      { userId: 123, action: 'create' },
      '用户创建操作'
    );
  }
}
```

### 环境变量配置

在 `.env` 文件中配置：

```env
LOG_LEVEL=info  # 可选：fatal, error, warn, info, debug, trace, silent
```

## 🧪 测试

运行测试脚本验证日志功能：

```bash
npm run test:logger
```

## 📊 日志输出示例

### 开发环境
```
[2026-03-08 14:25:53.216 +0800] INFO (DishesService): 获取所有菜品
[2026-03-08 14:25:53.394 +0800] DEBUG (UserService): 查找用户 ID: 123
```

### HTTP 请求日志
```
GET /api/dishes completed 200 15ms
POST /api/orders failed: Validation error 400 5ms
```

### 生产环境（JSON）
```json
{"level":30,"time":1709906527123,"context":"DishesService","msg":"获取所有菜品"}
```

## 🎯 最佳实践

1. **始终使用 context**：标识日志来源
   ```typescript
   this.logger.log('消息', 'ServiceName');
   ```

2. **选择合适的日志级别**：
   - 业务流程 → `info`
   - 调试排查 → `debug`
   - 异常情况 → `warn` 或 `error`

3. **结构化数据**：传递对象作为额外上下文
   ```typescript
   this.logger.info({ orderId: 123, status: 'pending' }, '订单状态变更');
   ```

4. **避免敏感信息**：不记录密码、token 等

5. **性能优化**：生产环境移除 `pino-pretty`，使用 JSON 格式

## 🔄 迁移指南

### 从 NestJS 默认 Logger 迁移

**之前:**
```typescript
private readonly logger = new Logger(MyService.name);
this.logger.log('消息');
```

**现在:**
```typescript
constructor(private readonly logger: PinoLoggerService) {}
this.logger.log('消息', 'MyService');
```

## 📝 下一步建议

1. **逐步迁移其他 Service**：
   - [ ] orders.service.ts
   - [ ] users.service.ts
   - [ ] kitchen.service.ts
   - [ ] serving.service.ts
   - [ ] order-items.service.ts

2. **生产环境优化**：
   - 修改 `main.ts` 移除 `pino-pretty` 配置
   - 配置日志文件输出
   - 集成日志管理系统（ELK、CloudWatch 等）

3. **增强功能**：
   - 添加日志采样（减少高频日志）
   - 集成异常追踪（Request ID）
   - 添加性能指标日志

## 🔗 相关资源

- [Pino 官方文档](https://getpino.io/)
- [pino-http 文档](https://github.com/pinojs/pino-http)
- [项目使用指南](./PINO_LOGGER_GUIDE.md)
