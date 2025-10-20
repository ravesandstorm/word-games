import type { Cell, Player, Position } from '~/types/game';

export function useGame() {
  const board = ref<Cell[][]>([]);
  const players = ref<Player[]>([{ 
    id: 'local-1', 
    name: 'Player 1', 
    score: 0, 
    isLocal: true 
  }]);
  const currentPlayerIndex = ref(0);
  const currentRound = ref(1);
  const selectedCell = ref<Position | null>(null);
  const lettersPlaced = ref(0);
  const tempPositions = ref<Position[]>([]);
  const usedWords = ref<string[]>([]);

  const initializeBoard = (size: number) => {
    console.log(`[GAME] Initializing ${size}x${size} board`);
    
    const newBoard: Cell[][] = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ 
        letter: '', 
        isTemp: false, 
        isPermanent: false 
      }))
    );

    // Place starter word
    const words = ['GAME', 'WORD', 'PLAY', 'START', 'BEGIN', 'CHESS', 'MAGIC'];
    const randomWord = words[Math.floor(Math.random() * words.length)];
    const centerRow = Math.floor(size / 2);
    const startCol = Math.floor((size - randomWord.length) / 2);

    console.log(`[GAME] Placing starter word "${randomWord}" at [${centerRow}, ${startCol}]`);

    for (let i = 0; i < randomWord.length; i++) {
      newBoard[centerRow][startCol + i] = {
        letter: randomWord[i],
        isTemp: false,
        isPermanent: true
      };
    }

    board.value = newBoard;
    selectedCell.value = { row: centerRow, col: startCol + randomWord.length };
    usedWords.value = [randomWord];
    
    console.log('[GAME] ✓ Board initialized');
  };

  const placeLetter = (letter: string, maxLetters: number) => {
    if (!selectedCell.value) return false;

    const pos = selectedCell.value;
    const cell = board.value[pos.row][pos.col];

    // If replacing temp letter, don't increment counter
    if (cell.isTemp) {
      console.log(`[GAME] Replacing temp letter at [${pos.row}, ${pos.col}]`);
      board.value[pos.row][pos.col].letter = letter;
      return true;
    }

    if (cell.isPermanent) {
      console.log('[GAME] ✗ Cannot overwrite permanent letter');
      return false;
    }

    if (lettersPlaced.value >= maxLetters) {
      console.log(`[GAME] ✗ Letter limit reached: ${lettersPlaced.value}/${maxLetters}`);
      return false;
    }

    console.log(`[GAME] Placing "${letter}" at [${pos.row}, ${pos.col}]`);
    board.value[pos.row][pos.col] = { letter, isTemp: true, isPermanent: false };
    lettersPlaced.value++;
    tempPositions.value.push({ ...pos });

    return true;
  };

  const clearTempLetters = () => {
    console.log('[GAME] Clearing all temp letters');
    
    for (let row = 0; row < board.value.length; row++) {
      for (let col = 0; col < board.value[row].length; col++) {
        if (board.value[row][col].isTemp) {
          board.value[row][col] = { letter: '', isTemp: false, isPermanent: false };
        }
      }
    }

    lettersPlaced.value = 0;
    tempPositions.value = [];
  };

  const commitTempLetters = () => {
    console.log('[GAME] Committing temp letters to permanent');
    
    for (let row = 0; row < board.value.length; row++) {
      for (let col = 0; col < board.value[row].length; col++) {
        if (board.value[row][col].isTemp) {
          board.value[row][col] = { 
            ...board.value[row][col], 
            isTemp: false, 
            isPermanent: true 
          };
        }
      }
    }

    lettersPlaced.value = 0;
    tempPositions.value = [];
  };

  return {
    board,
    players,
    currentPlayerIndex,
    currentRound,
    selectedCell,
    lettersPlaced,
    tempPositions,
    usedWords,
    initializeBoard,
    placeLetter,
    clearTempLetters,
    commitTempLetters
  };
}