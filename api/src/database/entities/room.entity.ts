import faker from '@faker-js/faker';
import {
  AfterLoad,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRoom } from './user-room.entity';
import { Config } from './config.entity';
import { Message } from './message.entity';
import { User } from './user.entity';

export enum RoomType {
  CHANNEL = 'CHANNEL',
  DIRECT = 'DIRECT',
}

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: RoomType,
  })
  type: RoomType;

  @OneToOne(() => Config, (config) => config.id, {
    cascade: true,
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'config_id',
  })
  config: Config;

  @OneToMany(() => Message, (message) => message.room, {
    cascade: true,
  })
  messages: Message[];

  @OneToMany(() => UserRoom, (UserRoom) => UserRoom.room, {
    cascade: true,
  })
  usersRoom: UserRoom[];

  // --- used in _findAllVisible
  nbUsers: number;
  isJoin: boolean;
  // ---

  constructor(type: RoomType, config: Config) {
    this.type = type;
    this.config = config;
  }

  static faker(
    type: RoomType = Object.values(RoomType)[+faker.datatype.boolean()],
    config: Config = null,
  ) {
    if (type == RoomType.CHANNEL) config = Config.faker();
    return new Room(type, config);
  }
}
