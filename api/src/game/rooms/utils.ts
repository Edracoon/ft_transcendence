import * as CONF from "./GameConfig";
import { Ball } from "./Ball";
import { Player } from "./Player";

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

export function ballReset(b: Ball, d: string, s: number): void {
  b.pos.x = CONF.GAME_WIDTH / 2;
  b.pos.y = CONF.GAME_HEIGHT / 2;
  /* if ball multiplicater is 0 or less, set it to 1 */
  if (s <= 0) s = 1;
  if (d === "left") b.velocity.x = -CONF.BALL_XVELOCITY * s;
  else if (d === "right") b.velocity.x = CONF.BALL_XVELOCITY * s;
  b.velocity.y = CONF.BALL_YVELOCITY;
}

export function debugBall(b: Ball): void {
  console.log("ball is @(", b.pos.x, ",", b.pos.y);
  console.log("ball TOP is ", ballTop(b));
  console.log("ball BOT is ", ballBot(b));
  console.log("ball LEFT is ", ballLeft(b));
  console.log("ball RIGHT is ", ballRight(b));
  console.log("------------------------");
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

export function debugPlayer(p: Player): void {
  console.log("player is @(", p.pos.x, ",", p.pos.y, ")");
  console.log("player TOP is ", playerTop(p));
  console.log("player BOT is ", playerBot(p));
  console.log("player LEFT is ", playerLeft(p));
  console.log("player RIGHT is ", playerRight(p));
  console.log("------------------------");
}
