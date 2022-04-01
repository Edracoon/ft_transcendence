import { Setting } from './setting';

export interface UserUpdateDto {
  nickname: string;
  avatar: string;
  setting: Setting;
}
