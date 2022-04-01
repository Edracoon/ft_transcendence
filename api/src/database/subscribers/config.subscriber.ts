import { Logger } from '@nestjs/common';
import {
  Connection,
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
} from 'typeorm';
import { Config, RoomScope } from '../entities/config.entity';
import { InsertEvent } from 'typeorm';
import * as bcrypt from 'bcrypt';

const ROUND = 10;

@EventSubscriber()
export class ConfigSubscriber implements EntitySubscriberInterface<Config> {
  constructor(connection: Connection) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return Config;
  }

  async beforeUpdate(event: UpdateEvent<Config>) {
    Logger.log('before update Config');
    if (event.entity.scope == RoomScope.PROTECTED && event.entity.password)
      event.entity.password = await bcrypt.hash(event.entity.password, ROUND);
    else event.entity.password = '';
  }
}
