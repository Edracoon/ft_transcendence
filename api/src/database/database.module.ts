import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameRepository } from './repositories/game.repository';
import { RoomRepository } from './repositories/room.repository';
import { UserRepository } from './repositories/user.repository';
import { GameSubscriber } from './subscribers/game.subscriber';
import { UserSubscriber } from './subscribers/user.subscriber';
import { RoomSubscriber } from './subscribers/room.subscriber';
import { ConfigSubscriber } from './subscribers/config.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserRepository, GameRepository, RoomRepository]),
  ],
  providers: [GameSubscriber, UserSubscriber, RoomSubscriber, ConfigSubscriber],
  exports: [
    TypeOrmModule,
    GameSubscriber,
    UserSubscriber,
    RoomSubscriber,
    ConfigSubscriber,
  ],
})
export class DatabaseModule {}
