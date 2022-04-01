import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, urlencoded } from 'express';
import { Observable, map, catchError, from, of, firstValueFrom } from 'rxjs';
import { GameRepository } from 'src/database/repositories/game.repository';
import { Game, GameCategory } from 'src/database/entities/game.entity';
import { User } from 'src/database/entities/user.entity';
import { UserService } from '../user/user.service';
import { Any, getManager } from 'typeorm';
import { UserRepository } from 'src/database/repositories/user.repository';
import { Ladder } from 'src/database/entities/ladder.entity';
import {
  Achievement,
  listAchiev,
} from '../database/entities/achievement.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(GameRepository) private gameRepository: GameRepository,
    @InjectRepository(UserRepository) private userRepository: UserRepository,
    private userService: UserService,
  ) {}
  /** Request DB For the game */

  async createGame(
    status: GameCategory,
    score_winner: number,
    score_loser: number,
    winner: number,
    loser: number,
  ) {
    const game = new Game(
      status,
      score_winner,
      score_loser,
      { id: winner } as User,
      { id: loser } as User,
    );

    const game_db = await this.gameRepository.save(game).catch((e) => {
      throw new HttpException(
        'Cannot save the game',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    });

    return { id: game_db.id };
  }

  async getLadder() {
    return await this.gameRepository._findLadder();
  }
}
