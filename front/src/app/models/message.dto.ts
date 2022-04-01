import { Setting } from './setting';

export interface MessageSentDto {
  user: number | undefined;
  message: string;
  room: number;
}

export interface MessageReceivedDto {
  user: number;
  message: string;
}
