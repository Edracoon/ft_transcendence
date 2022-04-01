import {
  Connection,
  EntitySubscriberInterface,
  EventSubscriber,
  RemoveEvent,
} from 'typeorm';
import { User } from '../entities/user.entity';
import { AppManager } from '../app.manager';
import { getManager, InsertEvent, Entity } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Setting } from '../entities/setting.entity';
import { Ladder } from '../entities/ladder.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  manager = getManager();
  constructor(connection: Connection) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return User;
  }

  async afterInsert(event: InsertEvent<User>) {
    Logger.log('after insert user');
    await AppManager.updateLadder(event.manager);
  }

  async beforeRemove(event: RemoveEvent<User>) {
    Logger.log('after remove user');
    let setting = await this.manager.findOne(Setting, { id: event.entityId });
    if (setting) await this.manager.remove(setting);
    let ladder = await this.manager.findOne(Ladder, { id: event.entityId });
    if (ladder) await this.manager.remove(ladder);
  }

  async afterRemove(event: RemoveEvent<User>) {
    Logger.log('after insert user');
    await AppManager.updateLadder(event.manager);
  }
}
