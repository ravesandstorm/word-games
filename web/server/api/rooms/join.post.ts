import { Room } from '../../models/Room';
import { isMongoConnected } from '../../plugins/mongodb';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomCode } = body;
  
  console.log(`[API] POST /api/rooms/join - Room: ${roomCode}`);

  if (!isMongoConnected()) {
    console.log('[API] ✗ MongoDB not available');
    throw createError({
      statusCode: 503,
      message: 'MongoDB not available'
    });
  }

  try {
    const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

    if (!room) {
      console.log(`[API] ✗ Room ${roomCode} not found`);
      throw createError({
        statusCode: 404,
        message: 'Room not found'
      });
    }

    console.log(`[API] ✓ Room ${roomCode} found`);
    return { room };
  } catch (err: any) {
    console.error('[API] ✗ Error joining room:', err);
    throw createError({
      statusCode: 500,
      message: err.message
    });
  }
});