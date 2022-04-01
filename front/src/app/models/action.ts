import { User } from './user';

export enum ActionCategory {
  ADD_FRIEND = 'ADD_FRIEND',
  JOIN_CHANNEL = 'JOIN_CHANNEL',
  START_DM = 'START_DM',
  LAUNCH_DUEL = 'LAUNCH_DUEL',
}

export interface Action {
  id: number;
  category: ActionCategory;
  date: Date;
  sender: User;
  recipient: User;
  metadata: any;
  seen: boolean;
}
