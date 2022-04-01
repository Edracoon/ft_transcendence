import { Router } from '@angular/router';
import { GameService } from '../../services/game.service';
import { PongGame } from './pongGame';
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import {
  ballBot,
  ballLeft,
  ballReset,
  ballRight,
  ballTop,
  playerBot,
  playerLeft,
  playerRight,
  playerTop,
} from './utils';
import * as CONF from './GameConfig';
import { UserStatus } from 'src/app/models/user';
import { UserSocketService } from 'src/app/services/user-socket.service';

@Component({
  selector: 'app-pong',
  templateUrl: './pong.component.html',
  styleUrls: ['./pong.component.scss'],
})
export class PongComponent implements OnInit, OnDestroy {
  @ViewChild('pong') canvasRef!: ElementRef;

  callback!: (deltaTime: number) => void;
  update!: Function;
  game!: PongGame;
  canvas!: HTMLCanvasElement;
  context!: CanvasRenderingContext2D;
  endGame: number = 0;
  frames: number = 0;

  constructor(
    private router: Router,
    private gameService: GameService,
    private userSocketService: UserSocketService
  ) {}

  ngOnInit(): void {}

  async ngAfterViewInit() {
    /* sanity check */
    if (
      this.gameService.state !== 'LOOKING' &&
      this.gameService.state !== 'IN_DUEL' &&
      this.gameService.state !== 'IN_RANKED'
    ) {
      await this.router.navigateByUrl('/home');
      return;
    }
    this.canvas = this.canvasRef.nativeElement;
    this.context = this.canvas!.getContext('2d')!;
    this.game = {
      canvas: this.canvas,
      context: this.context,
    };
    let lastTime: number = 0;

    this.callback = (deltaTime): void => {
      if (lastTime) {
        const ball = this.gameService.myBall;
        const diff = (deltaTime - lastTime) / 1000;
        ball.pos.x += ball.velocity.x * diff;
        ball.pos.y += ball.velocity.y * diff;
        /* state might be undefined when executing the game loop
      due to reconnection, state mismatch, silence errors */
        try {
          this.drawBackground();
          this.drawPlayers();
          this.drawBall();
          this.collide();
        } catch (e) {}
      }
      lastTime = deltaTime;
      this.endGame = requestAnimationFrame(this.callback);
    };
    requestAnimationFrame(this.callback);
  }

  collide(): void {
    const ball = this.gameService.myBall;

    const Rplayer = this.gameService.room.state.rightPlayer;
    const Lplayer = this.gameService.room.state.leftPlayer;

    if (ballTop(ball) <= 0) {
      ball.pos.y = CONF.BALL_HEIGHT / 2;
      ball.velocity.y *= -1;
    } else if (ballBot(ball) >= CONF.GAME_HEIGHT) {
      ball.pos.y = CONF.GAME_HEIGHT - CONF.BALL_HEIGHT / 2;
      ball.velocity.y *= -1;
    } else if (ballRight(ball) >= CONF.GAME_WIDTH) {
      ballReset(ball, 'right');
    } else if (ballLeft(ball) <= 0) {
      /* right player scored a point */
      ballReset(ball, 'left');
    } else if (
      playerTop(Lplayer) < ballBot(ball) &&
      playerBot(Lplayer) > ballTop(ball) &&
      playerRight(Lplayer) >= ballLeft(ball)
    ) {
      /* if a collision happens, ball may be "inside" the paddle due
        to his deplacement computation (time * velocity), to prevent that
        we must put back the ball in front of the paddle */
      if (playerRight(Lplayer) > ballLeft(ball))
        ball.pos.x = playerRight(Lplayer) + CONF.BALL_WIDTH / 2;
      const bounce: number = ball.pos.y - Lplayer.pos.y;
      /* add %5 to ball's speed each time it hits a player */
      ball.velocity.x *= -1.05;
      ball.velocity.y =
        CONF.BALL_YVELOCITY * (bounce / (CONF.PADDLE_HEIGHT / 2));
    } else if (
      playerTop(Rplayer) < ballBot(ball) &&
      playerBot(Rplayer) > ballTop(ball) &&
      playerLeft(Rplayer) <= ballRight(ball)
    ) {
      if (playerLeft(Rplayer) <= ballRight(ball))
        ball.pos.x = playerLeft(Rplayer) - CONF.BALL_WIDTH / 2;
      const bounce: number = ball.pos.y - Rplayer.pos.y;
      ball.velocity.x *= -1.05;
      ball.velocity.y =
        CONF.BALL_YVELOCITY * (bounce / (CONF.PADDLE_HEIGHT / 2));
    }
    this.gameService.clientPrediction.push({
      pos: { ...ball.pos },
      velocity: { ...ball.velocity },
    });
  }

  drawBall(): void {
    const ball = this.gameService.myBall;
    this.game.context!.fillStyle =
      this.gameService.gameInfo.customisation.ballColor;
    this.game.context!.fillRect(
      ballLeft(ball),
      ballTop(ball),
      CONF.BALL_WIDTH,
      CONF.BALL_HEIGHT
    );
  }

  drawPlayers(): void {
    /* paddle */
    if (this.gameService.room) {
      this.game.context!.fillStyle = 'white';
      [
        this.gameService.room.state.leftPlayer,
        this.gameService.room.state.rightPlayer,
      ].forEach((player) => {
        this.game.context!.fillRect(
          playerLeft(player),
          playerTop(player),
          CONF.PADDLE_WIDTH,
          CONF.PADDLE_HEIGHT
        );
      });
      /* score */
      this.game.context!.font = '48px impact';
      this.game.context!.fillText(
        this.gameService.room.state.leftPlayer.score.toString(),
        CONF.GAME_WIDTH / 3,
        CONF.GAME_HEIGHT / 5
      );
      this.game.context!.fillText(
        this.gameService.room.state.rightPlayer.score.toString(),
        (CONF.GAME_WIDTH / 3) * 2,
        CONF.GAME_HEIGHT / 5
      );
    }
  }

  drawBackground(): void {
    this.game.context!.fillStyle = 'black';
    this.game.context!.fillRect(
      0,
      0,
      this.game.canvas!.width,
      this.game.canvas!.height
    );
    this.game.context!.fillStyle = 'white';
    /* white net */
    const ball = this.gameService.myBall;
    this.game.context!.fillStyle = 'white';
    for (
      let i = CONF.BALL_HEIGHT / 2;
      i < this.game.canvas!.height;
      i += CONF.BALL_HEIGHT * 2
    )
      this.game.context!.fillRect(
        this.game.canvas!.width / 2,
        i,
        CONF.BALL_WIDTH,
        CONF.BALL_HEIGHT
      );
  }

  move(e: MouseEvent): void {
    if (
      this.gameService.state != 'IN_DUEL' &&
      this.gameService.state != 'IN_RANKED'
    )
      return;
    const scale =
      e.offsetY /
      (e.target as HTMLCanvasElement).getBoundingClientRect().height;
    this.gameService.updatePosition(scale * this.canvas.height);
  }

  ngOnDestroy() {
    if (
      this.gameService.state !== 'LOOKING' &&
      this.gameService.state !== 'IN_DUEL' &&
      this.gameService.state !== 'IN_RANKED'
    )
      return;
    const room = this.gameService.room;
    if (
      room.state.rightPlayer.score !== CONF.WIN_SCORE &&
      room.state.leftPlayer.score !== CONF.WIN_SCORE
    ) {
      this.gameService.room.leave(false);
      this.userSocketService.emit('set_status', UserStatus.ON);
    } else this.gameService.state = 'IDLE';
    cancelAnimationFrame(this.endGame);
  }
}
