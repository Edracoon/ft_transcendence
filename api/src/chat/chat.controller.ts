import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Config } from 'src/database/entities/config.entity';
import { Message } from 'src/database/entities/message.entity';
import { Room } from 'src/database/entities/room.entity';
import { JwtMfaGuard } from 'src/guards/jwtMfa.guard';
import { UserService } from 'src/user/user.service';
import { ChatService } from './chat.service';
import { UserGateway } from '../user/user.gateway';
import { User } from '../database/entities/user.entity';
import { NotifType } from '../dto/global';

@Controller('api/chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly userGateway: UserGateway,
  ) {}

  @Get('user/:user_id/room')
  @UseGuards(JwtMfaGuard)
  getRoomsForUser(@Param('user_id') user_id: number) {
    return this.chatService.getRoomsForUser(user_id);
  }

  @Get('room/:id')
  @UseGuards(JwtMfaGuard)
  async getRoom(@Param('id') id: number, @Req() req: Request) {
    return this.chatService.getRoom(
      id,
      await this.chatService.isAllowedJoinBanRoom(
        this.userService.getIntraFromToken(req),
        id,
      ),
    );
  }

  @Get('/room')
  @UseGuards(JwtMfaGuard)
  getRooms() {
    return this.chatService.getRoomsDB();
  }

  @Get('user/:user_id/direct')
  @UseGuards(JwtMfaGuard)
  getDirectMessageRoom(@Param('user_id') user_id: number, @Req() req: Request) {
    return this.chatService.getDirectMessageRoom(req, user_id);
  }

  @Patch('/room')
  @UseGuards(JwtMfaGuard)
  async updateConfig(@Body() config: Config) {
    let configUp = await this.chatService.updateConfig(config);
    let room_id = (await this.chatService.getRoomFromConfig(config.id)).id;
    this.userGateway.emitAll('notif_chat', room_id);
    return configUp;
  }

  @Patch('/config/password')
  @UseGuards(JwtMfaGuard)
  removePassword(@Body() config: Config) {
    return this.chatService.removePassword(config);
  }

  @Post('/room')
  @UseGuards(JwtMfaGuard)
  async createARoom(@Body() newRoom: Room, @Req() req: Request) {
    let aroom = await this.chatService.createRoomDB(newRoom);
    await this.chatService.createChatDB(
      this.userService.getIntraFromToken(req),
      aroom,
    );
    this.userGateway.emitAll('notif_chat', aroom.id);
    return aroom;
  }

  @Post('/room/invit-users')
  @UseGuards(JwtMfaGuard)
  async _saveUsersRoomSendInvitation(
    @Body('users') users: User[],
    @Body('room_id') room_id: number,
    @Req() req: Request,
  ) {
    await this.chatService.saveUsersRoomWithAction(
      users,
      room_id,
      this.userService.getIntraFromToken(req),
    );
    for (let user of users) {
      this.userGateway.emitTo(user.id, 'notif_user', '');
      this.userGateway.emitAll('notif_chat', room_id);
    }
  }

  @Post('/room/config/check-password')
  checkPasswordOnJoin(
    @Body('room_id') room_id: number,
    @Body('password') password: string,
    @Req() req: Request,
  ) {
    let ret = this.chatService.checkPasswordOnJoin(room_id, password, req);
    if (ret) this.userGateway.emitAll('notif_chat', room_id);
    return ret;
  }

  @Get('/room/:id/join')
  @UseGuards(JwtMfaGuard)
  async createJoin(@Param('id') room_id: number, @Req() req: Request) {
    await this.chatService.joinChatDB(
      this.userService.getIntraFromToken(req),
      room_id,
    );
    this.userGateway.emitAll('notif_chat', room_id);
  }

  @Get('/room/:id/leave')
  @UseGuards(JwtMfaGuard)
  async leaveJoin(@Param('id') room_id: number, @Req() req: Request) {
    if (room_id) {
      await this.chatService.leaveChatDB(
        this.userService.getIntraFromToken(req),
        room_id,
      );
      this.userGateway.emitAll('notif_chat', room_id);
    }
  }

  @Get('/room/:id/users-room')
  @UseGuards(JwtMfaGuard)
  getUsersRoom(@Param('id') room_id: number, @Req() req: Request) {
    return this.chatService.getUsersRoom(
      room_id,
      this.userService.getIntraFromToken(req),
    );
  }

  @Post('/room/toggle-admin')
  @UseGuards(JwtMfaGuard)
  async toggleAdmin(
    @Body('myUserRoom_id') myUserRoom_id: number,
    @Body('userRoom_id') userRoom_id: number,
    @Req() req: Request,
  ) {
    let userRoom = await this.chatService.toggleAdmin(
      this.userService.getIntraFromToken(req),
      myUserRoom_id,
      userRoom_id,
    );
    if (userRoom) this.userGateway.emitAll('notif_chat', userRoom.room.id);
  }

  @Post('/room/toggle-block')
  @UseGuards(JwtMfaGuard)
  async toggleBlock(
    @Body('userBlocked_id') userBlocked_id: number,
    @Req() req: Request,
  ) {
    let id = this.userService.getIntraFromToken(req);
    await this.chatService.toggleBlock(id, userBlocked_id);
    this.userGateway.emitTo(id, 'notif_user', '');
  }

  @Post('/room/mute-ban')
  @UseGuards(JwtMfaGuard)
  async updateMuteBan(
    @Body('myUserRoom_id') myUserRoom_id: number,
    @Body('userRoom_id') userRoom_id: number,
    @Body('dateTime') dateTime: Date,
    @Body('type') type: NotifType,
    @Req() req: Request,
  ) {
    let userRoom = await this.chatService.updateBanMute(
      this.userService.getIntraFromToken(req),
      myUserRoom_id,
      userRoom_id,
      dateTime,
      type,
    );
    if (userRoom) this.userGateway.emitAll('notif_chat', userRoom.room.id);
    return userRoom;
  }

  @Post('/config')
  @UseGuards(JwtMfaGuard)
  createConfig(@Body() config: Config) {
    return this.chatService.createConfigDB(config);
  }

  @Get('room/:id/message')
  @UseGuards(JwtMfaGuard)
  async getMessagesFromRoom(@Param('id') id: number, @Req() req: Request) {
    if (
      await this.chatService.isAllowedJoinBanRoom(
        this.userService.getIntraFromToken(req),
        id,
      )
    )
      return this.chatService.getMessagesFromRoom(id);
  }
}
