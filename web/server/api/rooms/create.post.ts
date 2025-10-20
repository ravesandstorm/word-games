import { Room } from '../../models/Room';
import { isMongoConnected } from '../../plugins/mongodb';

export default defineEventHandler(async (event) => {
  console.log('[API] POST /api/rooms/create');

  if (!isMongoConnected()) {
    console.log('[API] ✗ MongoDB not available');
    throw createError({
      statusCode: 503,
      message: 'MongoDB not available'
    });
  }

  const body = await readBody(event);
  const { hostId, hostName, gameSettings } = body;

  const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  console.log(`[API] → Creating room ${roomCode} for host ${hostName}`);

  try {
    const room = new Room({
      roomCode,
      hostId,
      players: [{
        id: hostId,
        name: hostName,
        score: 0,
        isLocal: false
      }],
      gameState: {
        board: [],
        currentPlayerIndex: 0,
        currentRound: 1,
        boardSize: gameSettings.boardSize,
        maxLettersPerTurn: gameSettings.maxLettersPerTurn,
        roundsPerIncrement: gameSettings.roundsPerIncrement,
        status: 'waiting',
        usedWords: []
      }
    });

    await room.save();
    console.log(`[API] ✓ Room ${roomCode} created successfully`);

    return { roomCode, room };
  } catch (err: any) {
    console.error('[API] ✗ Error creating room:', err);
    throw createError({
      statusCode: 500,
      message: err.message
    });
  }
});