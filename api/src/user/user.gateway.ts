import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Socket, Server } from 'socket.io';
import { JwtMfaGuard } from '../guards/jwtMfa.guard';
import { UserService } from './user.service';
import { UserStore } from './user.store';
import { identity } from 'rxjs';
import { UserStatus } from '../database/entities/user.entity';

@WebSocketGateway(3002, {
  namespace: '/user',
  cors: {
    origin: '*',
  },
})
export class UserGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  userStore: UserStore;
  constructor(private readonly userService: UserService) {
    this.userStore = new UserStore();
  }

  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('UserGateway');

  @SubscribeMessage('get_status')
  handleGetStatus(
    @MessageBody() idUser: number,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client get status : ${client.id}`);
    this.server
      .to(client.id)
      .emit('status_' + idUser, this.userStore.getStatus(idUser));
  }

  @SubscribeMessage('set_status')
  handleSetStatus(
    @MessageBody() status: UserStatus,
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Client set status: ${client.id}`);
    let id = this.getIdFromSocket(client);
    console.log('id now ', id);
    if (status == UserStatus.GAME || status == UserStatus.EGAME)
      client.broadcast.emit('watch_notif', '');
    status = status == UserStatus.EGAME ? UserStatus.ON : status;
    this.userStore.setStatus(id, status);
    client.broadcast.emit('status_' + id, this.userStore.getStatus(id));
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    let id = this.getIdFromSocket(client);
    this.userStore.delSocket(id, client.id);
    client.broadcast.emit('status_' + id, this.userStore.getStatus(id));
  }

  getIdFromSocket(client: Socket) {
    return this.userService.getTokenInfos(
      client.handshake.headers.authorization.split(' ')[1],
    )?.id;
  }

  @UseGuards(JwtMfaGuard)
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    let id = this.getIdFromSocket(client);
    console.log('id now ', id);
    this.userStore.addSocket(id, client.id);
    client.broadcast.emit('status_' + id, this.userStore.getStatus(id));
  }

  emitAll(event: string, data: any) {
    this.userStore.userSockets.forEach((userSockets) => {
      userSockets.idSockets.forEach((idSocket) => {
        this.server.to(idSocket).emit(event, data);
      });
    });
  }

  emitTo(id: number, event: string, data: any) {
    this.userStore.getUser(id)?.idSockets.forEach((idSocket) => {
      this.server.to(idSocket).emit(event, data);
    });
  }
}
