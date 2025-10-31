<template>
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

    <MainMenu
      v-if="gameState === 'menu'"
      :mongo-available="mongoAvailable"
      :dictionary-size="dictionarySize"
      :message="statusMessage"
      @local-game="startLocalSetup"
      @online-game="startOnlineSetup"
    />
    
    <GameSetup
      v-else-if="gameState === 'setup'"
      :is-online="isOnlineMode"
      :room-code="roomCode"
      :is-creating="isCreatingRoom"
      :players="game.players.value"
      :message="statusMessage"
      :lobby-player-count="socket.roomPlayers.value.length"
      :lobby-players="socket.roomPlayers.value"
      :is-host="isHost"
      @create-room="createRoom"
      @join-room="joinRoom"
      @copy-code="copyRoomCode"
      @add-player="addPlayer"
      @remove-player="removePlayer"
      @update-player="updatePlayerName"
      @start-game="startGame"
      @back="backToMenu"
    />
    
    <GameBoard
      v-else-if="gameState === 'playing'"
      :board="game.board.value"
      :players="game.players.value"
      :current-player-index="game.currentPlayerIndex.value"
      :current-round="game.currentRound.value"
      :selected-cell="game.selectedCell.value"
      :letters-placed="game.lettersPlaced.value"
      :current-limit="currentLetterLimit"
      :is-validating="isValidating"
      :message="statusMessage"
      :room-code="roomCode"
      :board-size="boardSize"
      :used-words-count="game.usedWords.value.length"
      :dictionary-size="dictionarySize"
      @cell-click="handleCellClick"
      @clear-letters="game.clearTempLetters"
      @submit-turn="submitTurn"
      @reset="resetGame"
      @home="handleHomeClick"
    />
  </div>
</template>

<script setup lang="ts">
import type { Player, Position, WordValidationResponse } from '../../../types/game';
import type { DefaultServerStatus } from '../../../types/index';

const gameState = ref<'menu' | 'setup' | 'playing'>('menu');
const isOnlineMode = ref(false);
const mongoAvailable = ref(false);
const dictionarySize = ref(0);
const roomCode = ref('');
const isCreatingRoom = ref(false);
const statusMessage = ref('');
const isValidating = ref(false);
const showExitConfirm = ref(false);

const boardSize = ref(15);
const maxLettersPerTurn = ref(3);
const roundsPerIncrement = ref(6);

const game = useGame();
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
  console.log('[APP] Component mounted, checking server status...');
  try {
    const status = await $fetch('/api/status', { params: { origin: 'wordchain' } }) as DefaultServerStatus;
    mongoAvailable.value = status.mongoAvailable;
    dictionarySize.value = status.dictionarySize;
    console.log('[APP] ✓ Server status:', status); 
  } catch (err) {
    console.error('[APP] ✗ Failed to connect to server:', err);
    mongoAvailable.value = false;
  }
});

// Keyboard controls
onMounted(() => {
  window.addEventListener('keydown', handleKeyPress);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyPress);
});

const handleKeyPress = (e: KeyboardEvent) => {
  if (gameState.value !== 'playing' || !game.selectedCell.value) return;

  const key = e.key.toUpperCase();

  if (key === 'ARROWUP' || key === 'ARROWDOWN' || key === 'ARROWLEFT' || key === 'ARROWRIGHT') {
    e.preventDefault();
    console.log(`[INPUT] Arrow key: ${key}`);
    moveSelection(key);
  } else if (key === 'BACKSPACE') {
    e.preventDefault();
    console.log('[INPUT] Backspace');
    removeLetterAtCell();
  } else if (key.length === 1 && key.match(/[A-Z]/)) {
    e.preventDefault();
    console.log(`[INPUT] Letter: ${key}`);
    game.placeLetter(key, currentLetterLimit.value);
  }
};

const currentLetterLimit = computed(() => {
  return Math.floor((game.currentRound.value - 1) / roundsPerIncrement.value) + maxLettersPerTurn.value;
});

const startLocalSetup = () => {
  console.log('[APP] Starting local game setup');
  isOnlineMode.value = false;
  gameState.value = 'setup';
};

const startOnlineSetup = () => {
  console.log('[APP] Starting online game setup');
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
  console.log('[ROOM] Creating room...');
  isCreatingRoom.value = true;

  try {
    const result = await $fetch('/api/rooms/create', {
      method: 'POST',
      body: {
        hostId: currentPlayerId.value,
        hostName: game.players.value[0]!.name,
        gameSettings: {
          boardSize: boardSize.value,
          maxLettersPerTurn: maxLettersPerTurn.value,
          roundsPerIncrement: roundsPerIncrement.value
        }
      }
    });

    roomCode.value = result.roomCode;
    hostId.value = currentPlayerId.value; // Set as host
    statusMessage.value = `Room created: ${result.roomCode}`;
    console.log(`[ROOM] ✓ Created: ${result.roomCode}`);

    // Join the room via WebSocket
    socket.joinRoom(result.roomCode, currentPlayerId.value, game.players.value[0]!.name);
  } catch (err) {
    console.error('[ROOM] ✗ Creation failed:', err);
    statusMessage.value = 'Failed to create room';
  } finally {
    isCreatingRoom.value = false;
  }
};

const joinRoom = async (code: string) => {
  console.log(`[ROOM] Joining: ${code}`);

  try {
    await $fetch('/api/rooms/join', {
      method: 'POST',
      body: { roomCode: code }
    });

    roomCode.value = code;
    statusMessage.value = `Joined room: ${code}`;
    console.log(`[ROOM] ✓ Joined: ${code}`);

    // Join the room via WebSocket
    socket.joinRoom(code, currentPlayerId.value, game.players.value[0]!.name);
  } catch (err) {
    console.error('[ROOM] ✗ Join failed:', err);
    statusMessage.value = 'Room not found';
  }
};

const copyRoomCode = (code: string) => {
  navigator.clipboard.writeText(code);
  statusMessage.value = 'Room code copied!';
  console.log(`[ROOM] Code copied: ${code}`);
  setTimeout(() => statusMessage.value = '', 2000);
};

const addPlayer = () => {
  const newId = `local-${game.players.value.length + 1}`;
  const newName = `Player ${game.players.value.length + 1}`;
  game.players.value.push({ id: newId, name: newName, score: 0, isLocal: true });
  console.log(`[PLAYER] Added: ${newName}`);
};

const removePlayer = (index: number) => {
  if (game.players.value.length > 1) {
    console.log(`[PLAYER] Removed: ${game.players.value[index]!.name}`);
    game.players.value.splice(index, 1);
  }
};

const updatePlayerName = (index: number, name: string) => {
  game.players.value[index]!.name = name;
  console.log(`[PLAYER] Updated: ${name}`);
};

const startGame = (settings: any) => {
  console.log('[GAME] Starting with settings:', settings);
  boardSize.value = settings.boardSize;
  maxLettersPerTurn.value = settings.maxLettersPerTurn;
  roundsPerIncrement.value = settings.roundsPerIncrement;
  
  game.initializeBoard(settings.boardSize);
  gameState.value = 'playing';
};

const backToMenu = () => {
  console.log('[APP] Back to menu');

  // Leave room if in online mode
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
  console.log(`[INPUT] Cell clicked: [${row}, ${col}]`);
  game.selectedCell.value = { row, col };
};

const moveSelection = (direction: string) => {
  if (!game.selectedCell.value) return;

  let newRow = game.selectedCell.value.row;
  let newCol = game.selectedCell.value.col;

  switch (direction) {
    case 'ARROWUP': newRow = Math.max(0, newRow - 1); break;
    case 'ARROWDOWN': newRow = Math.min(boardSize.value - 1, newRow + 1); break;
    case 'ARROWLEFT': newCol = Math.max(0, newCol - 1); break;
    case 'ARROWRIGHT': newCol = Math.min(boardSize.value - 1, newCol + 1); break;
  }

  console.log(`[INPUT] Selection moved to: [${newRow}, ${newCol}]`);
  game.selectedCell.value = { row: newRow, col: newCol };
};

const removeLetterAtCell = () => {
  if (!game.selectedCell.value) return;

  const pos = game.selectedCell.value;
  const cell = game.board.value[pos.row]![pos.col];

  if (!cell!.isTemp) {
    console.log('[INPUT] Cannot remove permanent letter');
    return;
  }

  console.log(`[INPUT] Removing letter at [${pos.row}, ${pos.col}]`);
  game.board.value[pos.row]![pos.col] = { letter: '', isTemp: false, isPermanent: false };
  game.lettersPlaced.value = Math.max(0, game.lettersPlaced.value - 1);
  game.tempPositions.value = game.tempPositions.value.filter(
    (p: Position) => p.row !== pos.row || p.col !== pos.col
  );
};

const submitTurn = async () => {
  if (game.lettersPlaced.value === 0) {
    console.log('[SUBMIT] No letters placed');
    statusMessage.value = 'Place at least one letter!';
    return;
  }

  console.log('[SUBMIT] ========== SUBMITTING TURN ==========');
  isValidating.value = true;
  statusMessage.value = 'Validating words...';

  try {
    // Extract all possible words from board
    const words = validation.extractWordsFromBoard(game.board.value, game.tempPositions.value);

    if (words.length === 0) {
      console.log('[SUBMIT] ✗ No valid word sequences found');
      statusMessage.value = 'No valid words formed! Make sure letters are on same axis and touch existing letters.';
      isValidating.value = false;
      return;
    }

    console.log(`[SUBMIT] Validating ${words.length} word combinations...`);
    
    // Validate all words at once
    const result = await validation.validateWordsOnServer(words, game.usedWords.value) as WordValidationResponse;

    console.log('[SUBMIT] ========== VALIDATION RESULTS ==========');
    result.validWords.forEach((w, i) => {
      const status = !w.isValid && w.alreadyUsed ? 'ALREADY USED ✗' :
                    !w.isValid ? 'INVALID ✗' :
                    i === 0 ? 'VALID ✓ ← LONGEST' :
                    'VALID ✓';
      console.log(`[SUBMIT] ${i + 1}. "${w.word}" (${w.length} letters) ${status}`);
    });
    console.log('[SUBMIT] =======================================');

    if (!result.longestValid) {
      console.log('[SUBMIT] ✗ No valid words found');
      statusMessage.value = 'No valid words! All combinations are either invalid or already used.';
      isValidating.value = false;
      return;
    }

    const longestWord = result.longestValid;
    const longestLength = longestWord.length;

    console.log(`[SUBMIT] ✓ Scoring word: "${longestWord}" (${longestLength} letters)`);

    // Add score
    game.players.value[game.currentPlayerIndex.value]!.score += longestLength;
    console.log(`[SUBMIT] New score: ${game.players.value[game.currentPlayerIndex.value]!.score}`);

    // Mark words as used
    result.validWords.forEach(w => {
      if (w.isValid) {
        game.usedWords.value.push(w.word.toUpperCase());
        console.log(`[SUBMIT] Marked "${w.word}" as used`);
      }
    });
    console.log(`[SUBMIT] Total words used: ${game.usedWords.value.length}`);

    // Commit letters to board
    game.commitTempLetters();

    // Show message with other words found
    const otherValidWords = result.validWords
      .filter(w => w.isValid && w.word !== longestWord)
      .slice(0, 3)
      .map(w => w.word);
    
    const otherWordsText = otherValidWords.length > 0 
      ? ` (also found: ${otherValidWords.join(', ')}${result.validWords.filter(w => w.isValid).length > 4 ? '...' : ''})`
      : '';
    
    statusMessage.value = `+${longestLength} points for "${longestWord}"!${otherWordsText}`;

    // Next player
    game.currentPlayerIndex.value = (game.currentPlayerIndex.value + 1) % game.players.value.length;
    console.log(`[SUBMIT] Next player: ${game.players.value[game.currentPlayerIndex.value]!.name}`);

    if (game.currentPlayerIndex.value === 0) {
      game.currentRound.value++;
      console.log(`[SUBMIT] Round ${game.currentRound.value} starting`);
    }

    console.log('[SUBMIT] ========== TURN COMPLETE ==========');

    setTimeout(() => statusMessage.value = '', 5000);
  } catch (err) {
    console.error('[SUBMIT] ✗ Validation error:', err);
    statusMessage.value = 'Error validating words';
  } finally {
    isValidating.value = false;
  }
};

const resetGame = () => {
  console.log('[APP] Resetting game');
  gameState.value = 'menu';
  roomCode.value = '';
  statusMessage.value = '';
  game.board.value = [];
  game.currentRound.value = 1;
  game.currentPlayerIndex.value = 0;
  game.usedWords.value = [];
  game.players.value.forEach((p: Player) => p.score = 0);
};
</script>