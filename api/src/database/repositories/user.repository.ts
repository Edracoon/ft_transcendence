import {
  EntityRepository,
  getConnection,
  Repository,
  getManager,
} from 'typeorm';
import { Game } from '../entities/game.entity';
import { User } from '../entities/user.entity';

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  _relationsPrivate = [
    'setting',
    'blacklist',
    'actions_sent',
    'actions_received',
  ];
  _relationsPublic = [
    'ladder',
    'achievements',
    'friends',
    'defeats',
    'victories',
  ];
  _findWithAllRel() {
    return this.find({
      relations: [...this._relationsPublic, ...this._relationsPrivate],
    });
  }

  _findWithRel() {
    return this.find({ relations: [...this._relationsPublic] });
  }

  _findOneWithAllRel(id: number) {
    return this.findOne(id, {
      relations: [...this._relationsPublic, ...this._relationsPrivate],
    });
  }

  _findOneWithRel(id: number) {
    return this.findOne(id, { relations: [...this._relationsPublic] });
  }

  async _addFriend(user1_id: number, user2_id: number) {
    let user1 = await this._findOneWithAllRel(user1_id);
    let user2 = await this._findOneWithAllRel(user2_id);
    if (!user1.friends.find((friend) => friend.id == user2.id)) {
      user1.friends.push(user2);
      user2.friends.push(user1);
      await this.save(user1);
      await this.save(user2);
    }
  }

  async _delFriend(user1_id: number, user2_id: number) {
    let user1 = await this._findOneWithAllRel(user1_id);
    let user2 = await this._findOneWithAllRel(user2_id);
    user1.friends = user1.friends.filter((friend) => friend.id != user2.id);
    user2.friends = user2.friends.filter((friend) => friend.id != user1.id);
    await this.save(user1);
    await this.save(user2);
  }
}
