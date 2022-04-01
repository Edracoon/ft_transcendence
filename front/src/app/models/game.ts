import { User } from './user';

export enum GameCategory {
  DUEL = 'DUEL',
  RANKED = 'RANKED',
}

export interface Game {
  id: number;
  date: Date;
  score_winner: number;
  score_loser: number;
  loser?: User;
  winner?: User;
  category: GameCategory;
  opponent?: User;
  win?: boolean;
}
