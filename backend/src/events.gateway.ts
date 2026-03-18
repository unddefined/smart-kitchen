import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EnhancedBroadcastService } from './common/services/enhanced-broadcast.service';
import { EventEmitter } from 'events';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*', // 生产环境配置具体域名
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
  // 使用默认的 /socket.io/ 路径
})
export class EventsGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleInit,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');
  private connectionCount = 0;
  private eventEmitter = new EventEmitter();

  // 注入 EnhancedBroadcastService（可选）
  private enhancedBroadcastService?: EnhancedBroadcastService;

  /**
   * 设置增强广播服务（在 AppModule 或 EventsModule 中初始化）
   */
  setEnhancedBroadcastService(service: EnhancedBroadcastService) {
    this.enhancedBroadcastService = service;
  }

  onModuleInit() {
    this.logger.log('[EventsGateway] Module initialized');
  }

  onModuleDestroy() {
    this.eventEmitter.removeAllListeners();
    this.logger.log('[EventsGateway] Module destroyed');
  }

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.logger.log('WebSocket server ready to accept connections');

    // 定期输出连接状态
    setInterval(() => {
      const clientCount = this.server.engine?.clientsCount || 0;
      this.logger.debug(`当前 WebSocket 连接数：${clientCount}`);
    }, 60000); // 每分钟输出一次
  }

  async handleConnection(client: Socket) {
    this.connectionCount++;
    this.logger.log(
      `✅ Client connected: ${client.id} (Total: ${this.connectionCount})`,
    );

    // 发送欢迎消息
    client.emit('welcome', {
      message: 'WebSocket 连接成功',
      clientId: client.id,
      timestamp: new Date().toISOString(),
    });

    // 通知 EnhancedBroadcastService
    this.eventEmitter.emit('client-connected', client.id);

    // 如果有增强广播服务，触发客户端连接处理
    if (this.enhancedBroadcastService) {
      try {
        // 通过反射或直接调用处理连接
        const method = (
          this.enhancedBroadcastService as unknown as Record<string, unknown>
        ).handleClientConnect;
        if (typeof method === 'function') {
          await (method as (id: string) => Promise<void>).call(
            this.enhancedBroadcastService,
            client.id,
          );
        }
      } catch (error) {
        this.logger.error('Error notifying EnhancedBroadcastService:', error);
      }
    }
  }

  async handleDisconnect(client: Socket) {
    this.connectionCount--;
    this.logger.log(
      `❌ Client disconnected: ${client.id} (Remaining: ${this.connectionCount})`,
    );

    // 通知 EnhancedBroadcastService
    this.eventEmitter.emit('client-disconnected', client.id);

    // 如果有增强广播服务，触发客户端断开处理
    if (this.enhancedBroadcastService) {
      try {
        const method = (
          this.enhancedBroadcastService as unknown as Record<string, unknown>
        ).handleClientDisconnect;
        if (typeof method === 'function') {
          await (method as (id: string) => Promise<void>).call(
            this.enhancedBroadcastService,
            client.id,
          );
        }
      } catch (error) {
        this.logger.error('Error notifying EnhancedBroadcastService:', error);
      }
    }
  }

  // 客户端订阅房间
  @SubscribeMessage('subscribe')
  handleSubscribe(
    client: Socket,
    payload: { room: string; stationId?: number },
  ) {
    const roomName = payload.stationId
      ? `${payload.room}-${payload.stationId}`
      : payload.room;

    client.join(roomName);
    this.logger.log(`📡 Client ${client.id} subscribed to room: ${roomName}`);

    return { event: 'subscribed', data: { room: roomName } };
  }

  // 取消订阅
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { room: string }) {
    client.leave(payload.room);
    this.logger.log(
      `📡 Client ${client.id} unsubscribed from room: ${payload.room}`,
    );

    return { event: 'unsubscribed', data: { room: payload.room } };
  }

  // 广播消息到指定房间
  @SubscribeMessage('broadcast')
  handleBroadcast(
    client: Socket,
    payload: { room: string; event: string; data: any },
  ) {
    this.server.to(payload.room).emit(payload.event, payload.data);
    this.logger.log(`📢 Broadcasted ${payload.event} to room: ${payload.room}`);
  }

  // 测试连接
  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    const latency = Date.now();
    this.logger.debug(`🏓 Ping from ${client.id}`);
    return {
      event: 'pong',
      data: {
        timestamp: new Date().toISOString(),
        latency,
        clientId: client.id,
      },
    };
  }

  // 获取连接信息
  @SubscribeMessage('get-connection-info')
  handleGetConnectionInfo(client: Socket) {
    const rooms = Array.from(client.rooms);
    return {
      event: 'connection-info',
      data: {
        clientId: client.id,
        connected: client.connected,
        rooms: rooms.filter((r) => r !== client.id), // 排除默认房间
        timestamp: new Date().toISOString(),
      },
    };
  }

  // 消息确认处理
  @SubscribeMessage('message-ack')
  async handleMessageAck(client: Socket, payload: { messageId: string }) {
    if (this.enhancedBroadcastService) {
      try {
        await this.enhancedBroadcastService.acknowledgeMessage(
          client.id,
          payload.messageId,
        );
        return { success: true, messageId: payload.messageId };
      } catch (error) {
        this.logger.error(
          `Failed to ack message ${payload.messageId}:`,
          error instanceof Error ? error.message : error,
        );
        return { success: false, error: 'Acknowledgment failed' };
      }
    } else {
      // 降级处理：如果没有增强广播服务，直接返回成功
      this.logger.debug(
        `Received ACK for message ${payload.messageId} (no enhanced service)`,
      );
      return {
        success: true,
        messageId: payload.messageId,
        note: 'No enhanced broadcast service',
      };
    }
  }

  // 请求房间状态同步（用于重连后）
  @SubscribeMessage('sync-room-state')
  async handleSyncRoomState(
    client: Socket,
    payload: { room: string; sinceSequence?: number },
  ) {
    if (this.enhancedBroadcastService) {
      try {
        const state = await this.enhancedBroadcastService.syncRoomState(
          payload.room,
          payload.sinceSequence,
        );

        if (state) {
          client.emit('room-state-sync', {
            room: payload.room,
            state,
          });
          return { success: true, synced: true };
        } else {
          return {
            success: true,
            synced: false,
            reason: 'No updates since provided sequence',
          };
        }
      } catch (error) {
        this.logger.error(
          `Failed to sync room ${payload.room}:`,
          error instanceof Error ? error.message : error,
        );
        return { success: false, error: 'Sync failed' };
      }
    } else {
      return {
        success: false,
        error: 'Enhanced broadcast service not available',
      };
    }
  }

  // 请求消息历史（用于重连后补发）
  @SubscribeMessage('get-message-history')
  handleGetMessageHistory(
    client: Socket,
    payload: { room?: string; limit?: number },
  ) {
    if (this.enhancedBroadcastService) {
      try {
        const history = this.enhancedBroadcastService.getMessageHistory(
          payload.room,
          payload.limit || 50,
        );

        return {
          success: true,
          history,
          count: history.length,
        };
      } catch (error) {
        this.logger.error(
          `Failed to get message history:`,
          error instanceof Error ? error.message : error,
        );
        return { success: false, error: 'Failed to retrieve history' };
      }
    } else {
      return {
        success: false,
        error: 'Enhanced broadcast service not available',
      };
    }
  }
}
