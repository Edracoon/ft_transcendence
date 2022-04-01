import { Identifiers } from '@angular/compiler';
import { Schema, type } from '@colyseus/schema';
import * as CONF from './GameConfig';

export class Id extends Schema {
  constructor() {
    super();
    this.idLeft = 0;
    this.idRight = 0;
  }
  @type('number') public idLeft: number = 0;
  @type('number') public idRight: number = 0;
}

export class Point extends Schema {
  @type('number')
  x: number;
  @type('number')
  y: number;

  constructor(x = 0, y = 0) {
    super();
    this.x = x;
    this.y = y;
  }
}

export class Player extends Schema {
  @type(Point)
  pos: Point;
  @type('number')
  score: number;

  constructor(pos = new Point(0, 0), score = 0) {
    super();
    this.pos = pos;
    this.score = 0;
  }
}

export class Ball extends Schema {
  @type(Point)
  pos: Point;
  @type(Point)
  velocity: Point;

  constructor(pos = new Point(0, 0), velocity = new Point(0, 0)) {
    super();
    this.pos = pos;
    this.velocity = velocity;
  }
}

export class GameState extends Schema {
  @type(Player)
  leftPlayer: Player;
  @type(Player)
  rightPlayer: Player;
  @type(Ball)
  ball: Ball;
  @type(Id)
  ids: Id;

  constructor(
    leftPlayer = new Player(new Point(15, 205)),
    rightPlayer = new Player(new Point(824, 205)),
    ball = new Ball(),
    ids = new Id()
  ) {
    super();
    this.leftPlayer = leftPlayer;
    this.rightPlayer = rightPlayer;
    this.ball = ball;
    this.ids = ids;
  }
}

export function ballTop(b: Ball): number {
  return b.pos.y - CONF.BALL_HEIGHT / 2;
}

export function ballBot(b: Ball): number {
  return b.pos.y + CONF.BALL_HEIGHT / 2;
}

export function ballLeft(b: Ball): number {
  return b.pos.x - CONF.BALL_WIDTH / 2;
}

export function ballRight(b: Ball): number {
  return b.pos.x + CONF.BALL_WIDTH / 2;
}

export function ballReset(b: Ball, d: string): void {
  b.pos.x = CONF.GAME_WIDTH / 2;
  b.pos.y = CONF.GAME_HEIGHT / 2;
  if (d === "left") b.velocity.x = -CONF.BALL_XVELOCITY;
  else if (d === "right") b.velocity.x = CONF.BALL_XVELOCITY;
  b.velocity.y = CONF.BALL_YVELOCITY;
}

export function playerTop(p: Player): number {
  return p.pos.y - CONF.PADDLE_HEIGHT / 2;
}

export function playerBot(p: Player): number {
  return p.pos.y + CONF.PADDLE_HEIGHT / 2;
}

export function playerLeft(p: Player): number {
  return p.pos.x - CONF.PADDLE_WIDTH / 2;
}

export function playerRight(p: Player): number {
  return p.pos.x + CONF.PADDLE_WIDTH / 2;
}
