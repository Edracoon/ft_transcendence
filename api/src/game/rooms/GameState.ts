import { Schema, type } from "@colyseus/schema";
import { Player } from "./Player";
import { Ball } from "./Ball";
import { Point } from "./Point";
import * as CONF from "./GameConfig";

export class GameState extends Schema {
  @type(Player)
  leftPlayer: Player;
  @type(Player)
  rightPlayer: Player;
  @type(Ball)
  ball: Ball;

  constructor(
    leftPlayer = new Player(
      new Point(CONF.PADDLE_WIDTH + CONF.PADDLE_WIDTH / 2, CONF.GAME_HEIGHT / 2)
    ),
    rightPlayer = new Player(
      new Point(
        CONF.GAME_WIDTH - (CONF.PADDLE_WIDTH + CONF.PADDLE_WIDTH / 2),
        CONF.GAME_HEIGHT / 2
      )
    ),
    ball = new Ball(
      new Point(CONF.GAME_WIDTH / 2, CONF.GAME_HEIGHT / 2),
      new Point(CONF.BALL_XVELOCITY, CONF.BALL_YVELOCITY)
    ),
  ) {
    super();
    this.leftPlayer = leftPlayer;
    this.rightPlayer = rightPlayer;
    this.ball = ball;
  }
}