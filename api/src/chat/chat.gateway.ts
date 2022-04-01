import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { mergeScan } from 'rxjs';
import { Socket, Server } from 'socket.io';
import { Message } from 'src/database/entities/message.entity';
import { User } from 'src/database/entities/user.entity';
import { MessageSentDto } from 'src/dto/chat.dto';
import { JwtMfaGuard } from 'src/guards/jwtMfa.guard';
import { UserService } from 'src/user/user.service';
import { ChatService } from './chat.service';

@WebSocketGateway(3002, {
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
  ) {}
  @WebSocketServer()
  server: Socket;
  private logger: Logger = new Logger('ChatGateway');

  afterInit(server: Server) {
    this.logger.log('Init chat');
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ): void {
    this.chatService
      .isAllowedJoinMuteBanRoom(data.user, data.room)
      .then((bool) => {
        //console.log('Data USER On message : ', data.user);
        //console.log('Bool : ', bool);
        if (bool && data?.room && this.isUserLegit(client, data.room)) {
          this.userService.getUserFromId(data.user).subscribe((user) => {
            let msg: Message = new Message(data.message, user, data.room);
            this.chatService.createMessageDB(msg).then((retMsg) => {
              Logger.log('Message Sent');
              if (retMsg && retMsg instanceof Message && retMsg.text.length) {
                let message: MessageSentDto = {
                  text: retMsg.text,
                  user: retMsg.user,
                  date: retMsg.date,
                };
                this.server
                  .to(data.room)
                  .emit('message - ' + data.room, message);
              }
            });
          });
        }
      });
  }

  isUserLegit(client: Socket, room: string): Boolean {
    return client.rooms.has(room);
  }

  getIdFromSocket(client: Socket) {
    return this.userService.getTokenInfos(
      client.handshake.headers.authorization.split(' ')[1],
    )?.id;
  }

  @SubscribeMessage('join')
  asynchandleJoin(
    @MessageBody() room: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.chatService
      .isAllowedJoinBanRoom(this.getIdFromSocket(client), +room)
      .then((bool) => {
        if (bool && room) {
          client.join(room);
          Logger.log('Joined', 'JOINED');
        }
      });
  }

  @UseGuards(JwtMfaGuard)
  async handleConnection(@ConnectedSocket() client: Socket) {
    client.join(this.getIdFromSocket(client));
    this.logger.log(`Client connected on chat: ${client.id}`);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected on chat: ${client.id}`);
  }
}
