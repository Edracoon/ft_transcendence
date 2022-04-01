import { Schema, type } from "@colyseus/schema";
import { Player } from './utils';

export interface PongGame {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
}
