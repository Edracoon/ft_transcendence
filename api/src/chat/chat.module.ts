import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from 'src/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { UserGateway } from 'src/user/user.gateway';
import { UserService } from 'src/user/user.service';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    UserModule,
    ConfigModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, UserService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
