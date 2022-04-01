import { Setting } from 'src/database/entities/setting.entity';

export interface UserUpdateDto {
  id?: number;
  nickname: string;
  avatar: string;
  setting: Setting;
}
