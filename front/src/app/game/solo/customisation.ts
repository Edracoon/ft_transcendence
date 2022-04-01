export interface Customisation {
  ballColor: string;
  ballSpeed: number;
  botDifficulty: number;
  background: HTMLElement | undefined;
}

export enum botDifficulty {
  EASY = 3,
  MEDIUM = 6,
  HARD = 9,
}
