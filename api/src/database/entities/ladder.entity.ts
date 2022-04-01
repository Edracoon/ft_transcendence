import { User } from './user.entity';
import {
  Column,
  Entity,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity()
export class Ladder {
  @PrimaryColumn()
  id: number;

  @OneToOne(() => User, (user) => user.ladder)
  user: User;

  @Column({
    default: 0,
  })
  defeats: number;

  @Column({
    default: 0,
  })
  score_defeats: number;

  @Column({
    default: 0,
  })
  victories: number;

  @Column({
    default: 0,
  })
  score_victories: number;

  @Column({
    default: 0,
  })
  points: number;

  @Column({
    default: 0,
  })
  position: number;

  constructor(id: number) {
    this.id = id;
  }
}
