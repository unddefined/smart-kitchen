# Pino 日志使用指南

## 概述

项目已集成 Pino 高性能日志库，提供快速、结构化的日志记录功能。

## 安装

已自动安装以下依赖：
- `pino` - 核心日志库
- `pino-http` - HTTP 请求日志中间件
- `pino-pretty` - 开发环境的美观输出（仅开发依赖）

## 配置

### 1. 全局日志中间件

在 `main.ts` 中已配置：
- 自动记录所有 HTTP 请求
- 根据响应状态码调整日志级别（4xx -> warn, 5xx -> error）
- 自定义成功/失败消息格式

### 2. 环境变量

可通过 `.env` 文件配置日志级别：

```env
LOG_LEVEL=info  # 可选：fatal, error, warn, info, debug, trace, silent
```

## 使用方法

### 在 Service/Controller 中使用

```typescript
import { Injectable } from '@nestjs/common';
import { PinoLoggerService } from './logger/pino-logger.service';

@Injectable()
export class YourService {
  constructor(private readonly logger: PinoLoggerService) {}

  yourMethod() {
    // 基础日志
    this.logger.log('操作成功', 'YourService');
    
    // 不同级别
    this.logger.debug('调试信息', 'YourService');
    this.logger.info('信息消息', 'YourService');
    this.logger.warn('警告消息', 'YourService');
    this.logger.error('错误信息', '错误堆栈', 'YourService');
    
    // 带上下文的日志
    this.logger.log('处理用户数据', 'UserService');
  }
}
```

### 日志级别说明

- `fatal` - 致命错误，系统无法继续运行
- `error` - 错误，操作失败但系统可继续
- `warn` - 警告，潜在问题但不影响当前操作
- `info` - 信息，正常业务操作（默认级别）
- `debug` - 调试，详细的调试信息
- `trace` - 追踪，最详细的调用追踪

### 输出格式

开发环境（彩色美观输出）：
```
[2026-03-08 14:22:07.123] INFO (YourService): 操作成功
[2026-03-08 14:22:07.456] DEBUG (YourService): 调试信息
```

生产环境（JSON 格式，便于日志收集）：
```json
{"level":30,"time":1709906527123,"context":"YourService","msg":"操作成功"}
```

## HTTP 请求日志

所有 HTTP 请求会自动记录：
```
GET /api/users completed 200 15ms
POST /api/orders failed: Validation error 400 5ms
```

包含：
- 请求方法和路径
- 响应状态
- 处理时间
- 错误信息（如果失败）

## 最佳实践

1. **使用上下文**：始终传入服务/控制器名称作为 context
2. **合适的日志级别**：
   - 业务流程用 `info`
   - 调试问题用 `debug`
   - 异常情况用 `warn` 或 `error`
3. **结构化数据**：可以传递对象作为额外上下文
   ```typescript
   this.logger.info({ userId: 123, action: 'create' }, '创建用户');
   ```
4. **避免敏感信息**：不要记录密码、token 等敏感数据
5. **性能考虑**：生产环境建议使用 JSON 格式（移除 pino-pretty）

## 生产环境配置

修改 `main.ts` 中的日志配置：

```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  // 生产环境移除 transport 配置，使用 JSON 格式
});
```

## 查看日志

### 开发环境
启动服务器后直接在终端查看彩色日志。

### 生产环境
使用 jq 格式化查看：
```bash
journalctl -u your-service | jq
```

或导入日志分析工具（ELK、Splunk 等）。
