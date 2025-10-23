import type { NitroApp } from 'nitropack';
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { Room } from '../models/Room';

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const httpServer = (nitroApp as any).h3App?.stack?.[0]?.handle?.server as HTTPServer | undefined;

  if (!httpServer) {
    console.log('[SOCKET.IO] ✗ HTTP server not available, WebSocket disabled');
    return;
  }

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  console.log('[SOCKET.IO] ✓ WebSocket server initialized');

  io.on('connection', (socket) => {
    console.log(`[SOCKET.IO] Client connected: ${socket.id}`);

    // Join a room
    socket.on('join-room', async (data: { roomCode: string; playerId: string; playerName: string }) => {
      const { roomCode, playerId, playerName } = data;
      console.log(`[SOCKET.IO] ${socket.id} joining room ${roomCode}`);

      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Add player if not already in room
        const existingPlayer = room.players.find(p => p.id === playerId);
        if (!existingPlayer) {
          room.players.push({
            id: playerId,
            name: playerName,
            score: 0,
            isLocal: false
          });
          await room.save();
        }

        // Join socket room
        socket.join(roomCode);
        
        // Broadcast updated player list to all in room
        io.to(roomCode).emit('room-updated', {
          players: room.players,
          gameState: room.gameState
        });

        console.log(`[SOCKET.IO] ✓ ${playerName} joined room ${roomCode}. Total players: ${room.players.length}`);
      } catch (err) {
        console.error('[SOCKET.IO] ✗ Error joining room:', err);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave-room', async (data: { roomCode: string; playerId: string }) => {
      const { roomCode, playerId } = data;
      console.log(`[SOCKET.IO] ${socket.id} leaving room ${roomCode}`);

      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        
        if (room) {
          room.players = room.players.filter(p => p.id !== playerId);
          await room.save();

          socket.leave(roomCode);
          
          // Broadcast updated player list
          io.to(roomCode).emit('room-updated', {
            players: room.players,
            gameState: room.gameState
          });

          console.log(`[SOCKET.IO] ✓ Player left room ${roomCode}. Remaining players: ${room.players.length}`);
        }
      } catch (err) {
        console.error('[SOCKET.IO] ✗ Error leaving room:', err);
      }
    });

    // Update game state
    socket.on('update-game-state', async (data: { roomCode: string; gameState: any }) => {
      const { roomCode, gameState } = data;
      console.log(`[SOCKET.IO] Updating game state for room ${roomCode}`);

      try {
        const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
        
        if (room) {
          room.gameState = { ...room.gameState, ...gameState };
          await room.save();

          // Broadcast to all players in room
          io.to(roomCode).emit('game-state-updated', {
            gameState: room.gameState
          });

          console.log(`[SOCKET.IO] ✓ Game state updated for room ${roomCode}`);
        }
      } catch (err) {
        console.error('[SOCKET.IO] ✗ Error updating game state:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET.IO] Client disconnected: ${socket.id}`);
    });
  });

  // Store io instance for potential use in other parts of the app
  (nitroApp as any).io = io;
});

