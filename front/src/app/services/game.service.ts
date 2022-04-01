import { Client, Room } from 'colyseus.js';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { Ball, Point, GameState } from '../game/pong/utils';
import * as CONF from '../game/pong/GameConfig';
import { UserSocketService } from './user-socket.service';
import { UserStatus } from '../models/user';

export type State =
  | 'IDLE'
  | 'WAITING_RANKED'
  | 'WAITING_DUEL'
  | 'LOOKING'
  | 'IN_RANKED'
  | 'IN_DUEL'
  | 'IN_ACCEPT';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  endpoint: string = environment.API_INFINITY + '/api/game';

  public previousState: State = 'IDLE';
  public state: State = 'IDLE';

  public gameMode: string = 'ranked';

  // Info link with colyseus
  public gameInfo: any;
  public gameEndInfo: any;

  // Info link with colyseus
  // Info for SoloGame
  scoreSoloLeft!: number;
  scoreSoloRight!: number;
  botDifficulty!: string;
  needRefresh: boolean = false;

  onGoingDuelParams: any = {
    id1: -1,
    id2: -1,
    selectedUser: undefined,
    customisation: {
      ballSpeed: 1,
      ballColor: '#ffffff',
    },
  };

  duelExpired: boolean = false;

  private client: Client;
  global: any = undefined;
  room: any = undefined;
  myBall: Ball = new Ball(
    new Point(CONF.GAME_WIDTH / 2, CONF.GAME_HEIGHT / 2),
    new Point(CONF.BALL_XVELOCITY, CONF.BALL_YVELOCITY)
  );
  clientPrediction = Array<{
    pos: { x: number; y: number };
    velocity: { x: number; y: number };
  }>();

  constructor(
    private router: Router,
    private userSocketService: UserSocketService
  ) {
    this.client = new Client(environment.GAME_GATEWAY);
    this.connectServiceRoom();
  }

  async connectServiceRoom() {
    if (this.needRefresh === true) this.router.navigateByUrl('/home');
    this.needRefresh = false;
    this.client
      .joinOrCreate('serviceRoom', {
        authorization: 'Bearer ' + localStorage.getItem('access_token'),
      })
      .then((serviceRoom) => {
        this.global = serviceRoom;

        serviceRoom.onError((code, message) => {
          console.log('ERROR [', code, '] :', message);
        });

        serviceRoom.onLeave((code) => {
          this.global = undefined;
        });

        serviceRoom.onMessage('cancel', async (message: any) => {
          if (!message.retry) {
            await this.router.navigateByUrl('/home');
            return;
          }
          switch (message.previous_state) {
            case 'WAITING_RANKED':
              await this.router.navigateByUrl('/game/ranked');
              break;
            case 'WAITING_DUEL':
              await this.router.navigateByUrl('/game/duel');
              break;
          }
        });

        serviceRoom.onMessage('duel-expired', (message: any) => {
          this.duelExpired = true; // On le remet à false dans duelComponent
          // Check if room exist
          if (this.room) this.room.leave();
        });

        serviceRoom.onMessage('state_incompatible', async (message: any) => {
          this.state = message.state;
          switch (message.state) {
            case 'IN_DUEL':
            case 'IN_RANKED':
              //this.room.leave();
              this.gameMode = message.state === 'IN_DUEL' ? 'duel' : 'ranked';
              const ongoingRoom = await this.client
                .reconnect<GameState>(message.roomId, message.sessionId)
                .catch((error) => {
                  console.log('error with game server');
                });
              if (ongoingRoom) {
                this.room = ongoingRoom;
                this.setupRoom(ongoingRoom, message.state, true);
              }
              break;
            case 'WAITING_DUEL':
              /* CE CODE N'EST PAS UTILISÉ CAR ON VERIFIE DANS
                JOIN MATCHMAKING LE STATE (FALACHA) */
              this.joinDuel(
                this.onGoingDuelParams.id1,
                this.onGoingDuelParams.id2,
                this.onGoingDuelParams.customisation
              );
              this.router.navigateByUrl('/game/duel');
              break;
            case 'WAITING_RANKED':
              this.router.navigateByUrl('/game/ranked');
              break;
          }
        });

        serviceRoom.onMessage('state', async (message: State) => {
          if (!this.global) return;
          if (
            message === 'IDLE' &&
            this.state !== 'IN_DUEL' &&
            this.state !== 'IN_RANKED' &&
            this.state !== 'LOOKING' &&
            this.state !== 'WAITING_DUEL'
          )
            await this.router.navigateByUrl('/home');
          else if (message === 'WAITING_RANKED')
            this.router.navigateByUrl('/game/ranked');
          else if (message === 'IN_DUEL' || message === 'IN_RANKED')
            this.userSocketService.emit('set_status', UserStatus.GAME);
          this.previousState = this.state;
          this.state = message;
        });
        serviceRoom.onMessage('already-connected', async (message: State) => {
          serviceRoom.leave(false);
          this.needRefresh = true;
          this.global = undefined;
        });
      })
      .catch((error) => {
        /* here we can detect A DOWN game server */
        console.log("Couldn't connect to game server !");
      });
  }
  async joinSpectator(roomId: string) {
    const gameRoom = await this.client
      .joinById<GameState>(roomId, {
        token: localStorage.getItem('access_token'),
      })
      .catch((error) => {
        console.log('error with game server');
      });
    if (gameRoom) {
      this.room = gameRoom;
      this.setupRoom(gameRoom, 'LOOKING', true);
    }
  }

  async getGameRooms() {
    const rooms = await this.client
      .getAvailableRooms('gameRoom')
      .catch((error) => {
        console.log('error with game server');
      });
    return rooms;
  }

  private resetBall() {
    this.myBall.pos.x = CONF.GAME_WIDTH / 2;
    this.myBall.pos.y = CONF.GAME_HEIGHT / 2;
    this.myBall.velocity.x =
      CONF.BALL_XVELOCITY * this.gameInfo.customisation.ballSpeed;
    this.myBall.velocity.y = CONF.BALL_YVELOCITY;
  }

  private setupRoom(
    room: Room<GameState>,
    roomType: State,
    reconnection: boolean
  ) {
    room.onMessage('gameInfo', async (message: any) => {
      this.gameInfo = message;
      if (reconnection) {
        await this.router.navigateByUrl('game/play');
      } else await this.router.navigateByUrl('game/accept');
    });

    room.onMessage('gameend', async (message: any) => {
      this.gameEndInfo = message;
      this.userSocketService.emit('set_status', UserStatus.EGAME);
      await this.router.navigateByUrl('game/game-recap');
    });

    room.onMessage('ready', async (message: any) => {
      this.state = roomType;
      this.resetBall();
      await this.router.navigateByUrl('game/play');
    });

    room.onError((code, message) => {
      /* handle error here */
      console.log('ERROR [', code, '] :', message);
    });

    room.onLeave((code) => {
      this.room = undefined;
    });

    room.onStateChange((state: GameState) => {
      if (this.clientPrediction.length === 0) return;
      const clientBall = this.clientPrediction.shift();
      if (JSON.stringify(clientBall) !== JSON.stringify(this.room.state.ball)) {
        this.myBall.pos = { ...this.room.state.ball.pos };
        this.myBall.velocity = { ...this.room.state.ball.velocity };
        this.clientPrediction.splice(0, this.clientPrediction.length);
      }
    });
  }

  async joinDuel(
    id1: number,
    id2: number,
    customisation: any = { ballSpeed: 1, ballColor: '#ffffff' }
  ) {
    if (this.state === 'WAITING_RANKED') {
      this.router.navigateByUrl('/game/ranked');
      return;
    }
    this.gameMode = 'duel';
    const duel = await this.client
      .joinOrCreate('duelRoom', {
        authorization: 'Bearer ' + localStorage.getItem('access_token'),
        id1: id1,
        id2: id2,
        customisation: customisation,
      })
      .catch((error) => {
        console.log('error with game server');
      });
    this.room = duel;
    if (!duel) return;

    duel.onError((code, message) => {
      /* handle error here */
      console.log('ERROR [', code, '] :', message);
    });

    duel.onLeave((code) => {
      /* handle game server disconnection here */
    });

    duel.onMessage('seat', async (reservation: any) => {
      /* we got a room, disconnect from DuelRoom */
      const gameRoom = await this.client
        .consumeSeatReservation<GameState>(reservation)
        .catch((error) => {
          console.log('error with game server');
        });
      if (gameRoom) {
        duel.leave();
        this.room = gameRoom;
        this.setupRoom(gameRoom, 'IN_DUEL', false);
      }
    });
  }

  async joinMatchMaking() {
    if (!this.global) return;
    this.gameMode = 'ranked';
    if (this.state === 'WAITING_DUEL') {
      this.router.navigateByUrl('/game/duel');
      return;
    }
    await this.client
      .joinOrCreate('matchmakingRoom', {
        authorization: 'Bearer ' + localStorage.getItem('access_token'),
      })
      .catch((error) => {
        console.log('error with game server');
      })
      .then((matchMaking) => {
        this.room = matchMaking;
        if (!matchMaking) return;

        matchMaking.onError((code: number, message: any) => {
          /* handle error here */
          console.log('ERROR [', code, '] :', message);
        });

        matchMaking.onLeave((code: number) => {
          /* handle game server disconnection here */
        });

        matchMaking.onMessage('seat', async (reservation: any) => {
          /* we got a room, disconnect from MatchMakingRoom */
          matchMaking.leave();
          const gameRoom = await this.client
            .consumeSeatReservation<GameState>(reservation)
            .catch((error) => {
              console.log('error with game server');
            });
          if (gameRoom) {
            this.room = gameRoom;
            this.setupRoom(gameRoom, 'IN_RANKED', false);
          }
        });
      });
  }

  cancel() {
    if (this.room) this.room.send('cancel');
  }

  takeInfoSolo(scoreUser: number, scoreBot: number, botInfo: string) {
    this.scoreSoloLeft = scoreUser;
    this.scoreSoloRight = scoreBot;
    this.botDifficulty = botInfo;
  }

  isReady(): void {
    if (this.room) this.room.send('ready');
  }

  giveUp() {
    if (this.room) this.room.send('giveup', {});
  }

  updatePosition(yaxis: number) {
    if (this.room) this.room.send('move', yaxis);
  }

  ngOnDestroy() {
    /* Game.service is a root service, this code will
    only be triggered when the all application is closed */
    if (!this.room) return;
    /* If the match was not finished yet, notify the
    game server that we might want to reconnect */
    if (
      this.room.state.rightPlayer.score !== CONF.WIN_SCORE &&
      this.room.state.leftPlayer.score !== CONF.WIN_SCORE
    )
      this.room.leave(false);
    else this.room.leave();
  }
}
