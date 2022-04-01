import { HttpService } from '@nestjs/axios';
import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  Param,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { catchError, config, first, firstValueFrom, map } from 'rxjs';
import { UserRoom, RoomRole } from 'src/database/entities/user-room.entity';
import { Config, RoomScope } from 'src/database/entities/config.entity';
import { Message } from 'src/database/entities/message.entity';
import { Room, RoomType } from 'src/database/entities/room.entity';
import { User } from 'src/database/entities/user.entity';
import { RoomRepository } from 'src/database/repositories/room.repository';
import { getManager } from 'typeorm';
import { UserService } from 'src/user/user.service';
import { Action, ActionCategory } from 'src/database/entities/action.entity';
import { NotifType } from '../dto/global';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
const ROUND = 10;

@Injectable()
export class ChatService {
  constructor(
    private readonly httpService: HttpService,
    private readonly userService: UserService,
    @InjectRepository(RoomRepository) private roomRepository: RoomRepository,
  ) {}

  getRoomsDB() {
    return this.roomRepository.find().catch((e) => {
      throw new HttpException(
        'Error with database: ' + e,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  }

  async isAllowedJoinMuteBanRoom(client_id: number, room_id: number) {
    let room = await this.roomRepository
      ._findOneWithUsersRoom(room_id)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (
      room &&
      room?.usersRoom?.filter((data: UserRoom) => {
        return data?.user?.id == client_id;
      })[0]?.mute < new Date() &&
      room?.usersRoom?.filter((data: UserRoom) => {
        return data?.user?.id == client_id;
      })[0]?.ban < new Date()
    )
      return true;
    return false;
  }

  async isAllowedJoinMuteRoom(client_id: number, room_id: number) {
    let room = await this.roomRepository
      ._findOneWithUsersRoom(room_id)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (
      room &&
      room?.usersRoom?.filter((data: UserRoom) => {
        return data?.user?.id == client_id;
      })[0]?.mute < new Date()
    )
      return true;
    return false;
  }

  async isAllowedJoinBanRoom(client_id: number, room_id: number) {
    let room = await this.roomRepository
      ._findOneWithUsersRoom(room_id)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (room) {
      let banDate = room?.usersRoom?.find(
        (data: UserRoom) => data?.user?.id == client_id,
      )?.ban;
      if (banDate && banDate < new Date()) return true;
    }
    return false;
  }

  async updateConfig(config: Config) {
    const newConfig = await getManager()
      .find(Config, { id: config.id })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (newConfig && newConfig[0]) {
      newConfig[0].topic = config.topic;
      newConfig[0].scope = config.scope;
      if (config.password) newConfig[0].password = config.password;
      return await getManager()
        .save(Config, newConfig)
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
    } else
      throw new HttpException(
        'Cannot update the channel',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
  }

  async removePassword(config: Config) {
    const configDbTab = await getManager()
      .find(Config, { id: config.id })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });

    if (
      !configDbTab ||
      !configDbTab[0] ||
      configDbTab[0].scope != RoomScope.PROTECTED
    )
      throw new HttpException(
        'Not a valid configuration send to server',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    const configDb: Config = configDbTab[0];
    configDb.password = '';
    configDb.scope = RoomScope.PUBLIC;
    return await getManager()
      .save(Config, configDb)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async getRoomFromConfig(config_id: number) {
    return getManager()
      .findOne(Room, {
        where: { config: { id: config_id } as Config },
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async getMessagesFromRoom(room_id: number) {
    const message = await getManager()
      .find(Message, { room: { id: room_id } })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    return message;
  }

  async getRoomId(userRoom_id: number) {
    const userRoom = await getManager()
      .findOne(UserRoom, userRoom_id)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    return userRoom.room.id;
  }

  async getDirectMessageRoom(req: Request, otherUserId: number) {
    const userId = this.userService.getIntraFromToken(req);
    const res = await this.roomRepository
      ._findOneDirect(otherUserId, userId)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    return res;
  }

  async checkPasswordOnJoin(room_id: number, password: string, req: Request) {
    password = password.trim();
    const room = await this.roomRepository
      ._findOneWithPassword(room_id)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    const config = room.config;
    const isMatch = await bcrypt.compare(password, config.password);
    console.log('Is Match : ', isMatch);
    if (isMatch)
      return this.joinChatDB(this.userService.getIntraFromToken(req), +room_id);
    return false;
  }

  async createConfigDB(config: Config) {
    return await getManager()
      .save(Config, config)
      .catch((e) => {
        if (e.code == '23505')
          throw new HttpException(
            'Chat name already exist',
            HttpStatus.NOT_ACCEPTABLE,
          );
        else
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      });
  }

  async createChatDB(user: number, room: Room) {
    let chat: UserRoom = new UserRoom(
      { id: user } as User,
      room,
      RoomRole.OWNER,
      true,
    );
    if (room?.type === RoomType.DIRECT) chat.role = RoomRole.USER;
    return await getManager()
      .save(UserRoom, chat)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async joinChatDB(user: User, room: number) {
    return await this.roomRepository
      ._findOneWithRel(room)
      .then(async (data) => {
        if (!data)
          throw new HttpException('Channel already Join', HttpStatus.CONFLICT);
        let chat: UserRoom = await getManager()
          .findOne(UserRoom, {
            where: { room: { id: room } as Room, user: user },
          })
          .catch((e) => {
            throw new HttpException(
              'Error with database: ' + e,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          });
        if (!chat) {
          chat = new UserRoom(user, { id: room } as Room, RoomRole.USER, true);
        }
        chat.isJoin = true;
        return await getManager()
          .save(UserRoom, chat)
          .catch((e) => {
            throw new HttpException(
              'Error with database: ' + e,
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          });
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async getRoom(room_id: number, allowed: boolean) {
    if (allowed)
      return await this.roomRepository._findOneWithRel(room_id).catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    else
      return await this.roomRepository
        .findOne(room_id, {
          relations: ['usersRoom'],
        })
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
  }

  async getRoomsForUser(user_id: number) {
    const rooms = await this.roomRepository
      ._findAllVisible(user_id)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    const result = [];
    for (const room of rooms) {
      if (!result.find((el) => el.id === room.id)) result.push(room);
    }
    return result;
  }

  async getUserRoom(user: number, room: number) {
    return await getManager()
      .findOne(UserRoom, {
        where: { room: room, user: user },
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async leaveChatDB(user: number, room: number) {
    let time = new Date();
    return await this.getUserRoom(user, room)
      .then(async (data) => {
        if (!data)
          throw new HttpException('Channel already leave', HttpStatus.CONFLICT);
        if (data?.ban < time && data?.mute < time)
          await getManager().remove(UserRoom, data);
        else {
          data.isJoin = false;
          await getManager().save(UserRoom, data);
        }
      })
      .then(async () => {
        await this.getRoom(room, true).then(async (data: Room) => {
          if (
            data.config.scope == RoomScope.PRIVATE &&
            (data.usersRoom.length <= 0 ||
              !data.usersRoom.find((data) => data.isJoin == true))
          )
            await getManager().remove(Room, data);
        });
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async createRoomDB(room: Room) {
    return await this.roomRepository.save(room).catch((e) => {
      throw new HttpException(
        'Error with database: ' + e,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  }

  async createMessageDB(message: Message) {
    return await getManager()
      .save(Message, message)
      .catch((e) => {
        return false;
      });
  }

  async isJoined(user_id: number, room: string) {
    let test = await this.getUserRoom(user_id, +room).catch((e) => {
      throw new HttpException(
        'Error with database: ' + e,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
    if (test) return true;
    return false;
  }

  async saveUsersRoomWithAction(
    users: User[],
    id_room: number,
    id_user: number,
  ) {
    let room = await getManager()
      .findOne(Room, { id: id_room })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    for (let user of users) {
      let userRoom = await getManager()
        .findOne(UserRoom, {
          where: { user, room },
        })
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
      if (userRoom && userRoom.isJoin) {
        users.splice(users.indexOf(user), 1);
        continue;
      }
      if (userRoom) userRoom.isJoin = true;
      else userRoom = new UserRoom(user, room, RoomRole.USER, true);
      await getManager()
        .save(userRoom)
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
      await getManager()
        .save(
          new Action(
            room.type == RoomType.CHANNEL
              ? ActionCategory.JOIN_CHANNEL
              : ActionCategory.START_DM,
            {
              id: id_user,
            } as User,
            user,
            { name: room.config?.name, id: room.id },
          ),
        )
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
    }
  }

  async getUsersRoom(room_id: number, user_id: number) {
    let myUserRoom = await getManager()
      .findOne(UserRoom, {
        where: { room: { id: room_id }, user: { id: user_id } },
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    const room = await getManager()
      .findOne(
        Room,
        { id: room_id },
        {
          relations: ['usersRoom'],
        },
      )
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    let usersRoom = room.usersRoom;
    if (myUserRoom.role == RoomRole.USER)
      usersRoom = usersRoom.filter((userRoom) => userRoom.isJoin);
    return usersRoom;
  }

  async toggleAdmin(
    user_id: number,
    myUserRoom_id: number,
    userRoom_id: number,
  ) {
    let myUserRoom = await getManager()
      .findOne(UserRoom, myUserRoom_id, {
        relations: ['user', 'room'],
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    let userRoom = await getManager()
      .findOne(UserRoom, userRoom_id, {
        relations: ['user', 'room'],
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (
      myUserRoom.user.id == user_id &&
      myUserRoom.room.id == userRoom.room.id &&
      myUserRoom.role == RoomRole.OWNER
    ) {
      userRoom.role =
        userRoom.role == RoomRole.USER ? RoomRole.ADMIN : RoomRole.USER;
      return getManager()
        .save(userRoom)
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
    }
  }

  async toggleBlock(user_id: number, userBlocked_id: number) {
    let user = await getManager()
      .findOne(User, user_id, {
        relations: ['setting', 'blacklist'],
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    let userBlocked = await getManager()
      .findOne(User, userBlocked_id, {
        relations: ['setting', 'blacklist'],
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (user.blacklist.find((user) => user.id == userBlocked_id))
      user.blacklist = user.blacklist.filter(
        (user) => user.id != userBlocked_id,
      );
    else user.blacklist.push(userBlocked);
    await getManager()
      .save(user)
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async updateBanMute(
    user_id: number,
    myUserRoom_id: number,
    userRoom_id: number,
    dateTime: Date,
    type: NotifType,
  ) {
    let myUserRoom = await getManager()
      .findOne(UserRoom, myUserRoom_id, {
        relations: ['user', 'room'],
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    let userRoom = await getManager()
      .findOne(UserRoom, userRoom_id, {
        relations: ['user', 'room'],
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (
      myUserRoom.user.id == user_id &&
      myUserRoom.room.id == userRoom.room.id &&
      myUserRoom.role != RoomRole.USER
    ) {
      if (type == NotifType.BAN || type == NotifType.UNBAN) {
        if (!userRoom.isJoin && type == NotifType.UNBAN) {
          getManager()
            .remove(userRoom)
            .catch((e) => {
              throw new HttpException(
                'Error with database: ' + e,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            });
          return userRoom;
        }
        userRoom.ban = dateTime;
      } else if (type == NotifType.MUTE || type == NotifType.UNMUTE) {
        if (!userRoom.isJoin && type == NotifType.UNMUTE) {
          getManager()
            .remove(userRoom)
            .catch((e) => {
              throw new HttpException(
                'Error with database: ' + e,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            });
          return userRoom;
        }
        userRoom.mute = dateTime;
      }
      return getManager()
        .save(userRoom)
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
    }
  }
}
