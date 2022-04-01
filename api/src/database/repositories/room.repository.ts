import { HttpException, HttpStatus } from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { Config } from '../entities/config.entity';
import { Room, RoomType } from '../entities/room.entity';
import { UserRoom } from '../entities/user-room.entity';

class VisibleRoom {
  id: number;
  isJoin: boolean;
}

@EntityRepository(Room)
export class RoomRepository extends Repository<Room> {
  /**
   * find one room with his messages and users
   */
  _findOneWithRel(room_id: number) {
    return this.findOne(room_id, {
      relations: ['messages', 'usersRoom'],
    });
  }

  _findOneWithUsersRoom(room_id: number) {
    return this.findOne(room_id, {
      relations: ['usersRoom'],
    });
  }

  async _findOneDirect(otherUserId: number, userId: number) {
    const allRoom = await this.find({
      relations: ['usersRoom'],
    });
    const allDirect = allRoom.filter(
      (room: Room) => room.type === RoomType.DIRECT,
    );

    return allDirect.find((room) => {
      const usersRooms = room.usersRoom;
      if (!usersRooms || usersRooms.length != 2)
        throw new HttpException(
          'No user room existing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      return (
        (usersRooms[0].user.id == userId &&
          usersRooms[1].user.id == otherUserId) ||
        (usersRooms[1].user.id == userId &&
          usersRooms[0].user.id == otherUserId)
      );
    });
  }

  /**
  *  find all channels public/protected (joined or not) + private channel joined + directs room joined
  {
    id: number;
    type: RoomType;
    config: Config; // without password
    isJoin: boolean;
    nbUsers: number;
  }
  */
  async _findAllVisible(user_id: number) {
    let rooms: Room[] = await this.find({
      relations: ['usersRoom'],
    });
    let visibleRooms: VisibleRoom[] = await this.manager.query(
      strQueryVR(user_id),
    );

    return leftJoin(visibleRooms, rooms, user_id);
  }

  /**
   * find One with config.password
   */
  async _findOneWithPassword(room_id: number) {
    let room = await this.findOne(room_id);
    room.config.password = (
      await this.manager.findOne(Config, room.config.id, {
        select: ['password'],
      })
    ).password;
    return room;
  }
}

const leftJoin = (
  visibleRooms: VisibleRoom[],
  rooms: Room[],
  user_id: number,
) =>
  visibleRooms
    .map((visibleRoom) => ({
      ...rooms.find((room) => visibleRoom.id === room.id),
      ...visibleRoom,
    }))
    .map((room) => {
      room.nbUsers = room.usersRoom.length;
      if (room.usersRoom.filter((data) => data.user.id == user_id)[0]?.isJoin)
        room.isJoin = true;
      else {
        room.isJoin = false;
      }

      // delete room.usersRoom;
      return room;
    });

const strQueryVR = (user_id: number) =>
  `
      SELECT  id
              ,CASE WHEN user_id IS NULL THEN false  ELSE true END AS "isJoin"
      FROM
      (
        SELECT  room.id
              ,type
              ,scope
        FROM room
        LEFT JOIN config
        ON room.config_id = config.id
      ) AS rooms
      LEFT JOIN
      (
        SELECT  room_id
              ,user_id
        FROM user_room
        WHERE user_id = ${user_id}
      ) AS user_rooms
      ON rooms.id = user_rooms.room_id
      WHERE scope = 'PUBLIC' OR scope = 'PROTECTED' OR user_id IS NOT NULL`;
