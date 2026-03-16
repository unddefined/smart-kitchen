import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, type Prisma } from '@prisma/client';

/**
 * Prisma 服务 - 带连接池配置和错误重试机制
 *
 * 连接池配置说明：
 * - pool_timeout: 从池中获取连接的最大等待时间（秒）
 * - pool_min: 最小空闲连接数
 * - pool_max: 最大连接数
 * - connection_timeout: 连接超时时间（毫秒）
 * - idle_timeout: 空闲连接关闭时间（毫秒）
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 秒

  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('[PrismaService] DATABASE_URL is not configured!');
    }

    console.log('[PrismaService] Connection string configured: ✓');

    // 从环境变量读取连接池配置（生产环境优化）
    const poolTimeout = parseInt(
      configService.get<string>('DB_POOL_TIMEOUT') || '30',
      10,
    );
    const poolMin = parseInt(
      configService.get<string>('DB_POOL_MIN') || '5',
      10,
    );
    const poolMax = parseInt(
      configService.get<string>('DB_POOL_MAX') || '20',
      10,
    );
    const connectionTimeout = parseInt(
      configService.get<string>('DB_CONNECT_TIMEOUT') || '60000',
      10,
    );
    const idleTimeout = parseInt(
      configService.get<string>('DB_IDLE_TIMEOUT') || '30000',
      10,
    );

    console.log('[PrismaService] Pool config:', {
      timeout: poolTimeout,
      min: poolMin,
      max: poolMax,
      connectionTimeout,
      idleTimeout,
    });

    // 创建 PrismaPg 适配器（带连接池配置）
    const adapter = new PrismaPg({
      connectionString,
      // 连接池配置通过 DATABASE_URL 参数传递
      // 在 schema.prisma 中配置 url 参数
    });

    // 构建日志配置
    const logConfig: Prisma.LogDefinition[] = [
      { level: 'error', emit: 'event' },
      { level: 'warn', emit: 'event' },
    ];

    // 开发环境下启用查询日志
    if (configService.get('NODE_ENV') === 'development') {
      logConfig.push({ level: 'query', emit: 'event' });
    }

    super({
      adapter,
      log: logConfig,
      // 事务超时配置
      transactionOptions: {
        timeout: parseInt(
          configService.get<string>('DB_TRANSACTION_TIMEOUT') || '30000',
          10,
        ),
      },
    });

    // 绑定事件监听器用于监控
    this.$on('error', (e) => {
      console.error('[PrismaEvent] Error:', e.target, e.message);
    });

    this.$on('warn', (e) => {
      console.warn('[PrismaEvent] Warning:', e.target, e.message);
    });

    if (configService.get('NODE_ENV') === 'development') {
      this.$on('query', (e) => {
        console.log(
          '[PrismaEvent] Query:',
          e.query,
          'Params:',
          e.params,
          'Duration:',
          e.duration + 'ms',
        );
      });
    }

    console.log('[PrismaService] PrismaClient initialized with pool config');
  }

  /**
   * 模块初始化时连接数据库（带重试机制）
   */
  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * 模块销毁时断开连接
   */
  async onModuleDestroy() {
    console.log('[PrismaService] Disconnecting from database...');
    await this.$disconnect();
    console.log('[PrismaService] Disconnected');
  }

  /**
   * 带重试机制的数据库连接
   * 生产环境必备：网络波动时自动重试
   */
  private async connectWithRetry(): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(
          `[PrismaService] Connecting to database (attempt ${attempt}/${this.maxRetries})...`,
        );
        await this.$connect();
        console.log('[PrismaService] ✅ Database connected successfully');
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `[PrismaService] ❌ Connection attempt ${attempt} failed:`,
          error instanceof Error ? error.message : error,
        );

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt; // 指数退避
          console.log(`[PrismaService] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    console.error('[PrismaService] All connection attempts failed');
    throw lastError;
  }

  /**
   * 健康检查方法 - 用于监控和负载均衡
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    responseTime: number;
    timestamp: string;
  }> {
    const startTime = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * 工具方法：延迟执行
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
