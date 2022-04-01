import {
  Connection,
  EntitySubscriberInterface,
  EventSubscriber,
  LessThan,
  RemoveEvent,
} from 'typeorm';
import { getManager, InsertEvent, Entity } from 'typeorm';
import { Logger } from '@nestjs/common';
import { Room } from '../entities/room.entity';
import { Config } from '../entities/config.entity';
import { UserRoom } from '../entities/user-room.entity';

@EventSubscriber()
export class RoomSubscriber implements EntitySubscriberInterface<Room> {
  manager = getManager();
  constructor(connection: Connection) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return Room;
  }

  async beforeRemove(event: RemoveEvent<Room>) {
    Logger.log('after remove Room');
    if (event.entity.config) await this.manager.remove(event.entity.config);
  }

  async afterLoad(entity) {
    let usersRoom = await getManager().find(UserRoom, {
      where: {
        isJoin: false,
        mute: LessThan(new Date()),
        ban: LessThan(new Date()),
      },
    });
    await getManager().remove(usersRoom);
  }
}
