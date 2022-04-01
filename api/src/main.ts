import { NestFactory } from '@nestjs/core';
import { Server } from 'colyseus';
import { AppModule } from './app.module';
import { DuelRoom } from './game/rooms/DuelRoom';
import { Session } from './game/rooms/GameInfos';
import { GameRoom } from './game/rooms/GameRoom';
import { MatchMakingRoom } from './game/rooms/MatchMakingRoom';
import { ServiceRoom } from './game/rooms/ServiceRoom';

const users = new Map<string, Session>();
const rooms = new Map<string, Array<string>>();
const connected = new Set<string>();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  const gameServer = new Server();
  gameServer.define('serviceRoom', ServiceRoom, {
    users: users,
    rooms: rooms,
    connected: connected,
  });
  gameServer
    .define('gameRoom', GameRoom, {
      users: users,
      rooms: rooms,
      connected: connected,
    })
    .enableRealtimeListing();
  gameServer.define('matchmakingRoom', MatchMakingRoom, {
    users: users,
    rooms: rooms,
    connected: connected,
  });
  gameServer.define('duelRoom', DuelRoom, {
    users: users,
    rooms: rooms,
    connected: connected,
  });
  gameServer.attach({ server: app.getHttpServer() });
  await app.listen(3000);
}
bootstrap();
