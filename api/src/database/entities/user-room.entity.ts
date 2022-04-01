import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';

export enum RoomRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

@Entity()
export class UserRoom {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.userRooms, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user: User;

  @ManyToOne(() => Room, (room) => room.usersRoom, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'room_id',
  })
  room: Room;

  @Column({
    type: 'enum',
    enum: RoomRole,
  })
  role: RoomRole;

  @Column({
    default: () => 'now()',
  })
  ban: Date;

  @Column({
    default: () => 'now()',
  })
  mute: Date;

  @Column({
    type: 'bool',
    default: true,
  })
  isJoin: Boolean;

  constructor(
    user: User,
    room: Room,
    role: RoomRole,
    isJoin?: Boolean,
    ban?: Date,
    mute?: Date,
  ) {
    this.user = user;
    this.room = room;
    this.role = role;
    this.ban = ban;
    this.mute = mute;
    this.isJoin = isJoin;
  }
}
