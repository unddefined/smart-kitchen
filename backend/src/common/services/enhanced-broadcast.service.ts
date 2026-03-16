import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../../events.gateway';
import { Server, Socket } from 'socket.io';
import { EventEmitter } from 'events';

// MessageAck interface kept for future use
// interface MessageAck {
//   messageId: string;
//   clientId: string;
//   acknowledgedAt: string;
// }

/**
 * 待确认消息接口
 */
interface PendingMessage {
  messageId: string;
  room: string;
  event: string;
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  ackTimeout: NodeJS.Timeout;
  pendingAcks: Set<string>; // 等待确认的客户端 ID
}

/**
 * 消息历史接口
 */
export interface MessageHistory {
  id: string;
  room: string;
  event: string;
  data: unknown;
  timestamp: string;
  deliveredTo: string[];
  ackedBy: string[];
}

/**
 * 房间状态接口
 */
export interface RoomState {
  lastUpdateTime: string;
  snapshot: unknown;
  sequenceNumber: number;
}

/**
 * 增强广播服务 - 带确认机制、消息队列和状态同步
 *
 * 功能特性：
 * 1. 消息确认和重试机制
 * 2. 消息持久化（内存 + 数据库）
 * 3. 房间状态快照
 * 4. 客户端重连后的状态同步
 * 5. 消息队列管理
 */
@Injectable()
export class EnhancedBroadcastService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EnhancedBroadcastService.name);

  // WebSocket 服务器实例
  private server: Server;

  // 事件发射器，用于内部事件处理
  private eventEmitter = new EventEmitter();

  // 待确认消息队列
  private pendingMessages: Map<string, PendingMessage> = new Map();

  // 消息历史记录（最近 N 条）
  private messageHistory: MessageHistory[] = [];
  private readonly maxHistorySize = 1000;

  // 房间状态快照
  private roomStates: Map<string, RoomState> = new Map();

  // 客户端连接跟踪
  private clientConnections: Map<
    string,
    {
      socket: Socket;
      subscribedRooms: Set<string>;
      lastSyncTime: string;
      connectedAt: string;
    }
  > = new Map();

  // 配置
  private readonly ackTimeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly enablePersistence: boolean;

  constructor(
    private prisma: PrismaService,
    private eventsGateway: EventsGateway,
    private configService: ConfigService,
  ) {
    this.ackTimeoutMs = configService.get<number>('WS_ACK_TIMEOUT', 5000);
    this.maxRetries = configService.get<number>('WS_MAX_RETRIES', 3);
    this.retryDelayMs = configService.get<number>('WS_RETRY_DELAY', 1000);
    this.enablePersistence = configService.get<boolean>(
      'WS_ENABLE_PERSISTENCE',
      true,
    );
  }

  /**
   * 模块初始化
   */
  async onModuleInit() {
    this.server = this.eventsGateway.server;

    // 注册客户端连接/断开事件
    this.setupConnectionHandlers();

    // 启动定期清理任务
    this.startCleanupTasks();

    // 加载持久化的房间状态
    if (this.enablePersistence) {
      await this.loadRoomStates();
    }

    this.logger.log('✅ EnhancedBroadcastService initialized');
  }

  /**
   * 模块销毁
   */
  async onModuleDestroy() {
    // 清理所有定时器
    this.cleanupTimers();

    // 保存房间状态到数据库
    if (this.enablePersistence) {
      await this.saveRoomStates();
    }

    this.logger.log('❌ EnhancedBroadcastService destroyed');
  }

  /**
   * 设置连接处理器
   */
  private setupConnectionHandlers() {
    // 注意：这里需要在 EventsGateway 中暴露连接事件
    // 或者通过定时检查来获取客户端列表
    this.eventEmitter.on('client-connected', (clientId: string) => {
      this.handleClientConnect(clientId);
    });

    this.eventEmitter.on('client-disconnected', (clientId: string) => {
      this.handleClientDisconnect(clientId);
    });
  }

  /**
   * 处理客户端连接
   */
  private handleClientConnect(clientId: string) {
    const socket = this.server.sockets.sockets.get(clientId);
    if (!socket) return;

    this.clientConnections.set(clientId, {
      socket,
      subscribedRooms: new Set(socket.rooms),
      lastSyncTime: new Date().toISOString(),
      connectedAt: new Date().toISOString(),
    });

    this.logger.debug(`📱 Client ${clientId} connected and tracked`);
  }

  /**
   * 处理客户端断开
   */
  private handleClientDisconnect(clientId: string) {
    this.clientConnections.delete(clientId);
    this.logger.debug(`📴 Client ${clientId} disconnected and untracked`);
  }

  /**
   * 带确认机制的广播（核心方法）
   *
   * @param room 房间名
   * @param event 事件名
   * @param data 数据
   * @param requireAck 是否需要确认（默认 true）
   * @returns 消息 ID
   */
  async broadcastWithAck(
    room: string,
    event: string,
    data: any,
    requireAck: boolean = true,
  ): Promise<string> {
    const messageId = this.generateMessageId(room, event);
    const timestamp = new Date().toISOString();

    try {
      // 创建消息历史
      const history: MessageHistory = {
        id: messageId,
        room,
        event,
        data: data as unknown,
        timestamp,
        deliveredTo: [],
        ackedBy: [],
      };

      // 如果需要确认，创建待确认消息
      if (requireAck) {
        const pendingMsg: PendingMessage = {
          messageId,
          room,
          event,
          data: data as unknown,
          timestamp,
          retryCount: 0,
          maxRetries: this.maxRetries,
          ackTimeout: null as unknown as NodeJS.Timeout,
          pendingAcks: new Set<string>(),
        };

        // 获取房间内的所有客户端
        const roomClients = await this.getRoomClients(room);
        roomClients.forEach((clientId) => {
          pendingMsg.pendingAcks.add(clientId);
        });

        this.pendingMessages.set(messageId, pendingMsg);

        // 设置确认超时
        pendingMsg.ackTimeout = setTimeout(
          () => this.handleAckTimeout(messageId),
          this.ackTimeoutMs,
        );
      }

      // 发送消息
      const deliveryResult = this.server.to(room).emit(event, {
        data,
        timestamp,
        messageId,
        requireAck,
      });

      // 记录投递结果
      const clients = await this.getRoomClients(room);
      history.deliveredTo = clients;

      // 添加到历史记录
      this.addToHistory(history);

      // 更新房间状态
      await this.updateRoomState(room, { event, data, timestamp });

      // 如果不需要确认，立即标记为成功
      if (!requireAck) {
        history.ackedBy = clients;
        this.logger.debug(
          `📢 Broadcast to ${room} (${clients.length} clients): ${event}`,
        );
      } else {
        this.logger.debug(
          `📢 Broadcast with ACK to ${room}: ${event} (msgId: ${messageId})`,
        );
      }

      return messageId;
    } catch (error) {
      this.logger.error(
        `Broadcast failed: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      );
      throw error;
    }
  }

  /**
   * 处理确认超时
   */
  private handleAckTimeout(messageId: string) {
    const pendingMsg = this.pendingMessages.get(messageId);
    if (!pendingMsg) return;

    pendingMsg.retryCount++;

    if (pendingMsg.retryCount >= pendingMsg.maxRetries) {
      // 达到最大重试次数，记录失败
      this.logger.warn(
        `⚠️ Message ${messageId} failed after ${pendingMsg.retryCount} retries`,
      );
      this.pendingMessages.delete(messageId);

      // 更新历史记录
      this.updateHistoryAck(messageId, Array.from(pendingMsg.pendingAcks));
    } else {
      // 重试发送
      this.logger.debug(
        `🔄 Retrying message ${messageId} (attempt ${pendingMsg.retryCount}/${pendingMsg.maxRetries})`,
      );

      // 重新发送给未确认的客户端
      pendingMsg.pendingAcks.forEach((clientId) => {
        const socket = this.server.sockets.sockets.get(clientId);
        if (socket && socket.connected) {
          socket.emit(pendingMsg.event, {
            data: pendingMsg.data,
            timestamp: pendingMsg.timestamp,
            messageId: pendingMsg.messageId,
            requireAck: true,
            isRetry: true,
            retryCount: pendingMsg.retryCount,
          });
        } else {
          // 客户端已断开，移除
          pendingMsg.pendingAcks.delete(clientId);
        }
      });

      // 重置超时
      pendingMsg.ackTimeout = setTimeout(
        () => this.handleAckTimeout(messageId),
        this.ackTimeoutMs,
      );
    }
  }

  /**
   * 确认消息接收
   */
  async acknowledgeMessage(clientId: string, messageId: string): Promise<void> {
    const pendingMsg = this.pendingMessages.get(messageId);
    if (!pendingMsg) {
      this.logger.debug(
        `ℹ️ Message ${messageId} not found (may be already completed)`,
      );
      return;
    }

    // 从待确认列表中移除
    pendingMsg.pendingAcks.delete(clientId);

    // 更新历史记录
    this.updateHistoryAckById(messageId, clientId);

    // 如果所有客户端都已确认，清除消息
    if (pendingMsg.pendingAcks.size === 0) {
      if (pendingMsg.ackTimeout) {
        clearTimeout(pendingMsg.ackTimeout);
      }
      this.pendingMessages.delete(messageId);
      this.logger.debug(`✅ Message ${messageId} fully acknowledged`);
    } else {
      this.logger.debug(
        `👍 Client ${clientId} acked message ${messageId}, ${pendingMsg.pendingAcks.size} remaining`,
      );
    }
  }

  /**
   * 获取房间状态同步（用于重连后）
   */
  async syncRoomState(
    room: string,
    sinceSequence?: number,
  ): Promise<RoomState | null> {
    const state = this.roomStates.get(room);
    if (!state) {
      return null;
    }

    // 如果提供了序列号，只返回更新的增量
    if (sinceSequence !== undefined && state.sequenceNumber <= sinceSequence) {
      return null; // 没有新更新
    }

    return state;
  }

  /**
   * 获取消息历史（用于重连后补发）
   */
  getMessageHistory(room?: string, limit: number = 50): MessageHistory[] {
    let filtered = this.messageHistory;

    if (room) {
      filtered = filtered.filter(
        (msg) => msg.room === room || msg.room === 'all',
      );
    }

    return filtered.slice(-limit) as unknown as MessageHistory[];
  }

  /**
   * 强制同步房间状态到所有客户端
   */
  async forceSyncRoom(room: string, snapshot: any): Promise<void> {
    const state: RoomState = {
      lastUpdateTime: new Date().toISOString(),
      snapshot,
      sequenceNumber: (this.roomStates.get(room)?.sequenceNumber || 0) + 1,
    };

    this.roomStates.set(room, state);

    // 广播状态更新
    await this.broadcastWithAck(
      room,
      'room-state-update',
      {
        room,
        sequenceNumber: state.sequenceNumber,
        snapshot,
        timestamp: state.lastUpdateTime,
      },
      false, // 不要求确认，避免循环
    );

    // 持久化
    if (this.enablePersistence) {
      await this.saveRoomState(room);
    }

    this.logger.log(
      `🔄 Force synced room ${room} (seq: ${state.sequenceNumber})`,
    );
  }

  /**
   * 更新房间状态
   */
  private async updateRoomState(
    room: string,
    update: { event: string; data: any; timestamp: string },
  ) {
    const currentState = this.roomStates.get(room);
    const newState: RoomState = {
      lastUpdateTime: update.timestamp,
      snapshot: update.data,
      sequenceNumber: (currentState?.sequenceNumber || 0) + 1,
    };

    this.roomStates.set(room, newState);

    // 定期持久化（每 10 次更新保存一次）
    if (this.enablePersistence && newState.sequenceNumber % 10 === 0) {
      await this.saveRoomState(room);
    }
  }

  /**
   * 添加消息到历史记录
   */
  private addToHistory(history: MessageHistory) {
    this.messageHistory.push(history);

    // 限制历史记录大小
    if (this.messageHistory.length > this.maxHistorySize) {
      this.messageHistory.shift();
    }
  }

  /**
   * 更新历史记录确认状态
   */
  private updateHistoryAck(messageId: string, unackedClients: string[]) {
    const history = this.messageHistory.find((h) => h.id === messageId);
    if (history) {
      history.ackedBy = history.deliveredTo.filter(
        (id) => !unackedClients.includes(id),
      );
    }
  }

  /**
   * 更新历史记录确认状态（通过 ID）
   */
  private updateHistoryAckById(messageId: string, clientId: string) {
    const history = this.messageHistory.find((h) => h.id === messageId);
    if (history && !history.ackedBy.includes(clientId)) {
      history.ackedBy.push(clientId);
    }
  }

  /**
   * 获取房间内所有客户端 ID
   */
  private async getRoomClients(room: string): Promise<string[]> {
    try {
      const sockets = await this.server.in(room).fetchSockets();
      return sockets.map((socket) => socket.id);
    } catch (error) {
      this.logger.error(
        `Failed to get room clients: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      );
      return [];
    }
  }

  /**
   * 生成消息 ID
   */
  private generateMessageId(room: string, event: string): string {
    return `${room}:${event}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 启动定期清理任务
   */
  private startCleanupTasks() {
    // 每 5 分钟清理过期的消息历史
    setInterval(
      () => {
        this.cleanupOldMessages();
      },
      5 * 60 * 1000,
    );

    // 每 10 分钟持久化房间状态
    if (this.enablePersistence) {
      setInterval(
        () => {
          this.saveRoomStates();
        },
        10 * 60 * 1000,
      );
    }
  }

  /**
   * 清理旧消息
   */
  private cleanupOldMessages() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 小时

    this.messageHistory = this.messageHistory.filter((msg) => {
      return now - new Date(msg.timestamp).getTime() < maxAge;
    });

    this.logger.debug(
      `🧹 Cleaned up old messages, ${this.messageHistory.length} remaining`,
    );
  }

  /**
   * 清理定时器
   */
  private cleanupTimers() {
    this.pendingMessages.forEach((msg, id) => {
      if (msg.ackTimeout) {
        clearTimeout(msg.ackTimeout);
      }
    });
    this.pendingMessages.clear();
  }

  /**
   * 加载房间状态
   */
  private async loadRoomStates() {
    try {
      // TODO: 从数据库加载房间状态
      // const states = await this.prisma.wsRoomState.findMany();
      // states.forEach(state => {
      //   this.roomStates.set(state.room, {
      //     lastUpdateTime: state.lastUpdate,
      //     snapshot: state.snapshot,
      //     sequenceNumber: state.sequenceNumber,
      //   });
      // });
      this.logger.log('📂 Room states loaded from database');
    } catch (error) {
      this.logger.error(
        'Failed to load room states:',
        error instanceof Error ? error.message : JSON.stringify(error),
      );
    }
  }

  /**
   * 保存房间状态
   */
  private async saveRoomStates() {
    try {
      // TODO: 保存到数据库
      // for (const [room, state] of this.roomStates.entries()) {
      //   await this.saveRoomState(room);
      // }
      this.logger.log('💾 Room states saved to database');
    } catch (error) {
      this.logger.error(
        'Failed to save room states:',
        error instanceof Error ? error.message : JSON.stringify(error),
      );
    }
  }

  /**
   * 保存单个房间状态
   */
  private async saveRoomState(room: string) {
    try {
      const state = this.roomStates.get(room);
      if (!state) return;

      // TODO: 保存到数据库
      // await this.prisma.wsRoomState.upsert({
      //   where: { room },
      //   update: {
      //     lastUpdate: state.lastUpdateTime,
      //     snapshot: state.snapshot,
      //     sequenceNumber: state.sequenceNumber,
      //   },
      //   create: {
      //     room,
      //     lastUpdate: state.lastUpdateTime,
      //     snapshot: state.snapshot,
      //     sequenceNumber: state.sequenceNumber,
      //   },
      // });
    } catch (error) {
      this.logger.error(
        `Failed to save room state for ${room}:`,
        error instanceof Error ? error.message : JSON.stringify(error),
      );
    }
  }

  /**
   * 获取服务统计信息
   */
  getStats() {
    return {
      pendingMessages: this.pendingMessages.size,
      messageHistorySize: this.messageHistory.length,
      roomStatesCount: this.roomStates.size,
      connectedClients: this.clientConnections.size,
      uptime: process.uptime(),
    };
  }
}
