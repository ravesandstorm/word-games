<template>
  <div class="min-h-screen bg-gradient-to-br from-green-900 via-teal-900 to-blue-900">
    <!-- Confirmation Modal -->
    <ConfirmModal
      :show="showExitConfirm"
      title="Exit Game?"
      message="Are you sure you want to exit? Your current game progress will be lost."
      confirm-text="Exit"
      @confirm="confirmExit"
      @cancel="showExitConfirm = false"
    />

    <!-- Main Menu -->
    <div v-if="gameState === 'menu'" class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <h1 class="text-4xl font-bold text-white mb-8 text-center">Scrabble</h1>

        <div class="space-y-4">
          <button
            @click="startLocalSetup"
            class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Local Multiplayer (Max 3)
          </button>

          <button
            @click="startOnlineSetup"
            :disabled="!mongoAvailable"
            :class="[
              'w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all',
              mongoAvailable
                ? 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                : 'bg-gray-500 cursor-not-allowed text-gray-300'
            ]"
          >
            <svg v-if="mongoAvailable" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
            Online Multiplayer {{ !mongoAvailable ? '(Disabled)' : '' }}
          </button>
          <button
            @click="handleHomeClick"
            class="w-full bg-purple-500/80 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </button>
        </div>

        <p v-if="statusMessage" class="mt-4 text-yellow-300 text-center">{{ statusMessage }}</p>
        <p class="mt-6 text-gray-300 text-sm text-center">
          Dictionary: {{ dictionarySize }} words loaded
        </p>
      </div>
    </div>

    <!-- Setup Screen -->
    <div v-else-if="gameState === 'setup'" class="min-h-screen flex items-center justify-center p-4">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
        <h2 class="text-3xl font-bold text-white mb-6">Game Setup</h2>

        <!-- Online Room Section -->
        <div v-if="isOnlineMode && !roomCode" class="mb-6 space-y-4">
          <button
            @click="createRoom"
            :disabled="isCreatingRoom"
            class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl"
          >
            Create Room
          </button>

          <div class="flex gap-2">
            <input
              v-model="joinCode"
              type="text"
              placeholder="Enter room code"
              class="flex-1 bg-white/20 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
              maxlength="6"
              @input="joinCode = joinCode.toUpperCase()"
            />
            <button
              @click="joinRoom(joinCode)"
              :disabled="!joinCode"
              class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg"
            >
              Join
            </button>
          </div>
        </div>

        <!-- Room Code Display -->
        <div v-if="isOnlineMode && roomCode" class="mb-6 bg-purple-500/30 rounded-xl p-4">
          <p class="text-white font-semibold mb-2">Room Code:</p>
          <div class="flex gap-2 mb-3">
            <div class="flex-1 bg-white/20 text-white rounded-lg px-4 py-3 text-xl font-mono font-bold text-center">
              {{ roomCode }}
            </div>
            <button
              @click="copyRoomCode"
              class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Copy
            </button>
          </div>

          <div class="bg-white/10 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <span class="text-white font-semibold">Players in Lobby:</span>
              <span class="text-green-400 font-bold text-lg">{{ socket.roomPlayers.value.length }}</span>
            </div>
          </div>
        </div>

        <!-- Players List -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <label class="text-white font-semibold">Players (Max 3)</label>
            <button
              v-if="!isOnlineMode && game.players.value.length < 3"
              @click="addPlayer"
              :disabled="!isHost"
              :class="[
                'text-white rounded-lg px-3 py-1',
                !isHost ? 'bg-green-500/50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
              ]"
            >
              Add Player
            </button>
          </div>

          <div class="space-y-2">
            <div v-for="(player, index) in game.players.value" :key="index" class="flex gap-2">
              <input
                :value="player.name"
                @input="updatePlayerName(index, ($event.target as HTMLInputElement).value)"
                type="text"
                :disabled="!isHost"
                :class="[
                  'flex-1 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400',
                  !isHost ? 'bg-white/10 cursor-not-allowed' : 'bg-white/20'
                ]"
              />
              <button
                v-if="!isOnlineMode && game.players.value.length > 1"
                @click="removePlayer(index)"
                :disabled="!isHost"
                :class="[
                  'text-white rounded-lg px-3 py-2',
                  !isHost ? 'bg-red-500/50 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                ]"
              >
                Remove
              </button>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button
            @click="backToMenu"
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl"
          >
            Back
          </button>
          <button
            @click="startGame"
            :disabled="!isHost"
            :class="[
              'flex-1 text-white font-bold py-3 rounded-xl',
              !isHost ? 'bg-green-500/50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
            ]"
          >
            {{ !isHost ? 'Waiting for Host...' : 'Start Game' }}
          </button>
        </div>

        <p v-if="statusMessage" class="mt-4 text-yellow-300 font-semibold text-center">{{ statusMessage }}</p>
      </div>
    </div>

    <!-- Game Board -->
    <div v-else-if="gameState === 'playing'" class="p-4">
      <div class="max-w-7xl mx-auto">
        <!-- Game Header -->
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <button
                @click="handleHomeClick"
                class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                ← Home
              </button>
              <div>
                <h2 class="text-2xl font-bold text-white">Round {{ game.currentRound.value }}</h2>
                <p class="text-yellow-300 font-semibold text-lg">
                  {{ currentPlayer?.name }}'s Turn
                </p>
              </div>
            </div>
            <button
              @click="resetGame"
              class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
            >
              Reset
            </button>
          </div>

          <!-- Player Scores -->
          <div class="mt-4 grid grid-cols-3 gap-4">
            <div
              v-for="(player, index) in game.players.value"
              :key="index"
              :class="[
                'bg-white/10 rounded-lg p-3',
                index === game.currentPlayerIndex.value ? 'ring-2 ring-yellow-400' : ''
              ]"
            >
              <p class="text-white font-semibold">{{ player.name }}</p>
              <p class="text-green-400 text-2xl font-bold">{{ player.score }}</p>
              <p class="text-gray-300 text-sm">{{ player.tiles.length }} tiles</p>
            </div>
          </div>
        </div>

        <!-- Board and Tiles Container -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <!-- Scrabble Board -->
          <div class="lg:col-span-3">
            <div class="bg-gray-800 p-2 rounded-lg shadow-2xl inline-block">
              <div
                :style="{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(15, 1fr)',
                  gap: '2px'
                }"
              >
                <div
                  v-for="(cell, index) in flatBoard"
                  :key="index"
                  @click="handleCellClick(Math.floor(index / 15), index % 15)"
                  :class="getCellClass(cell, Math.floor(index / 15), index % 15)"
                >
                  <span v-if="cell.letter" class="text-sm font-bold">{{ cell.letter }}</span>
                  <span v-else-if="cell.multiplier" class="text-xs font-semibold">{{ cell.multiplier }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Player Tiles -->
          <div class="lg:col-span-1">
            <div class="bg-white/10 backdrop-blur-lg rounded-xl p-4">
              <h3 class="text-white font-bold mb-3">Your Tiles</h3>
              <div class="grid grid-cols-4 gap-2 mb-4">
                <div
                  v-for="(tile, index) in currentPlayer?.tiles"
                  :key="index"
                  @click="selectTile(index)"
                  :class="[
                    'aspect-square bg-yellow-100 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all',
                    game.selectedTileIndex.value === index ? 'ring-2 ring-blue-400 scale-110' : 'hover:scale-105'
                  ]"
                >
                  <span class="text-xl font-bold text-gray-900">{{ tile.letter || '?' }}</span>
                  <span class="text-xs text-gray-600">{{ tile.score }}</span>
                </div>
              </div>

              <button
                @click="drawTileForCurrentPlayer"
                :disabled="(currentPlayer && currentPlayer.tiles.length >= 7) || game.tempPositions.value.length > 0"
                class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-bold py-2 rounded-lg mb-2"
              >
                Draw Tile ({{ game.letterBag.value.length }} left)
              </button>

              <button
                @click="game.clearTempLetters()"
                class="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 rounded-lg mb-2"
              >
                Clear
              </button>

              <button
                @click="submitTurn"
                :disabled="isValidating || game.tempPositions.value.length === 0"
                class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-2 rounded-lg"
              >
                Submit Turn
              </button>

              <p v-if="statusMessage" class="mt-3 text-yellow-300 text-sm text-center">{{ statusMessage }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScrabblePlayer } from '../../../types/scrabble';
import type { WordValidationResponse } from '../../../types/game';
import type { DefaultServerStatus } from '../../../types/index';

const gameState = ref<'menu' | 'setup' | 'playing'>('menu');
const isOnlineMode = ref(false);
const mongoAvailable = ref(false);
const dictionarySize = ref(0);
const roomCode = ref('');
const isCreatingRoom = ref(false);
const statusMessage = ref('');
const isValidating = ref(false);
const joinCode = ref('');
const showExitConfirm = ref(false);

const game = useScrabble();
const validation = useWordValidation();
const socket = useSocket();
const currentPlayerId = ref('player-' + Date.now());
const hostId = ref<string | null>(null);

// Computed property to check if current player is host
const isHost = computed(() => {
  if (!isOnlineMode.value || !roomCode.value) return true; // Local mode, always host
  return hostId.value === currentPlayerId.value;
});

// Check server status on mount
onMounted(async () => {
  console.log('[SCRABBLE] Component mounted, checking server status...');
  try {
    const status = await $fetch('/api/status', { params: { origin: 'scrabble' } }) as DefaultServerStatus;
    mongoAvailable.value = status.mongoAvailable;
    dictionarySize.value = status.dictionarySize;
    console.log('[SCRABBLE] ✓ Server status:', status);
  } catch (err) {
    console.error('[SCRABBLE] ✗ Failed to connect to server:', err);
    mongoAvailable.value = false;
  }
});

// Keyboard controls
onMounted(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (gameState.value !== 'playing' || !game.selectedCell.value) return;

    const key = e.key.toUpperCase();

    if (key === 'ARROWUP' || key === 'ARROWDOWN' || key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
      e.preventDefault();
      moveSelection(key);
    } else if (key === 'BACKSPACE') {
      e.preventDefault();
      game.removeLetterAtPosition(game.selectedCell.value);
    } else if (key.length === 1 && key.match(/[A-Z]/)) {
      e.preventDefault();
      game.placeLetterFromKeyboard(key, game.selectedCell.value);
    }
  };

  window.addEventListener('keydown', handleKeyPress);

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress);
  });
});

const moveSelection = (direction: string) => {
  if (!game.selectedCell.value) return;

  let newRow = game.selectedCell.value.row;
  let newCol = game.selectedCell.value.col;

  switch (direction) {
    case 'ARROWUP': newRow = Math.max(0, newRow - 1); break;
    case 'ARROWDOWN': newRow = Math.min(14, newRow + 1); break;
    case 'ARROWLEFT': newCol = Math.max(0, newCol - 1); break;
    case 'ARROWRIGHT': newCol = Math.min(14, newCol + 1); break;
  }

  game.selectedCell.value = { row: newRow, col: newCol };
};

const currentPlayer = computed(() => game.players.value[game.currentPlayerIndex.value] as ScrabblePlayer | undefined);

const flatBoard = computed(() => game.board.value.flat());

const getCellClass = (cell: any, row: number, col: number) => {
  const classes = [
    'w-10 h-10 flex items-center justify-center text-xs cursor-pointer border transition-all'
  ];

  if (cell.isPermanent) {
    classes.push('bg-yellow-100 text-gray-900 border-yellow-300 font-bold');
  } else if (cell.isTemp) {
    classes.push('bg-orange-200 text-gray-900 border-orange-400 font-bold');
  } else {
    // Multiplier colors
    if (cell.multiplier === 'TW') classes.push('bg-red-600 text-white');
    else if (cell.multiplier === 'DW') classes.push('bg-pink-500 text-white');
    else if (cell.multiplier === 'TL') classes.push('bg-blue-600 text-white');
    else if (cell.multiplier === 'DL') classes.push('bg-cyan-500 text-white');
    else if (cell.multiplier === 'STAR') classes.push('bg-pink-500 text-white');
    else classes.push('bg-green-100 text-gray-600');
  }

  if (game.selectedCell.value?.row === row && game.selectedCell.value?.col === col) {
    classes.push('ring-2 ring-yellow-400 scale-110');
  }

  return classes.join(' ');
};

const startLocalSetup = () => {
  console.log('[SCRABBLE] Starting local game setup');
  isOnlineMode.value = false;
  gameState.value = 'setup';
};

const startOnlineSetup = () => {
  console.log('[SCRABBLE] Starting online game setup');
  if (!mongoAvailable.value) {
    statusMessage.value = 'MongoDB not available';
    return;
  }
  isOnlineMode.value = true;
  gameState.value = 'setup';
  socket.connect();
};

const createRoom = async () => {
  console.log('[SCRABBLE] Creating room...');
  isCreatingRoom.value = true;

  try {
    const result = await $fetch('/api/rooms/create', {
      method: 'POST',
      body: {
        hostId: currentPlayerId.value,
        hostName: game.players.value[0]!.name,
        gameSettings: { gameType: 'scrabble' }
      }
    });

    roomCode.value = result.roomCode;
    hostId.value = currentPlayerId.value; // Set as host
    statusMessage.value = `Room created: ${result.roomCode}`;
    console.log(`[SCRABBLE] ✓ Created: ${result.roomCode}`);

    socket.joinRoom(result.roomCode, currentPlayerId.value, game.players.value[0]!.name);
  } catch (err) {
    console.error('[SCRABBLE] ✗ Creation failed:', err);
    statusMessage.value = 'Failed to create room';
  } finally {
    isCreatingRoom.value = false;
  }
};

const joinRoom = async (code: string) => {
  console.log(`[SCRABBLE] Joining: ${code}`);

  try {
    await $fetch('/api/rooms/join', {
      method: 'POST',
      body: { roomCode: code }
    });

    roomCode.value = code;
    statusMessage.value = `Joined room: ${code}`;
    console.log(`[SCRABBLE] ✓ Joined: ${code}`);

    socket.joinRoom(code, currentPlayerId.value, game.players.value[0]!.name);
  } catch (err) {
    console.error('[SCRABBLE] ✗ Join failed:', err);
    statusMessage.value = 'Room not found';
  }
};

const copyRoomCode = () => {
  if (roomCode.value) {
    navigator.clipboard.writeText(roomCode.value);
    statusMessage.value = 'Room code copied!';
    setTimeout(() => statusMessage.value = '', 2000);
  }
};

const addPlayer = () => {
  if (game.players.value.length >= 3) {
    statusMessage.value = 'Maximum 3 players allowed';
    return;
  }
  const newId = `local-${game.players.value.length + 1}`;
  const newName = `Player ${game.players.value.length + 1}`;
  game.players.value.push({ id: newId, name: newName, score: 0, isLocal: true, tiles: [] });
  console.log(`[SCRABBLE] Added: ${newName}`);
};

const removePlayer = (index: number) => {
  if (game.players.value.length > 1) {
    console.log(`[SCRABBLE] Removed: ${game.players.value[index]!.name}`);
    game.players.value.splice(index, 1);
  }
};

const updatePlayerName = (index: number, name: string) => {
  game.players.value[index]!.name = name;
  console.log(`[SCRABBLE] Updated: ${name}`);
};

const startGame = () => {
  console.log('[SCRABBLE] Starting game');
  game.initializeBoard();
  game.initializeLetterBag();

  // Draw 7 tiles for each player
  game.players.value.forEach((_, index) => {
    game.drawTilesForPlayer(index, 7);
  });

  gameState.value = 'playing';
};

const backToMenu = () => {
  console.log('[SCRABBLE] Back to menu');

  if (isOnlineMode.value && roomCode.value) {
    socket.leaveRoom(roomCode.value, currentPlayerId.value);
    socket.disconnect();
  }

  gameState.value = 'menu';
  roomCode.value = '';
  statusMessage.value = '';
};

// Handle home button click
const handleHomeClick = () => {
  // Show confirmation if game is in progress
  if (gameState.value === 'playing') {
    showExitConfirm.value = true;
  } else {
    navigateTo('/');
  }
};

// Confirm exit
const confirmExit = () => {
  showExitConfirm.value = false;
  if (isOnlineMode.value && roomCode.value) {
    socket.leaveRoom(roomCode.value, currentPlayerId.value);
    socket.disconnect();
  }
  navigateTo('/');
};

const handleCellClick = (row: number, col: number) => {
  console.log(`[SCRABBLE] Cell clicked: [${row}, ${col}]`);
  game.selectedCell.value = { row, col };

  // If a tile is selected, place it
  if (game.selectedTileIndex.value !== null) {
    game.placeTile(game.selectedTileIndex.value, { row, col });
  }
};

const selectTile = (index: number) => {
  console.log(`[SCRABBLE] Tile selected: ${index}`);
  game.selectedTileIndex.value = index;
};

const drawTileForCurrentPlayer = () => {
  const player = currentPlayer.value;
  if (!player) return;

  if (game.tempPositions.value.length > 0) {
    statusMessage.value = 'Submit your turn before drawing more tiles!';
    setTimeout(() => statusMessage.value = '', 2000);
    return;
  }

  if (player.tiles.length >= 7) {
    statusMessage.value = 'You already have 7 tiles!';
    setTimeout(() => statusMessage.value = '', 2000);
    return;
  }

  game.drawTilesForPlayer(game.currentPlayerIndex.value, 1);
  statusMessage.value = 'Drew a tile!';
  setTimeout(() => statusMessage.value = '', 2000);
};

const submitTurn = async () => {
  if (game.tempPositions.value.length === 0) {
    console.log('[SCRABBLE] No tiles placed');
    statusMessage.value = 'Place at least one tile!';
    return;
  }

  console.log('[SCRABBLE] ========== SUBMITTING TURN ==========');
  isValidating.value = true;
  statusMessage.value = 'Validating words...';

  try {
    // Check if this is the first word (no permanent letters on board)
    const hasPermanentLetters = game.board.value.some(row =>
      row.some(cell => cell.isPermanent)
    );
    const isFirstWord = !hasPermanentLetters;

    // Extract all possible words from board
    const words = validation.extractWordsFromBoard(game.board.value, game.tempPositions.value, isFirstWord);

    if (words.length === 0) {
      console.log('[SCRABBLE] ✗ No valid word sequences found');
      statusMessage.value = 'No valid words formed!';
      isValidating.value = false;
      return;
    }

    console.log(`[SCRABBLE] Validating ${words.length} word combinations...`);

    // Validate all words at once
    const result = await validation.validateWordsOnServer(words, game.usedWords.value) as WordValidationResponse;

    if (!result.longestValid) {
      console.log('[SCRABBLE] ✗ No valid words found');
      statusMessage.value = 'No valid words!';
      isValidating.value = false;
      return;
    }

    // Calculate score with multipliers
    const score = game.calculateWordScore(game.tempPositions.value);

    console.log(`[SCRABBLE] ✓ Scoring: ${score} points`);

    // Add score
    game.players.value[game.currentPlayerIndex.value]!.score += score;

    // Mark words as used
    result.validWords.forEach(w => {
      if (w.isValid) {
        game.usedWords.value.push(w.word.toUpperCase());
      }
    });

    // Commit letters to board
    game.commitTempLetters();

    // Draw tiles to refill hand
    const tilesUsed = game.tempPositions.value.length;
    game.drawTilesForPlayer(game.currentPlayerIndex.value, tilesUsed);

    statusMessage.value = `+${score} points!`;

    // Next player
    game.currentPlayerIndex.value = (game.currentPlayerIndex.value + 1) % game.players.value.length;

    if (game.currentPlayerIndex.value === 0) {
      game.currentRound.value++;
    }

    console.log('[SCRABBLE] ========== TURN COMPLETE ==========');

    setTimeout(() => statusMessage.value = '', 5000);
  } catch (err) {
    console.error('[SCRABBLE] ✗ Validation error:', err);
    statusMessage.value = 'Error validating words';
  } finally {
    isValidating.value = false;
  }
};

const resetGame = () => {
  console.log('[SCRABBLE] Resetting game');
  gameState.value = 'menu';
  roomCode.value = '';
  statusMessage.value = '';
  game.board.value = [];
  game.currentRound.value = 1;
  game.currentPlayerIndex.value = 0;
  game.usedWords.value = [];
  game.players.value.forEach((p: ScrabblePlayer) => {
    p.score = 0;
    p.tiles = [];
  });
};
</script>
