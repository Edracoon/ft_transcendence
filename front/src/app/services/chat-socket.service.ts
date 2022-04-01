import { Injectable } from '@angular/core';
import { ChatModule } from '../chat/chat.module';
import { MessageSentDto } from '../models/message.dto';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class ChatSocketService extends SocketService {
  constructor() {
    super('/chat');
    console.log('# Start ChatSocketService');
  }

  sendMessage(msg: MessageSentDto) {
    this.socket.emit('message', msg);
  }
}
