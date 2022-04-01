import { User } from './user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { faker } from '@faker-js/faker';
import { getManager } from 'typeorm';

export enum GameCategory {
  DUAL = 'DUAL',
  RANKED = 'RANKED',
  SOLO = 'SOLO',
}

@Entity()
export class Game {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    default: 0,
  })
  score_winner: number;

  @Column({
    default: 0,
  })
  score_loser: number;

  @Column({
    type: 'enum',
    enum: GameCategory,
  })
  category: string;

  @CreateDateColumn()
  date: Date;

  @ManyToOne(() => User, (user) => user.victories, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: false,
  })
  @JoinColumn({
    name: 'winner_id',
  })
  winner: User;

  @ManyToOne(() => User, (user) => user.defeats, {
    eager: true,
    onDelete: 'SET NULL',
    nullable: false,
  })
  @JoinColumn({
    name: 'loser_id',
  })
  loser: User;

  constructor(
    category: GameCategory,
    score_winner: number,
    score_loser: number,
    winner: User,
    loser: User,
    id?: number,
    date?: Date,
  ) {
    this.category = category;
    this.score_winner = score_winner;
    this.score_loser = score_loser;
    this.winner = winner;
    this.loser = loser;
    this.id = id;
    this.date = date;
  }

  static async faker(
    category: GameCategory = Object.values(GameCategory)[
      +faker.datatype.boolean()
    ],
    score_winner: number = faker.datatype.number({ min: 7, max: 15 }),
    score_loser: number = faker.datatype.number({ min: 0, max: 6 }),
    winner?: User,
    loser?: User,
  ) {
    let users;
    if (!winner || !loser) users = await getManager().find(User);
    if (!winner) {
      winner = users[faker.datatype.number({ min: 0, max: users.length - 1 })];
    }
    if (!loser) {
      let usersL = users.filter((info) => info != winner);
      loser = usersL[faker.datatype.number({ min: 0, max: usersL.length - 1 })];
    }
    return new Game(category, score_winner, score_loser, winner, loser);
  }
}
