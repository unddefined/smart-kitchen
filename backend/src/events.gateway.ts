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

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
    // 使用 console.log 直接输出，让 Socket.IO 自己决定显示的端口信息
    this.logger.log('WebSocket server ready to accept connections');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    console.log('Connected clients count:', this.server.engine?.clientsCount);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
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
    this.logger.log(`Client ${client.id} subscribed to room: ${roomName}`);

    return { event: 'subscribed', data: { room: roomName } };
  }

  // 取消订阅
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, payload: { room: string }) {
    client.leave(payload.room);
    this.logger.log(
      `Client ${client.id} unsubscribed from room: ${payload.room}`,
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
    this.logger.log(`Broadcasted ${payload.event} to room: ${payload.room}`);
  }

  // 测试连接
  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    this.logger.log(`Ping from ${client.id}`);
    return { event: 'pong', data: { timestamp: new Date().toISOString() } };
  }
}
