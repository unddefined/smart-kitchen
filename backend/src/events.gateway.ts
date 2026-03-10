import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*', // 生产环境配置具体域名
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  },
  namespace: 'ws',
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');
  private connectionCount = 0;

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    this.logger.log('WebSocket server ready to accept connections');

    // 定期输出连接状态
    setInterval(() => {
      const clientCount = this.server.engine?.clientsCount || 0;
      this.logger.debug(`当前 WebSocket 连接数：${clientCount}`);
    }, 60000); // 每分钟输出一次
  }

  handleConnection(client: Socket) {
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
  }

  handleDisconnect(client: Socket) {
    this.connectionCount--;
    this.logger.log(
      `❌ Client disconnected: ${client.id} (Remaining: ${this.connectionCount})`,
    );
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
}
