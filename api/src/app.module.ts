import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './database/entities/user.entity';
import { Game } from './database/entities/game.entity';
import { Achievement } from './database/entities/achievement.entity';
import { Setting } from './database/entities/setting.entity';
import { GameModule } from './game/game.module';
import { ChatModule } from './chat/chat.module';
import { Action } from './database/entities/action.entity';
import { DatabaseModule } from './database/database.module';
import { Ladder } from './database/entities/ladder.entity';
import { LadderView } from './database/entities/ladderView.entity';
import { Config } from './database/entities/config.entity';
import { Room } from './database/entities/room.entity';
import { UserRoom } from './database/entities/user-room.entity';
import { Message } from './database/entities/message.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [
        User,
        Game,
        Achievement,
        Setting,
        LadderView,
        Ladder,
        Action,
        Config,
        Room,
        UserRoom,
        Message,
      ],
      logging: false,
      synchronize: true,
    }),
    AuthModule,
    UserModule,
    ChatModule,
    GameModule,
    DatabaseModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private appService: AppService) {
    this.appService.initDB();
  }
}
