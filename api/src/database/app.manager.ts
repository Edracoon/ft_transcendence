import { Logger } from '@nestjs/common';
import { EntityManager, getConnection, getManager } from 'typeorm';
import { Ladder } from './entities/ladder.entity';
import { LadderView } from './entities/ladderView.entity';
import { User } from './entities/user.entity';
import { faker } from '@faker-js/faker';
import { Game } from './entities/game.entity';
import { Achievement, listAchiev } from './entities/achievement.entity';
import { Room, RoomType } from './entities/room.entity';
import { UserRoom, RoomRole } from './entities/user-room.entity';
import { Message } from './entities/message.entity';
import { Action } from './entities/action.entity';
import { Subject } from 'rxjs';

export class AppManager {
  static ladderUpdated = new Subject<number[]>();

  /** update table ladder */

  static async updateLadder(manager: EntityManager, gamers: number[] = []) {
    Logger.log('update ladder');
    await manager.query('COMMIT');
    let ladders = await manager.find(LadderView);
    await manager.save(Ladder, ladders);
    await manager.query('COMMIT');
    this.ladderUpdated.next(gamers);
  }

  static async UpdateAchievement(manager: EntityManager, game: Game) {
    let winner = await manager.findOne(User, game.winner.id, {
      relations: ['setting', 'achievements', 'ladder', 'victories', 'friends'],
    });
    if (winner) {
      for (const achiev of listAchiev) {
        if (achiev.fct(game, winner))
          await manager.query(
            'INSERT INTO "user_achievement"("user_id", "achievement_id") VALUES (' +
              winner.id +
              ', ' +
              achiev.id +
              ') ON CONFLICT DO NOTHING',
          );
      }
    }
  }

  static async initAchievement() {
    let achievements: Achievement[] = await getManager().find(Achievement);
    if (!achievements.length) {
      listAchiev.forEach((a) =>
        achievements.push(
          new Achievement(a.id, a.title, a.image, a.description, a.condition),
        ),
      );
      await getManager().save(achievements);
    }
  }

  /**
   * truncate data fron database */
  static async truncateDB() {
    Logger.log('truncate DB');
    let manager = getManager();

    await manager.remove(await manager.find(Action));
    await manager.remove(await manager.find(Achievement));
    await manager.remove(await manager.find(Game));
    await manager.remove(await manager.find(Room));
    await manager.remove(await manager.find(User));
  }

  static async getAllDB() {
    let manager = getManager();
    let tables = await manager.query(
      `SELECT table_name  
      FROM information_schema.tables 
      WHERE "table_catalog" = 'infinity' AND "table_schema" = 'public'`,
    );
    let results: Map<string, any> = new Map();
    for (const table of tables) {
      if (table.table_name != 'typeorm_metadata') {
        let nbRow = (
          await manager.query('SELECT COUNT(*) FROM "' + table.table_name + '"')
        )[0].count;
        results.set(
          table.table_name + ' - ' + nbRow + ' rows',
          await manager.query('SELECT * FROM "' + table.table_name + '"'),
        );
      }
    }
    return Object.fromEntries(results);
  }

  /**
   * Populate database with fake data */
  static async populateDB() {
    Logger.log('populate DB');
    let manager = getManager();

    // create achievements
    this.initAchievement();

    // team infinity Info
    let usersInfo = [
      { id: 79269, nickname: 'mlokate' },
      { id: 79270, nickname: 'etakouer' },
      { id: 79323, nickname: 'kmacquet' },
      { id: 79262, nickname: 'fgomez' },
      { id: 79275, nickname: 'epfennig' },
      { id: 79294, nickname: 'aclerac' },
    ];

    // create users with friends and achievements

    let users: User[] = [];
    for (const info of usersInfo)
      users.push(
        User.faker(info.id, info.nickname + ' ' + faker.word.adjective(10)),
      );

    await manager.save(users);

    let friendsInfo = [...usersInfo];
    while (friendsInfo.length) {
      let user1_id =
        friendsInfo[
          faker.datatype.number({
            min: 0,
            max: friendsInfo.length - 1,
          })
        ].id;
      friendsInfo = friendsInfo.filter((user) => user.id != user1_id);
      let user2_id =
        friendsInfo[
          faker.datatype.number({
            min: 0,
            max: friendsInfo.length - 1,
          })
        ].id;
      friendsInfo = friendsInfo.filter((user) => user.id != user2_id);
      if (user1_id && user2_id) {
        users.find((user) => user.id == user1_id).friends = [
          new User(user2_id),
        ];
        users.find((user) => user.id == user2_id).friends = [
          new User(user1_id),
        ];
      }
    }

    await manager.save(users);

    // create games if not exist
    let nbGame = await manager.count(Game);
    nbGame = nbGame > 10 ? 0 : faker.datatype.number({ min: 10, max: 15 });
    let games: Game[] = [];
    for (let i = 0; i < nbGame; i++) {
      games.push(await Game.faker());
    }
    await manager.save(games);

    // create rooms (CHANNEL + DIRECT)
    let nbRoom = await manager.count(Room);
    nbRoom = nbRoom > 10 ? 0 : faker.datatype.number({ min: 10, max: 15 });
    let rooms: Room[] = [];
    for (let i = 0; i < nbRoom; i++) {
      rooms.push(await Room.faker());
    }
    await manager.save(rooms);

    // join users in rooms with messages
    for (let room of rooms) {
      let usersRoomInfo = [...usersInfo];
      let usersRoom: UserRoom[] = [];
      // add owner
      if (room.type == RoomType.CHANNEL) {
        let user_owner_id =
          usersRoomInfo[
            faker.datatype.number({
              min: 0,
              max: usersRoomInfo.length - 1,
            })
          ].id;
        usersRoomInfo = usersRoomInfo.filter(
          (user) => user.id != user_owner_id,
        );
        usersRoom.push(
          new UserRoom(
            users.find((user) => user.id == user_owner_id),
            room,
            RoomRole.OWNER,
            true,
          ),
        );
        // add some admins
        let nbAdmin = faker.datatype.number({ min: 0, max: 2 });
        for (let i = 0; i < nbAdmin; i++) {
          let user_admin_id =
            usersRoomInfo[
              faker.datatype.number({
                min: 0,
                max: usersRoomInfo.length - 1,
              })
            ].id;
          usersRoomInfo = usersRoomInfo.filter(
            (user) => user.id != user_admin_id,
          );
          usersRoom.push(
            new UserRoom(
              users.find((user) => user.id == user_admin_id),
              room,
              RoomRole.ADMIN,
              true,
            ),
          );
        }
      }
      // add some users
      let nbOtherUser = faker.datatype.number({
        min: 2,
        max: room.type == RoomType.DIRECT ? 2 : usersRoomInfo.length,
      });
      for (let i = 0; i < nbOtherUser; i++) {
        let user_other_id =
          usersRoomInfo[
            faker.datatype.number({
              min: 0,
              max: usersRoomInfo.length - 1,
            })
          ].id;
        usersRoomInfo = usersRoomInfo.filter(
          (user) => user.id != user_other_id,
        );
        usersRoom.push(
          new UserRoom(
            users.find((user) => user.id == user_other_id),
            room,
            RoomRole.USER,
            true,
          ),
        );
      }

      let msgs = [];
      for (let userRoom of usersRoom) {
        let nbMsg = faker.datatype.number({
          min: 1,
          max: 7,
        });
        for (let i = 0; i < nbMsg; i++) {
          msgs.push(Message.faker(userRoom.user, room));
        }
      }
      room.messages = msgs;
      room.usersRoom = usersRoom;
    }
    await manager.save(rooms);
  }
}
