import {
  Entity,
  Column,
  JoinTable,
  ManyToMany,
  OneToOne,
  JoinColumn,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Achievement } from './achievement.entity';
import { Game } from './game.entity';
import { Setting } from 'src/database/entities/setting.entity';
import { Ladder } from 'src/database/entities/ladder.entity';
import { faker } from '@faker-js/faker';
import { Action } from './action.entity';
import { UserRoom } from './user-room.entity';
import { Message } from './message.entity';

export enum UserStatus {
  ON = 'ON',
  OFF = 'OFF',
  GAME = 'GAME',
  EGAME = 'EGAME',
}

@Entity()
export class User {
  @PrimaryColumn()
  id: number;

  @Column({
    unique: true,
    length: 22,
  })
  nickname: string;

  @Column()
  avatar: string;

  @OneToOne(() => Setting, (setting) => setting.id, {
    cascade: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'setting_id',
  })
  setting: Setting;

  @OneToOne((type) => Ladder, (ladder) => ladder.id, {
    cascade: true,
    onDelete: 'SET NULL',
    eager: true,
  })
  @JoinColumn({
    name: 'ladder_id',
  })
  ladder: Ladder;

  @ManyToMany(() => Achievement)
  @JoinTable({
    name: 'user_achievement',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'achievement_id',
      referencedColumnName: 'id',
    },
  })
  achievements?: Achievement[];

  @ManyToMany(() => User, {})
  @JoinTable({
    name: 'friend',
    joinColumn: {
      name: 'user1_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user2_id',
      referencedColumnName: 'id',
    },
  })
  friends: User[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'blacklist',
    joinColumn: {
      name: 'user1_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'user2_id',
      referencedColumnName: 'id',
    },
  })
  blacklist: User[];

  @OneToMany(() => Game, (game) => game.winner)
  victories: Game[];

  @OneToMany(() => Game, (game) => game.loser)
  defeats: Game[];

  @OneToMany(() => Action, (action) => action.sender)
  actions_sent: Action[];

  @OneToMany(() => Action, (action) => action.recipient)
  actions_received: Action[];

  // just in case
  @OneToMany(() => UserRoom, (userRoom) => userRoom.user)
  userRooms: UserRoom[];

  // just in case
  @OneToMany(() => Message, (message) => message.user)
  messages: Message[];

  constructor(
    id: number,
    nickname?: string,
    avatar?: string,
    achievement?: Achievement[],
    setting: Setting = new Setting(id),
    ladder: Ladder = new Ladder(id),
  ) {
    this.id = id;
    this.nickname = nickname;
    this.avatar = avatar;
    this.setting = setting;
    this.ladder = ladder;
    this.achievements = achievement;
  }

  static faker(
    id: number = faker.datatype.number({ min: 70000, max: 90000 }),
    nickname: string = faker.internet.userName(),
    avatar: string = faker.internet.avatar(),
  ) {
    return new User(id, nickname, avatar);
  }
}
