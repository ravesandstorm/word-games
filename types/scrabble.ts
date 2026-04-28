import type { Player } from './game';

export interface ScrabbleCell {
  letter: string;
  isTemp: boolean;
  isPermanent: boolean;
  multiplier?: 'DL' | 'TL' | 'DW' | 'TW' | 'STAR'; // Double Letter, Triple Letter, Double Word, Triple Word, Center
}

export interface ScrabbleTile {
  letter: string;
  score: number;
  isBlank: boolean;
}

export interface ScrabblePlayer extends Player {
  tiles: ScrabbleTile[];
}

export interface ScrabbleGameState {
  board: ScrabbleCell[][];
  players: ScrabblePlayer[];
  currentPlayerIndex: number;
  currentRound: number;
  letterBag: ScrabbleTile[];
  status: 'waiting' | 'playing' | 'finished';
  usedWords: string[];
}

export interface ScrabbleRoom {
  roomCode: string;
  hostId: string;
  players: ScrabblePlayer[];
  gameState: ScrabbleGameState;
  createdAt: Date;
}