import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum ActionCategory {
  ADD_FRIEND = 'ADD_FRIEND',
  JOIN_CHANNEL = 'JOIN_CHANNEL',
  START_DM = 'START_DM',
  LAUNCH_DUEL = 'LAUNCH_DUEL',
}

@Entity()
export class Action {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ActionCategory,
  })
  category: string;

  @CreateDateColumn()
  date: Date;

  @ManyToOne(() => User, (user) => user.actions_sent, {
    eager: true,
  })
  @JoinColumn({
    name: 'sender_id',
  })
  sender: User;

  @ManyToOne(() => User, (user) => user.actions_received, {
    eager: true,
  })
  @JoinColumn({
    name: 'recipient_id',
  })
  recipient: User;

  @Column({ type: 'simple-json', default: {} })
  metadata?: object;

  @Column({ default: false })
  seen: boolean;

  constructor(
    category?: ActionCategory,
    sender?: User,
    recipient?: User,
    metadata?: any,
  ) {
    this.category = category;
    this.sender = sender;
    this.recipient = recipient;
    this.metadata = metadata;
  }
}
