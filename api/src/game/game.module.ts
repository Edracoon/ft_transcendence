import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameRepository } from 'src/database/repositories/game.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { UserRepository } from 'src/database/repositories/user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([GameRepository, UserRepository]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    UserModule,
  ],
  controllers: [GameController],
  providers: [GameService],
})
export class GameModule {}
