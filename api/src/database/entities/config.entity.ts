import faker from '@faker-js/faker';

import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Room } from './room.entity';

export enum RoomScope {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED',
}

@Entity()
export class Config {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    length: 100,
    unique: true,
  })
  name: string;

  @Column({
    nullable: true,
  })
  topic: string;

  @Column({
    type: 'enum',
    enum: RoomScope,
  })
  scope: RoomScope;

  @Column({
    default: null,
    select: false,
  })
  password?: string;

  constructor(
    name: string,
    topic: string,
    scope: RoomScope,
    password: string = '',
  ) {
    this.name = name;
    this.topic = topic;
    this.scope = scope;
    this.password = password;
  }

  static faker(
    name: string = faker.name.title(),
    topic: string = faker.lorem.sentence(10),
    scope: RoomScope = Object.values(RoomScope)[
      faker.datatype.number({ min: 0, max: 2 })
    ],
    password?: string,
  ) {
    if (scope == RoomScope.PROTECTED) password = 'protected';
    return new Config(name, topic, scope, password);
  }
}
