import {
  EntityRepository,
  getConnection,
  getManager,
  Repository,
} from 'typeorm';
import { Game } from '../entities/game.entity';
import { Ladder } from '../entities/ladder.entity';
import { User } from '../entities/user.entity';

@EntityRepository(Game)
export class GameRepository extends Repository<Game> {
  _findOneHistory(id: number) {
    return getManager()
      .createQueryBuilder()
      .select('game')
      .from(Game, 'game')
      .where('winner_id = :id', { id })
      .orWhere('loser_id = :id', { id })
      .orderBy('date')
      .getMany();
  }

  _findLadder() {
    return getManager()
      .createQueryBuilder()
      .select('ladder')
      .from(Ladder, 'ladder')
      .leftJoinAndSelect('ladder.user', 'user')
      .orderBy('position')
      .limit(10)
      .getMany();
  }
}
