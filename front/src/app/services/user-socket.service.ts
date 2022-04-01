import { Injectable, Pipe } from '@angular/core';
import { UserModule } from '../user/user.module';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class UserSocketService extends SocketService {
  constructor() {
    super('/user');
    console.log('# Start UserSocketService');
  }
}
