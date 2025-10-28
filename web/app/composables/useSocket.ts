import { io, Socket } from 'socket.io-client';
import type { Player, GameState } from '../../types/game';

export function useSocket() {
  const socket = ref<Socket | null>(null);
  const isConnected = ref(false);
  const roomPlayers = ref<Player[]>([]);
  const gameState = ref<GameState | null>(null);

  const connect = () => {
    if (socket.value?.connected) {
      console.log('[SOCKET] Already connected');
      return;
    }

    const config = useRuntimeConfig();
    // Use window.location.origin in browser to get the current host
    const socketUrl = process.client 
      ? window.location.origin 
      : (config.public.apiBase || 'http://localhost:3000');
    
    console.log(`[SOCKET] Connecting to ${socketUrl}...`);
    
    socket.value = io(socketUrl, {
      path: '/socket.io/',  // CRITICAL: Must match backend path
      transports: ['polling', 'websocket'],  // Try polling first, then upgrade
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    socket.value.on('connect', () => {
      console.log('[SOCKET] ✓✓✓ CONNECTED ✓✓✓');
      console.log('[SOCKET] ID:', socket.value?.id);
      console.log('[SOCKET] Transport:', socket.value?.io.engine.transport.name);
      isConnected.value = true;
    });

    socket.value.on('connected', (data) => {
      console.log('[SOCKET] ✓ Welcome message received:', data);
    });

    socket.value.on('disconnect', (reason) => {
      console.log('[SOCKET] ✗ Disconnected:', reason);
      isConnected.value = false;
    });

    socket.value.on('connect_error', (error) => {
      console.error('[SOCKET] ✗✗✗ Connection error:', error);
      console.error('[SOCKET] Error message:', error.message);
    });

    socket.value.on('room-updated', (data: { players: Player[]; gameState: GameState }) => {
      console.log('[SOCKET] ✓ Room updated:', data);
      roomPlayers.value = data.players;
      gameState.value = data.gameState;
    });

    socket.value.on('game-state-updated', (data: { gameState: GameState }) => {
      console.log('[SOCKET] ✓ Game state updated:', data);
      gameState.value = data.gameState;
    });

    socket.value.on('error', (data: { message: string; details?: string }) => {
      console.error('[SOCKET] ✗ Server error:', data.message);
      if (data.details) console.error('[SOCKET] Details:', data.details);
    });

    // Log all events for debugging
    socket.value.onAny((eventName, ...args) => {
      console.log(`[SOCKET] Event "${eventName}":`, args);
    });
  };

  const disconnect = () => {
    if (socket.value) {
      console.log('[SOCKET] Disconnecting...');
      socket.value.disconnect();
      socket.value = null;
      isConnected.value = false;
    }
  };

  const joinRoom = (roomCode: string, playerId: string, playerName: string) => {
    if (!socket.value?.connected) {
      console.error('[SOCKET] ✗ Cannot join room: Not connected');
      return;
    }

    console.log(`[SOCKET] >>> Emitting join-room: ${roomCode} as ${playerName}`);
    socket.value.emit('join-room', { roomCode, playerId, playerName });
  };

  const leaveRoom = (roomCode: string, playerId: string) => {
    if (!socket.value?.connected) {
      console.error('[SOCKET] ✗ Cannot leave room: Not connected');
      return;
    }

    console.log(`[SOCKET] >>> Emitting leave-room: ${roomCode}`);
    socket.value.emit('leave-room', { roomCode, playerId });
  };

  const updateGameState = (roomCode: string, newGameState: Partial<GameState>) => {
    if (!socket.value?.connected) {
      console.error('[SOCKET] ✗ Cannot update: Not connected');
      return;
    }

    console.log(`[SOCKET] >>> Emitting update-game-state: ${roomCode}`);
    socket.value.emit('update-game-state', { roomCode, gameState: newGameState });
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    socket,
    isConnected,
    roomPlayers,
    gameState,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    updateGameState
  };
}