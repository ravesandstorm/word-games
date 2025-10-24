export interface Player {
  id: string;
  name: string;
  score: number;
  isLocal: boolean;
}

export interface Cell {
  letter: string;
  isTemp: boolean;
  isPermanent: boolean;
}

export interface GameState {
  board: Cell[][];
  currentPlayerIndex: number;
  currentRound: number;
  boardSize: number;
  maxLettersPerTurn: number;
  roundsPerIncrement: number;
  status: 'waiting' | 'playing' | 'finished';
  usedWords: string[];
}

export interface Room {
  roomCode: string;
  hostId: string;
  players: Player[];
  gameState: GameState;
  createdAt: Date;
}

export interface WordValidationRequest {
  words: string[];
  usedWords: string[];
  wordle: boolean;
}

export interface WordValidationResponse {
  validWords: Array<{
    word: string;
    length: number;
    isValid: boolean;
    alreadyUsed: boolean;
  }>;
  longestValid: string | null;
}

export interface Position {
  row: number;
  col: number;
}