<template>
  <ClickSpark>
    <div>
      <!-- Confirmation Modal -->
      <ConfirmModal
        :show="showExitConfirm"
        title="Exit Game?"
        message="Are you sure you want to exit? Your current game progress will be lost."
        confirm-text="Exit"
        @confirm="confirmExit"
        @cancel="showExitConfirm = false"
      />

      <ConfirmModal
        :show="showResetConfirm"
        title="Reset Game?"
        message="Are you sure you want to reset the game? Your current game progress will be reset."
        confirm-text="Reset"
        @confirm="confirmResetGame"
        @cancel="showResetConfirm = false"
      />

      <ConfirmModal
        :show="showSkipConfirm"
        title="Skip Turn?"
        message="Are you sure you want to skip your turn?"
        confirm-text="Skip"
        @confirm="confirmSkipTurn"
        @cancel="showSkipConfirm = false"
      />

      <!-- Main Menu -->
      <ScrabbleMainMenu
        v-if="gameState === 'menu'"
        :mongo-available="mongoAvailable"
        :dictionary-size="dictionarySize"
        :message="statusMessage"
        @local-setup="startLocalSetup"
        @online-setup="startOnlineSetup"
      />

      <!-- Setup Screen -->
      <ScrabbleGameSetup
        v-else-if="gameState === 'setup'"
        :is-online="isOnlineMode"
        :room-code="roomCode"
        :is-creating="isCreatingRoom"
        :players="game.players.value"
        :message="statusMessage"
        :lobby-player-count="socket.roomPlayers.value.length"
        :lobby-players="socket.roomPlayers.value"
        :is-host="isHost"
        :local-player-id="currentPlayerId"
        @create-room="createRoom"
        @join-room="joinRoom"
        @copy-code="copyRoomCode"
        @add-player="addPlayer"
        @remove-player="removePlayer"
        @update-player="updatePlayerName"
        @update-local-name="updateLocalName"
        @start-game="startGame"
        @back="backToMenu"
      />

      <!-- Game Board -->
      <ScrabbleGameBoard
        v-else-if="gameState === 'playing'"
        :current-player-index="game.currentPlayerIndex.value"
        :players="game.players.value"
        :board="game.board.value"
        :selected-tile-index="game.selectedTileIndex.value"
        :temp-positions="game.tempPositions.value"
        :game-letterbag="game.letterBag.value"
        :current-round="game.currentRound.value"
        :is-validating="isValidating"
        :message="statusMessage"
        :is-online="isOnlineMode"
        :local-player-id="currentPlayerId"
        :cell-class="getCellClass"
        @submit-turn="submitTurn"
        @skip-turn="skipTurn"
        @clear-letters="handleClearLetters"
        @draw-tile="drawTileForCurrentPlayer"
        @select-tile="selectTile"
        @cell-click="handleCellClick"
        @reset="resetGame"
        @home="handleHomeClick"
      />
    </div>
  </ClickSpark>
</template>

<script setup lang="ts">
import type { ScrabbleGameState, ScrabblePlayer, ScrabbleTile } from '../../../types/scrabble';
import type { GameState } from '../../../types/game';
import type { WordValidationResponse } from '../../../types/game';
import type { DefaultServerStatus } from '../../../types/index';

// Access shared header state
const hideHeader = useState('hideHeader', () => false);

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
const showResetConfirm = ref(false);
const showSkipConfirm = ref(false);

const game = useScrabble();
const validation = useWordValidation();
const socket = useSocket();
const currentPlayerId = ref('');
const hostId = ref<string | null>(null);

// Generate ID safely on client-side to prevent Nuxt SSR hydration mismatches
onMounted(() => {
  if (!currentPlayerId.value) {
    currentPlayerId.value = 'player_' + Date.now() + Math.random().toString(36).substring(2, 9);
    console.log(`[DEBUG] Generated player ID: ${currentPlayerId.value}`);
  }
});

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

const handleKeyPress = (e: KeyboardEvent) => {
  if (gameState.value !== 'playing' || !game.selectedCell.value) return;

  const key = e.key.toUpperCase();

  // State is broadcasted on letter addition or removal
  if (key === 'ARROWUP' || key === 'ARROWDOWN' || key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
    e.preventDefault();
    moveSelection(key);
  } else if (key === 'BACKSPACE') {
    e.preventDefault();
    game.removeLetterAtPosition(game.selectedCell.value);
    broadcastGameState();
  } else if (key.length === 1 && key.match(/[A-Z]/)) {
    e.preventDefault();
    game.placeLetterFromKeyboard(key, game.selectedCell.value);
    broadcastGameState();
  }
};

// Keyboard controls
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
})

// Reset header state when leaving the component
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
  hideHeader.value = false;
});

// Helper to broadcast state instantly
const broadcastGameState = () => {
  if (isOnlineMode.value && roomCode.value) {
    const newGameState = {
      status: 'playing',
      board: game.board.value,
      currentPlayerIndex: game.currentPlayerIndex.value,
      currentRound: game.currentRound.value,
      usedWords: game.usedWords.value
    } as Partial<GameState>;

    const players = game.players.value.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      isLocal: p.isLocal,
      tiles: p.tiles // Sending tiles for all players, server can choose to ignore non-current player's tiles if desired
    })) as ScrabblePlayer[];
    const hostLetterBag = (isHost && game.letterBag.value) ? game.letterBag.value as ScrabbleTile[] : undefined;

    socket.updateGameState(roomCode.value, newGameState, players, hostLetterBag);
  }
};

// Handle explicit clears
const handleClearLetters = () => {
  game.clearTempLetters();
  broadcastGameState();
};

// Watch game state to hide header when playing
watch(gameState, (newState) => {
  hideHeader.value = newState === 'playing';
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

  // Connect to WebSocket
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
  if (game.players.value.length >= 4) {
    statusMessage.value = 'Maximum 4 players allowed';
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
  if (isOnlineMode.value && roomCode.value) {
    const player = socket.roomPlayers.value[index];
    if (player) {
      socket.updatePlayer(roomCode.value, player.id, name);
    }
  } else {
    game.players.value[index]!.name = name;
  }
  console.log(`[SCRABBLE] Updated: ${name}`);
};

const updateLocalName = (name: string) => {
  if (isOnlineMode.value && roomCode.value) {
    socket.updatePlayer(roomCode.value, currentPlayerId.value, name);
  } else {
    game.players.value[0]!.name = name;
  }
};

const startGame = () => {
  console.log('[SCRABBLE] Starting game');
  game.initializeBoard();
  game.initializeLetterBag();

  // Load online players into game instance properly, 
  // roomPlayers is for player initialization, then we trust scrabblePlayers for reliable tile data
  if (isOnlineMode.value && socket.roomPlayers.value.length > 0) {
    game.players.value = socket.roomPlayers.value.map(p => ({
      ...p,
      score: 0,
      tiles: []
    })) as ScrabblePlayer[];
  }

  // Draw 7 tiles for each player
  game.players.value.forEach((_, index) => {
    game.drawTilesForPlayer(index, 7);
  });

  gameState.value = 'playing';

  // Issue the layout and player info to non-hosts
  broadcastGameState();
};

// Monitor the server explicitly for updates (sync state mapping)
watch(() => socket.gameState.value, (newState) => {
  if (isOnlineMode.value && newState) {
    if (newState.status === 'playing') {
      if (gameState.value !== 'playing') {
        gameState.value = 'playing'; // Change screens for non-hosts
        // Force initialize non-host players array properly (Removing this causes player array to be empty!)
        if (game.players.value.length <= 1) {
          // Don't initialize empty tiles here, server sets it
          game.players.value = socket.scrabblePlayers.value.map(p => ({ 
            ...p,
          })) as ScrabblePlayer[];
        }
      }

      // Sync incoming items
      if (newState.board) game.board.value = newState.board as ScrabbleGameState['board'];

      // Trust the server state completely. Avoid complex conditional merging
      if (socket.scrabblePlayers.value?.length > 0) {
        game.players.value = socket.scrabblePlayers.value.map(inc => {
          const existing = game.players.value.find(p => p.id === inc.id);
          return {
            ...existing,
            ...inc,
            score: inc.score ?? existing?.score ?? 0,
            tiles: (inc.tiles && inc.tiles.length > 0) ? inc.tiles : (existing?.tiles || [])
          } as ScrabblePlayer;
        });
        console.log('[DEBUG] ✓ Synced players from server:', game.players.value);
      }

      // Only update letter bag if server provides it (prevents overwriting host's bag with empty bag on join)
      if (socket.letterBag.value) {
        game.letterBag.value = socket.letterBag.value as ScrabbleGameState['letterBag'];
        console.log('[DEBUG] ✓ Synced letter bag from server:', game.letterBag.value.length, 'tiles');
      }

      // Prevent undefined properties from destroying local refs
      // Undefined check for numeric values to allow zero scores and rounds
      if (newState.currentPlayerIndex !== undefined) game.currentPlayerIndex.value = newState.currentPlayerIndex as ScrabbleGameState['currentPlayerIndex'];
      if (newState.currentRound !== undefined) game.currentRound.value = newState.currentRound as ScrabbleGameState['currentRound'];
      if (newState.usedWords) game.usedWords.value = newState.usedWords as ScrabbleGameState['usedWords'];
    }
  }
}, { deep: true });

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
  // Prevent placing if it's not the user's turn
  if (isOnlineMode.value && game.players.value[game.currentPlayerIndex.value]?.id !== currentPlayerId.value) return;

  console.log(`[SCRABBLE] Cell clicked: [${row}, ${col}]`);
  game.selectedCell.value = { row, col };

  // If a tile is selected, place it
  if (game.selectedTileIndex.value !== null) {
    game.placeTile(game.selectedTileIndex.value, { row, col });
    broadcastGameState();
  }
};

const selectTile = (index: number) => {
  console.log(`[SCRABBLE] Tile selected: ${index}`);
  game.selectedTileIndex.value = index;
};

const drawTileForCurrentPlayer = () => {
  const player = currentPlayer.value;
  if (!player) return;

  // Enforce server-side matching turn
  if (isOnlineMode.value && player.id !== currentPlayerId.value) {
    statusMessage.value = "It's not your turn!";
    setTimeout(() => statusMessage.value = '', 2000);
    return;
  }

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
  statusMessage.value = `Player ${player?.name || game?.currentPlayerIndex || ''} drew a tile!`;
  broadcastGameState();
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

    statusMessage.value = `+${score} points for "${result.longestValid}"!`;

    // Next player
    game.currentPlayerIndex.value = (game.currentPlayerIndex.value + 1) % game.players.value.length;

    if (game.currentPlayerIndex.value === 0) {
      game.currentRound.value++;
    }

    broadcastGameState();

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
  if (gameState.value === 'playing') {
    showResetConfirm.value = true;
  } else {
    confirmResetGame();
  }
}

const confirmResetGame = () => {
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
  showResetConfirm.value = false;
};

const skipTurn = () => {
  showSkipConfirm.value = true;
};

const confirmSkipTurn = () => {
  console.log('[SCRABBLE] Skipping turn');
  game.currentPlayerIndex.value = (game.currentPlayerIndex.value + 1) % game.players.value.length;

  if (game.currentPlayerIndex.value === 0) {
    game.currentRound.value++;
  }

  broadcastGameState();
  showSkipConfirm.value = false;
};
</script>
