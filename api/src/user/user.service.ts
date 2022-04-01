import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, request } from 'express';
import { Observable, map, catchError, from } from 'rxjs';
import { UserUpdateDto } from '../dto/user-update.dto';
import { UserRepository } from '../database/repositories/user.repository';
import { User } from '../database/entities/user.entity';
import { Action, ActionCategory } from 'src/database/entities/action.entity';
import { getManager, Like } from 'typeorm';
import { Achievement } from 'src/database/entities/achievement.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserRepository) private userRepository: UserRepository,
  ) {}

  /** Get User informations from the token */
  getUserFromToken(req: Request) {
    const intra = this.getIntraFromToken(req);
    return this.getUserInfos(intra);
  }

  /** Request DB For the user */
  getUserInfos(id: number) {
    return from(
      this.userRepository
        .findOne({ id }, { relations: ['setting'] })
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }),
    );
  }

  getUserFromId(id: number) {
    return from(
      this.userRepository.findOne({ id }).catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }

  getUser(id: number, req?: Request) {
    if (req && id != this.getIntraFromToken(req))
      return from(this.userRepository._findOneWithRel(id));
    return from(
      this.userRepository._findOneWithAllRel(id).catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }),
    );
  }

  async getCurrentUser(req: Request) {
    return await this.userRepository
      ._findOneWithAllRel(this.getIntraFromToken(req))
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  getTokenFromHeader(req: Request): string {
    const headers = req.headers;
    if (!headers || !headers['authorization']) return '';
    return (headers['authorization'] as string).split(' ')[1];
  }

  getAvatar(req: Request) {
    const intra = this.getIntraFromToken(req);
    return this.getUserInfos(intra).pipe(
      map((user) => {
        return { avatar: user.avatar };
      }),
      catchError((e: any) => {
        if (e && e.response)
          throw new HttpException(
            e.response.data
              ? e.response.data
              : 'Cannot get the user informations',
            e.response.status
              ? e.response.status
              : HttpStatus.INTERNAL_SERVER_ERROR,
          );
        else
          throw new HttpException(
            'Cannot get the user informations',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }),
    );
  }

  getNickname(req: Request) {
    const intra = this.getIntraFromToken(req);
    return this.getUserInfos(intra).pipe(
      map((user) => {
        return { nickname: user.nickname };
      }),
      catchError((e: any) => {
        if (e && e.response)
          throw new HttpException(
            e.response.data
              ? e.response.data
              : 'Cannot get the user informations',
            e.response.status
              ? e.response.status
              : HttpStatus.INTERNAL_SERVER_ERROR,
          );
        else
          throw new HttpException(
            'Cannot get the user informations',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }),
    );
  }

  getFriends(req: Request) {
    const intra = this.getIntraFromToken(req);
    return this.getUserInfos(intra).pipe(
      map((user) => {
        return { friends: user.friends };
      }),
      catchError((e: any) => {
        if (e && e.response)
          throw new HttpException(
            e.response.data
              ? e.response.data
              : 'Cannot get the user informations',
            e.response.status
              ? e.response.status
              : HttpStatus.INTERNAL_SERVER_ERROR,
          );
        else
          throw new HttpException(
            'Cannot get the user informations',
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
      }),
    );
  }

  async createUser(newUser: User) {
    return await this.userRepository.save(newUser).catch((reason) => {
      throw new HttpException(
        'Cannot update database with the new user',
        HttpStatus.NOT_ACCEPTABLE,
      );
    });
  }

  /** Get the intra id from the token
   * - Get request to 42 API to get informations about token
   * - return just the resource_owner_id
   */
  getIntraFromToken(req: Request) {
    const token = this.getTokenFromHeader(req);
    if (!token)
      throw new HttpException('Token expired', HttpStatus.UNAUTHORIZED);
    const token_infos = this.getTokenInfos(token);
    return token_infos.id;
  }

  /** Get all the JWT informations */
  getTokenInfos(token: string) {
    let payload;
    try {
      payload = this.jwtService.verify(token);
    } catch (e) {
      try {
        payload = this.jwtService.verify(token, { ignoreExpiration: true });
      } catch (e) {
        payload = undefined;
      }
    }
    return payload;
  }

  /** Update the user on the db
   * - Patch request to update the user with his new informations
   */
  async updateUser(req: Request, id: number, new_user: UserUpdateDto) {
    let user = await this.userRepository
      .findOne(id, {
        relations: ['setting'],
      })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    user = { ...user, ...new_user };
    return await this.userRepository.save(user).catch((reason) => {
      if (reason.code == '23505')
        throw new HttpException(
          'Nickname already exist',
          HttpStatus.NOT_ACCEPTABLE,
        );
      else
        throw new HttpException(
          'Cannot update database',
          HttpStatus.NOT_ACCEPTABLE,
        );
    });
  }

  /** Generate a random avatar url from Avatars API*/
  getRandomAvatar() {
    const rand = Math.random();
    return { avatar: `https://avatars.dicebear.com/api/avataaars/${rand}.svg` };
  }

  getRefreshFromJwt(req: Request) {
    const token = (req.headers['authorization'] as string).split(' ')[1];
    const payload = this.getTokenInfos(token);
    return { refreshToken: payload.refreshToken };
  }

  async addAction(
    category: ActionCategory,
    sender_id: number,
    recipient_id: number,
    metadata: any,
  ) {
    return await getManager()
      .save(
        new Action(
          category,
          new User(sender_id),
          new User(recipient_id),
          metadata,
        ),
      )
      .catch((reason) => {
        throw new HttpException('Cannot add action', HttpStatus.NOT_ACCEPTABLE);
      });
  }

  async delAction(action: Action) {
    action = await getManager()
      .findOne(Action, { id: action.id })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    if (action)
      await getManager()
        .remove(action)
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
  }

  async checkAction(action_id: number, user_id: number) {
    let action = await getManager().findOne(Action, action_id);
    if (action.recipient.id == user_id || action.sender.id == user_id)
      return true;
    return false;
  }

  async updateAction(action: Action) {
    await getManager()
      .update(Action, { id: action.id }, action)
      .catch((reason) => {
        console.log(reason);
        throw new HttpException(reason, HttpStatus.NOT_ACCEPTABLE);
      });
  }

  async acceptAction(action: Action) {
    action = await getManager()
      .findOne(Action, { id: action.id })
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    await getManager()
      .remove(action)
      .catch((reason) => {
        throw new HttpException('Cannot del action', HttpStatus.NOT_ACCEPTABLE);
      });
    if (action.category == ActionCategory.ADD_FRIEND)
      await this.userRepository
        ._addFriend(action.sender.id, action.recipient.id)
        .catch((e) => {
          throw new HttpException(
            'Error with database: ' + e,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        });
  }

  async delFriend(user_id: number, friend_id: number) {
    await this.userRepository._delFriend(user_id, friend_id).catch((e) => {
      throw new HttpException(
        'Error with database: ' + e,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });
  }

  async searchByNickname(nickname: string) {
    nickname = `%${nickname.toLowerCase()}%`;
    return await this.userRepository
      .createQueryBuilder()
      .select('user')
      .from(User, 'user')
      .where('LOWER("user".nickname) LIKE :nickname', { nickname })
      .getMany()
      .catch((e) => {
        throw new HttpException(
          'Error with database: ' + e,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
  }

  async getAchievement(id: number) {
    const achievement = await getManager()
      .findOne(Achievement, id)
      .catch((e) => {
        throw new HttpException(
          'Cannot take achievement',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      });
    return achievement;
  }

  async getAchievements() {
    return await getManager().find(Achievement);
  }
}
