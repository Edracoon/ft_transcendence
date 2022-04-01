import { Setting } from 'src/database/entities/setting.entity';
import { User } from 'src/database/entities/user.entity';

export class MessageSentDto {
  text: string;
  user: User;
  date: Date;
}
