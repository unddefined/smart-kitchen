# Pino 日志 - 快速开始

## 🎉 已完成集成

Pino 高性能日志库已成功集成到项目中！

## 📦 安装的依赖

```json
{
  "pino": "^10.3.1",
  "pino-http": "^11.0.0",
  "pino-pretty": "^13.1.3" (dev)
}
```

## 🚀 立即使用

### 1. 在 Service/Controller 中注入并使用

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from '../logger/pino-logger.service';

@Injectable()
export class YourService {
  constructor(private readonly logger: PinoLoggerService) {}

  yourMethod() {
    // 记录日志
    this.logger.log('操作成功', 'YourService');
    this.logger.debug('调试信息', 'YourService');
    this.logger.warn('警告信息', 'YourService');
    this.logger.error('错误信息', error, 'YourService');
  }
}
```

### 2. 查看 HTTP 请求日志

启动服务器后，所有 HTTP 请求会自动记录：

```bash
npm run start:dev
```

你会看到类似输出：
```
[2026-03-08 14:25:53.216 +0800] INFO: Starting server on port: 3001
GET /api/dishes completed 200 15ms
POST /api/orders completed 201 25ms
```

### 3. 测试日志功能

运行测试脚本：
```bash
npm run test:logger
```

## 📝 日志级别

| 级别 | 用途 | 示例 |
|------|------|------|
| `trace` | 最详细调试 | API 调用细节 |
| `debug` | 调试信息 | 变量值、流程追踪 |
| `info` | 业务信息（默认） | 操作成功、用户登录 |
| `warn` | 警告 | 非预期但不影响运行 |
| `error` | 错误 | 操作失败、异常 |
| `fatal` | 致命错误 | 系统崩溃 |

## 🔧 配置

### 设置日志级别

在 `.env` 文件中添加：
```env
LOG_LEVEL=info
```

可选值：`fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent`

## 📖 完整文档

- [使用指南](./PINO_LOGGER_GUIDE.md) - 详细使用说明
- [集成总结](./PINO_INTEGRATION_SUMMARY.md) - 集成工作清单

## 💡 使用示例

### 基础用法
```typescript
// 简单日志
this.logger.log('用户已登录', 'AuthService');

// 带结构化数据
this.logger.info(
  { userId: 123, role: 'admin' },
  '用户权限变更'
);

// 错误日志
try {
  await someOperation();
} catch (error) {
  this.logger.error('操作失败', error, 'MyService');
}
```

### Controller 中使用
```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly logger: PinoLoggerService) {}

  @Get()
  async findAll() {
    this.logger.log('获取所有用户', 'UsersController');
    return this.usersService.findAll();
  }
}
```

## ✅ 验证清单

- [x] 依赖已安装
- [x] LoggerModule 已创建并全局注册
- [x] PinoLoggerService 可注入使用
- [x] HTTP 请求日志自动记录
- [x] 测试脚本可用
- [x] 文档已完善

## 🎯 下一步

1. **在其他 Service 中使用**：
   - orders.service.ts
   - users.service.ts
   - kitchen.service.ts
   - serving.service.ts

2. **生产环境配置**：
   - 移除 `pino-pretty` 配置
   - 配置日志文件输出
   - 集成日志管理系统

3. **增强功能**：
   - 添加 Request ID 追踪
   - 日志采样（减少高频日志）
   - 性能指标记录

## 🆘 常见问题

### Q: 如何关闭某些日志？
A: 提高 `LOG_LEVEL`，例如设置为 `warn` 只会显示警告和错误。

### Q: 生产环境如何配置？
A: 移除 `main.ts` 中的 `transport` 配置，使用 JSON 格式输出。

### Q: 如何查看特定服务的日志？
A: 每个日志都有 `context` 字段，可以通过 grep 过滤：
```bash
npm run start:dev | grep "DishesService"
```
