import { Injectable, Logger } from '@nestjs/common';
import { AppManager } from './database/app.manager';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomRepository } from './database/repositories/room.repository';
import * as bcrypt from 'bcrypt';
import { getManager } from 'typeorm';
import { Ladder } from './database/entities/ladder.entity';
import { Achievement } from './database/entities/achievement.entity';
import { GameService } from './game/game.service';
import { GameCategory } from './database/entities/game.entity';
import { UserGateway } from './user/user.gateway';
import { GameRepository } from './database/repositories/game.repository';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(RoomRepository) private roomRepository: RoomRepository,
    @InjectRepository(GameRepository) private gameRepository: GameRepository,
    private userGateway: UserGateway,
  ) {
    AppManager.ladderUpdated.subscribe((gamers) => {
      this.userGateway.emitAll('notif_ladder', gamers);
    });
  }

  async getTest() {
    return {
      allVisibleRoom: await this.roomRepository._findAllVisible(79269),
      //roomWithMsgsUsers: await this.roomRepository._findOneWithRel(318),
      //roomWithPassword: await this.roomRepository._findOneWithPassword(318),
    };
  }

  async getAchievement(id: number) {
    const achievement = await getManager().findOne(Achievement, id);

    return achievement;
  }

  async getAll() {
    return AppManager.getAllDB();
  }

  async populate() {
    await AppManager.populateDB();
    return this.getAll();
  }
  async truncate() {
    await AppManager.truncateDB();
    return this.getAll();
  }

  initDB() {
    AppManager.initAchievement();
  }
}
