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
    const socketUrl = config.public.apiBase || 'http://localhost:3000';
    
    console.log(`[SOCKET] Connecting to ${socketUrl}...`);
    socket.value = io(socketUrl, {
      transports: ['websocket', 'polling']
    });

    socket.value.on('connect', () => {
      console.log('[SOCKET] ✓ Connected');
      isConnected.value = true;
    });

    socket.value.on('disconnect', () => {
      console.log('[SOCKET] ✗ Disconnected');
      isConnected.value = false;
    });

    socket.value.on('room-updated', (data: { players: Player[]; gameState: GameState }) => {
      console.log('[SOCKET] Room updated:', data);
      roomPlayers.value = data.players;
      gameState.value = data.gameState;
    });

    socket.value.on('game-state-updated', (data: { gameState: GameState }) => {
      console.log('[SOCKET] Game state updated:', data);
      gameState.value = data.gameState;
    });

    socket.value.on('error', (data: { message: string }) => {
      console.error('[SOCKET] Error:', data.message);
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
      console.error('[SOCKET] Not connected');
      return;
    }

    console.log(`[SOCKET] Joining room ${roomCode} as ${playerName}`);
    socket.value.emit('join-room', { roomCode, playerId, playerName });
  };

  const leaveRoom = (roomCode: string, playerId: string) => {
    if (!socket.value?.connected) {
      console.error('[SOCKET] Not connected');
      return;
    }

    console.log(`[SOCKET] Leaving room ${roomCode}`);
    socket.value.emit('leave-room', { roomCode, playerId });
  };

  const updateGameState = (roomCode: string, newGameState: Partial<GameState>) => {
    if (!socket.value?.connected) {
      console.error('[SOCKET] Not connected');
      return;
    }

    console.log(`[SOCKET] Updating game state for room ${roomCode}`);
    socket.value.emit('update-game-state', { roomCode, gameState: newGameState });
  };

  // Cleanup on unmount
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

