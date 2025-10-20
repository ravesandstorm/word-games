import mongoose from 'mongoose';
import type { Room as RoomType } from '~/types/game';

const roomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, index: true },
  hostId: { type: String, required: true },
  players: [{
    id: String,
    name: String,
    score: Number,
    isLocal: Boolean
  }],
  gameState: {
    board: Array,
    currentPlayerIndex: Number,
    currentRound: Number,
    boardSize: Number,
    maxLettersPerTurn: Number,
    roundsPerIncrement: Number,
    status: String,
    usedWords: [String]
  },
  createdAt: { type: Date, default: Date.now, expires: 7200 }
});

export const Room = mongoose.models.Room || mongoose.model<RoomType>('Room', roomSchema);
