import { Logger } from '@nestjs/common';
import {
  Connection,
  EntitySubscriberInterface,
  EventSubscriber,
  getManager,
  RemoveEvent,
} from 'typeorm';
import { Game } from '../entities/game.entity';
import { AppManager } from '../app.manager';
import { InsertEvent, Entity } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';

@EventSubscriber()
export class GameSubscriber implements EntitySubscriberInterface<Game> {
  constructor(connection: Connection) {
    connection.subscribers.push(this);
  }

  listenTo() {
    return Game;
  }

  async afterInsert(event: InsertEvent<Game>) {
    Logger.log('after insert game');
    await AppManager.updateLadder(event.manager, [
      event.entity.loser.id,
      event.entity.winner.id,
    ]);
    await AppManager.UpdateAchievement(event.manager, event.entity);
  }

  async afterRemove(event: RemoveEvent<Game>) {
    Logger.log('after remove game');
    await AppManager.updateLadder(event.manager, [
      event.entity.loser.id,
      event.entity.winner.id,
    ]);
  }
}
