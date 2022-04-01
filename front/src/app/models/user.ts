import { Achievement } from './achievement';
import { Action } from './action';
import { Game } from './game';
import { Ladder } from './ladder';
import { Setting } from './setting';

export enum UserStatus {
  ON = 'ON',
  OFF = 'OFF',
  GAME = 'GAME',
  EGAME = 'EGAME',
}

// pulic + private informations
export interface User {
  id: number;
  nickname: string;
  avatar: string;
  setting?: Setting;
  ladder?: Ladder;
  achievements?: Achievement[];
  victories?: Game[];
  defeats?: Game[];
  friends?: User[];
  blacklist?: User[];
  history?: Game[];
  actions_sent?: Action[];
  actions_received?: Action[];
}

export interface UserTest {
  id: number;
  nickname?: string;
  avatar?: string;
  setting?: Setting;
  ladder?: Ladder;
  achievements?: Achievement[];
  victories?: Game[];
  defeats?: Game[];
  friends?: User[];
  blacklist?: User[];
  history?: Game[];
  actions_sent?: Action[];
  actions_received?: Action[];
}
