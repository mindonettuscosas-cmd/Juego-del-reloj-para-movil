
export enum GameMode {
  ELIMINATION = 'ELIMINACIÓN',
  LIVES = 'VIDAS'
}

export enum Difficulty {
  EASY = 'FÁCIL',
  NORMAL = 'NORMAL',
  HARD = 'DIFÍCIL'
}

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export interface Player {
  id: number;
  name: string;
  angle: number; 
  isJumping: boolean;
  jumpTime: number;
  isAlive: boolean;
  lives: number;
  score: number;
  color: string;
  jumpCooldown: number;
}

export interface GameSettings {
  playerCount: number;
  mode: GameMode;
  lives: number;
  difficulty: Difficulty;
}

export interface ScoreEntry {
  playerName: string;
  score: number;
  date: string;
}
