import faker from '@faker-js/faker';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Room } from './room.entity';
import { User } from './user.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
    nullable: false,
  })
  text: string;

  @CreateDateColumn()
  date: Date;

  @ManyToOne(() => User, (user) => user.messages, {
    eager: true,
  })
  @JoinColumn({
    name: 'user_id',
  })
  user: User;

  @ManyToOne(() => Room, (room) => room.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'room_id',
  })
  room: Room;

  constructor(text: string, user: User, room: Room) {
    this.text = text;
    this.user = user;
    this.room = room;
  }

  static faker(user: User, room: Room) {
    return new Message(
      faker.lorem.sentences(faker.datatype.number({ min: 1, max: 3 })),
      user,
      room,
    );
  }
}
