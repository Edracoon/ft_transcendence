import { User } from './user';

export interface Ladder {
  id: number;
  position: number;
  points: number;
  victories: number;
  defeats: number;
  score_victories: number;
  score_defeats: number;
  user?: User;
}
