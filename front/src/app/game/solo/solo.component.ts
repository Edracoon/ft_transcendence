import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { PongGame } from '../pong/pongGame';
import {
  Point,
  Ball,
  Player,
  ballBot,
  ballLeft,
  ballReset,
  ballRight,
  ballTop,
  playerBot,
  playerLeft,
  playerRight,
  playerTop,
} from '../pong/utils';
import { CANVASBACKGROUND } from './canvasBackground';
import { botDifficulty, Customisation } from './customisation';
import * as CONF from '../pong/GameConfig';
import { Router } from '@angular/router';
import { GameService } from 'src/app/services/game.service';
import { Title } from '@angular/platform-browser';

/* this component is responsible for the pong SOLO mode, game is
played inside the client browser, nothing is stored on the server side */

@Component({
  selector: 'app-solo',
  templateUrl: './solo.component.html',
  styleUrls: ['./solo.component.scss'],
})
export class SoloComponent implements OnInit {
  @ViewChild('pong') canvasRef!: ElementRef;

  play: boolean = false;
  callback!: (deltaTime: number) => void;
  update!: Function;
  game!: PongGame;
  ball: Ball = new Ball(
    new Point(CONF.GAME_WIDTH / 2, CONF.GAME_HEIGHT / 2),
    new Point(CONF.BALL_XVELOCITY, CONF.BALL_YVELOCITY)
  );
  leftPlayer: Player = new Player(
    new Point(CONF.PADDLE_WIDTH + CONF.PADDLE_WIDTH / 2, CONF.GAME_HEIGHT / 2)
  );
  rightPlayer: Player = new Player(
    new Point(
      CONF.GAME_WIDTH - (CONF.PADDLE_WIDTH + CONF.PADDLE_WIDTH / 2),
      CONF.GAME_HEIGHT / 2
    )
  );
  guess: Point | undefined = undefined;
  canvas: HTMLCanvasElement | undefined = undefined;
  context: CanvasRenderingContext2D | undefined = undefined;
  background: HTMLImageElement | undefined = undefined;
  endGame: number = 0;

  customisationForm: FormGroup = new FormGroup({
    ballColor: new FormControl('#ffffff'),
    ballSpeed: new FormControl(1),
    botDifficulty: new FormControl('MEDIUM'),
  });

  customisation: Customisation = {
    ballColor: '#ffffff',
    ballSpeed: 1,
    botDifficulty: 1,
    background: undefined,
  };

  canvasBackground = CANVASBACKGROUND;

  constructor(
    private router: Router,
    private gameService: GameService,
    private titleService: Title
  ) {
    this.titleService.setTitle('Game');
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    let lastTime: number = 0;
    this.play = false;
    /* PONG game loop */
    this.callback = (deltaTime): void => {
      if (lastTime) {
        const diff = (deltaTime - lastTime) / 1000;
        this.ball.pos.x +=
          this.ball.velocity.x * this.customisation.ballSpeed * diff;
        this.ball.pos.y +=
          this.ball.velocity.y * this.customisation.ballSpeed * diff;
        this.botLoop();
        this.drawBackground();
        this.drawPlayers();
        this.drawBall();
        this.collide();
      }
      lastTime = deltaTime;
      this.endGame = requestAnimationFrame(this.callback);
    };
  }

  pickBackground(el: HTMLImageElement): void {
    let ref = this.customisation.background;
    if (ref === undefined) {
      el.style.border = '3px #0a58ca solid';
      this.customisation.background = el;
    } else {
      if (el === ref) {
        el.style.border = 'none';
        this.customisation.background = undefined;
      } else {
        ref.style.border = 'none';
        el.style.border = '3px #0a58ca solid';
        this.customisation.background = el;
      }
    }
  }

  ngAfterViewChecked(): void {
    if (this.play && this.canvas === undefined) {
      this.canvas = this.canvasRef.nativeElement;
      this.context = this.canvas!.getContext('2d')!;
      this.game = {
        canvas: this.canvas as HTMLCanvasElement,
        context: this.context,
      };
    }
  }

  onSubmit(): void {
    this.customisation.ballColor = this.customisationForm.value['ballColor'];
    this.customisation.ballSpeed = this.customisationForm.value['ballSpeed'];
    /* Higher difficulty means faster bot, lower means lower bot */
    this.customisation.botDifficulty = ((): botDifficulty => {
      if (this.customisationForm.value['botDifficulty'] === 'EASY')
        return botDifficulty.EASY;
      else if (this.customisationForm.value['botDifficulty'] === 'MEDIUM')
        return botDifficulty.MEDIUM;
      else if (this.customisationForm.value['botDifficulty'] === 'HARD')
        return botDifficulty.HARD;
      else return botDifficulty.EASY;
    })();
    if (this.customisation.background !== undefined) {
      this.background = new Image();
      this.background.src = this.customisation.background!.getAttribute('src')!;
    }
    this.play = true;
    requestAnimationFrame(this.callback);
  }

  /* Guess where the ball is going to hit relative to bot x position */
  ballWhere(b: Ball, target: Player) {
    const ballGuess = new Ball(
      new Point(b.pos.x, b.pos.y),
      new Point(b.velocity.x, b.velocity.y)
    );

    /* Loop to predict will hit the wall relative to bot */
    while (ballRight(ballGuess) < playerLeft(target)) {
      /* we expect each frame to be 16 ms */
      ballGuess.pos.x +=
        this.customisation.ballSpeed * ballGuess.velocity.x * (1 / 60);
      ballGuess.pos.y +=
        this.customisation.ballSpeed * ballGuess.velocity.y * (1 / 60);
      /* Simulate collides */
      if (
        ballGuess.pos.y <= 0 ||
        ballGuess.pos.y + CONF.BALL_HEIGHT >= CONF.GAME_HEIGHT
      )
        ballGuess.velocity.y *= -1;
    }
    const noise: number =
      Math.random() * (CONF.PADDLE_HEIGHT / 2) * (Math.random() > 0.5 ? 1 : -1);
    this.guess = new Point(ballGuess.pos.x, ballGuess.pos.y + noise);
  }

  /* Broken AI which try to follow ball direction */
  private botLoop(): void {
    const b: Ball = this.ball;
    const p: Player = this.rightPlayer;

    if (b.pos.x <= CONF.GAME_WIDTH / 2 || b.velocity.x < 0) {
      if (b.velocity.x < 0) this.guess = undefined;
      if (Math.abs(p.pos.y - b.pos.y) < this.customisation.botDifficulty) {
        p.pos.y = b.pos.y;
      } else if (p.pos.y < b.pos.y) p.pos.y += this.customisation.botDifficulty;
      else if (p.pos.y > b.pos.y) p.pos.y -= this.customisation.botDifficulty;
    } else if (b.velocity.x > 0 && this.guess === undefined) {
      this.ballWhere(this.ball, p);
    }
    if (this.guess !== undefined && b.pos.x >= CONF.GAME_WIDTH / 2) {
      if (
        p.pos.y - this.guess.y < this.customisation.botDifficulty &&
        p.pos.y - this.guess.y > 0
      ) {
        p.pos.y = this.guess.y;
      } else if (p.pos.y < this.guess.y)
        p.pos.y += this.customisation.botDifficulty;
      else if (p.pos.y > this.guess.y)
        p.pos.y -= this.customisation.botDifficulty;
    }
  }

  /* collision detection with paddle and arena */
  collide(): void {
    const ball = this.ball;
    const Lplayer = this.leftPlayer;
    const Rplayer = this.rightPlayer;

    if (ballBot(ball) <= 0) {
      ball.pos.y = CONF.BALL_HEIGHT / 2;
      ball.velocity.y *= -1;
    } else if (ballBot(ball) >= CONF.GAME_HEIGHT) {
      ball.pos.y = CONF.GAME_HEIGHT - CONF.BALL_HEIGHT / 2;
      ball.velocity.y *= -1;
    } else if (ballRight(ball) >= CONF.GAME_WIDTH) {
      ballReset(ball, 'right');
      this.leftPlayer.score += 1;
      this.guess = undefined;
      if (this.leftPlayer.score === CONF.WIN_SCORE) {
        this.gameService.takeInfoSolo(
          this.leftPlayer.score,
          this.rightPlayer.score,
          this.customisationForm.value['botDifficulty']
        );
        this.router.navigateByUrl('game/game-recap-solo?');
      }
    } else if (ballLeft(ball) <= 0) {
      /* right player scored a point */
      ballReset(ball, 'left');
      this.rightPlayer.score += 1;
      this.guess = undefined;
      if (this.rightPlayer.score === CONF.WIN_SCORE) {
        this.gameService.takeInfoSolo(
          this.leftPlayer.score,
          this.rightPlayer.score,
          this.customisationForm.value['botDifficulty']
        );
        this.router.navigateByUrl('game/game-recap-solo?');
      }
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
  }

  drawBall(): void {
    const ball = this.ball;
    this.game.context!.fillStyle = this.customisation.ballColor;
    this.game.context!.fillRect(
      ballLeft(ball),
      ballTop(ball),
      CONF.BALL_WIDTH,
      CONF.BALL_HEIGHT
    );
  }

  drawPlayers(): void {
    this.game.context!.fillStyle = 'white';
    [this.leftPlayer, this.rightPlayer].forEach((player) => {
      this.game.context!.fillRect(
        playerLeft(player),
        playerTop(player),
        CONF.PADDLE_WIDTH,
        CONF.PADDLE_HEIGHT
      );
    });
    this.game.context!.font = '48px impact';
    this.game.context!.fillText(
      this.leftPlayer.score.toString(),
      CONF.GAME_WIDTH / 3,
      CONF.GAME_HEIGHT / 5
    );
    this.game.context!.fillText(
      this.rightPlayer.score.toString(),
      (CONF.GAME_WIDTH / 3) * 2,
      CONF.GAME_HEIGHT / 5
    );
  }

  drawBackground(): void {
    if (this.background !== undefined) {
      this.game.context!.drawImage(
        this.background,
        0,
        0,
        this.canvas?.width as number,
        this.canvas?.height as number
      );
      // };
    } else {
      this.game.context!.fillStyle = 'black';
      this.game.context!.fillRect(
        0,
        0,
        this.game.canvas!.width,
        this.game.canvas!.height
      );
    }
    /* white net */
    const ball = this.ball;
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
    const scale =
      e.offsetY /
      (e.target as HTMLCanvasElement).getBoundingClientRect().height;
    this.leftPlayer.pos.y = scale * this.canvas!.height;
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.endGame);
  }
}
