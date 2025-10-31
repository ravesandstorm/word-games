import type { ScrabbleCell, ScrabbleTile, ScrabblePlayer } from '../../types/scrabble';
import type { Position } from '../../types/game'
import letterScoresData from '../../public/letterScores.json';
import letterCountsData from '../../public/letterCounts.json';

export function useScrabble() {
  const board = ref<ScrabbleCell[][]>([]);
  const players = ref<ScrabblePlayer[]>([{ 
    id: 'local-1', 
    name: 'Player 1', 
    score: 0, 
    isLocal: true,
    tiles: []
  }]);
  const currentPlayerIndex = ref(0);
  const currentRound = ref(1);
  const selectedCell = ref<Position | null>(null);
  const selectedTileIndex = ref<number | null>(null);
  const tempPositions = ref<Position[]>([]);
  const usedWords = ref<string[]>([]);
  const letterBag = ref<ScrabbleTile[]>([]);

  const letterScores: Record<string, number> = letterScoresData;
  const letterCounts: Record<string, number> = letterCountsData;

  // Initialize letter bag
  const initializeLetterBag = () => {
    const bag: ScrabbleTile[] = [];
    
    Object.entries(letterCounts).forEach(([letter, count]) => {
      for (let i = 0; i < count; i++) {
        bag.push({
          letter: letter === 'BLANK' ? '' : letter,
          score: letterScores[letter] || 0,
          isBlank: letter === 'BLANK'
        });
      }
    });

    // Shuffle the bag
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j]!, bag[i]!];
    }

    letterBag.value = bag;
    console.log(`[SCRABBLE] Letter bag initialized with ${bag.length} tiles`);
  };

  // Draw a tile from the bag
  const drawTile = (): ScrabbleTile | null => {
    if (letterBag.value.length === 0) {
      console.log('[SCRABBLE] Letter bag is empty');
      return null;
    }
    
    const tile = letterBag.value.pop()!;
    console.log(`[SCRABBLE] Drew tile: ${tile.letter || 'BLANK'} (${tile.score} points)`);
    return tile;
  };

  // Draw tiles for a player
  const drawTilesForPlayer = (playerIndex: number, count: number = 1) => {
    const player = players.value[playerIndex];
    if (!player) return;

    for (let i = 0; i < count; i++) {
      if (player.tiles.length >= 7) {
        console.log(`[SCRABBLE] Player ${player.name} already has 7 tiles`);
        break;
      }

      const tile = drawTile();
      if (tile) {
        player.tiles.push(tile);
      }
    }

    console.log(`[SCRABBLE] Player ${player.name} now has ${player.tiles.length} tiles`);
  };

  // Initialize board with multipliers
  const initializeBoard = () => {
    console.log('[SCRABBLE] Initializing 15x15 board with multipliers');
    const size = 15;
    const newBoard: ScrabbleCell[][] = Array(size).fill(null).map(() =>
      Array(size).fill(null).map(() => ({ 
        letter: '', 
        isTemp: false, 
        isPermanent: false 
      }))
    );

    // Define multiplier positions (standard Scrabble board)
    const multipliers: Record<string, [number, number][]> = {
      'TW': [[0,0], [0,7], [0,14], [7,0], [7,14], [14,0], [14,7], [14,14]],
      'DW': [[1,1], [2,2], [3,3], [4,4], [1,13], [2,12], [3,11], [4,10], 
             [13,1], [12,2], [11,3], [10,4], [13,13], [12,12], [11,11], [10,10]],
      'TL': [[1,5], [1,9], [5,1], [5,5], [5,9], [5,13], [9,1], [9,5], [9,9], [9,13], [13,5], [13,9]],
      'DL': [[0,3], [0,11], [2,6], [2,8], [3,0], [3,7], [3,14], [6,2], [6,6], [6,8], [6,12],
             [7,3], [7,11], [8,2], [8,6], [8,8], [8,12], [11,0], [11,7], [11,14], [12,6], [12,8], [14,3], [14,11]]
    };

    // Apply multipliers
    Object.entries(multipliers).forEach(([type, positions]) => {
      positions.forEach(([row, col]) => {
        newBoard[row]![col]!.multiplier = type as 'DL' | 'TL' | 'DW' | 'TW';
      });
    });

    // Center star
    newBoard[7]![7]!.multiplier = 'STAR';

    board.value = newBoard;
    console.log('[SCRABBLE] ✓ Board initialized');
  };

  // Place a tile on the board
  const placeTile = (tileIndex: number, position: Position): boolean => {
    const player = players.value[currentPlayerIndex.value];
    if (!player || tileIndex >= player.tiles.length) return false;

    const cell = board.value[position.row]![position.col];
    if (!cell || cell.isPermanent) {
      console.log('[SCRABBLE] ✗ Cannot place tile on permanent cell');
      return false;
    }

    const tile = player.tiles[tileIndex]!;

    // If there's already a temp letter, return it to the player's hand
    if (cell.isTemp && cell.letter) {
      console.log(`[SCRABBLE] Returning existing temp letter "${cell.letter}" to hand`);
      player.tiles.push({
        letter: cell.letter,
        score: letterScores[cell.letter] || 0,
        isBlank: cell.letter === ''
      });

      // Remove from temp positions
      tempPositions.value = tempPositions.value.filter(
        p => p.row !== position.row || p.col !== position.col
      );
    }

    console.log(`[SCRABBLE] Placing "${tile.letter}" at [${position.row}, ${position.col}]`);
    board.value[position.row]![position.col] = {
      letter: tile.letter,
      isTemp: true,
      isPermanent: false,
      multiplier: cell.multiplier
    };

    tempPositions.value.push({ ...position });

    // Remove tile from player's hand
    player.tiles.splice(tileIndex, 1);
    selectedTileIndex.value = null;

    return true;
  };

  // Clear temporary letters
  const clearTempLetters = () => {
    console.log('[SCRABBLE] Clearing all temp letters');
    const player = players.value[currentPlayerIndex.value];
    if (!player) return;

    // Return tiles to player's hand
    tempPositions.value.forEach(pos => {
      const cell = board.value[pos.row]![pos.col];
      if (cell && cell.isTemp) {
        player.tiles.push({
          letter: cell.letter,
          score: letterScores[cell.letter] || 0,
          isBlank: cell.letter === ''
        });
        board.value[pos.row]![pos.col] = { 
          letter: '', 
          isTemp: false, 
          isPermanent: false,
          multiplier: cell.multiplier
        };
      }
    });

    tempPositions.value = [];
  };

  // Commit temporary letters to permanent
  const commitTempLetters = () => {
    console.log('[SCRABBLE] Committing temp letters to permanent');
    
    tempPositions.value.forEach(pos => {
      const cell = board.value[pos.row]![pos.col];
      if (cell && cell.isTemp) {
        board.value[pos.row]![pos.col] = { 
          ...cell,
          isTemp: false, 
          isPermanent: true 
        };
      }
    });

    tempPositions.value = [];
  };

  // Calculate score for a word with multipliers
  const calculateWordScore = (positions: Position[], isFirstMove: boolean = false): number => {
    let wordScore = 0;
    let wordMultiplier = 1;

    positions.forEach(pos => {
      const cell = board.value[pos.row]![pos.col];
      if (!cell || !cell.letter) return;

      let letterScore = letterScores[cell.letter] || 0;

      // Apply letter multipliers only for newly placed tiles
      if (cell.isTemp) {
        if (cell.multiplier === 'DL') letterScore *= 2;
        if (cell.multiplier === 'TL') letterScore *= 3;
        if (cell.multiplier === 'DW') wordMultiplier *= 2;
        if (cell.multiplier === 'TW') wordMultiplier *= 3;
        if (cell.multiplier === 'STAR') wordMultiplier *= 2; // Center counts as DW
      }

      wordScore += letterScore;
    });

    wordScore *= wordMultiplier;

    // Bonus for using all 7 tiles
    if (tempPositions.value.length === 7) {
      wordScore += 50;
      console.log('[SCRABBLE] +50 bonus for using all 7 tiles!');
    }

    return wordScore;
  };

  // Place a letter from keyboard (if it exists in player's hand)
  const placeLetterFromKeyboard = (letter: string, position: Position): boolean => {
    const player = players.value[currentPlayerIndex.value];
    if (!player) return false;

    const cell = board.value[position.row]![position.col];
    if (!cell || cell.isPermanent) {
      console.log('[SCRABBLE] ✗ Cannot place letter on permanent cell');
      return false;
    }

    // Find the letter in player's hand
    const tileIndex = player.tiles.findIndex(t => t.letter === letter.toUpperCase());
    if (tileIndex === -1) {
      console.log(`[SCRABBLE] ✗ Letter "${letter}" not in hand`);
      return false;
    }

    // If there's already a temp letter at this position, return it to hand
    if (cell.isTemp && cell.letter) {
      console.log(`[SCRABBLE] Returning existing temp letter "${cell.letter}" to hand`);
      player.tiles.push({
        letter: cell.letter,
        score: letterScores[cell.letter] || 0,
        isBlank: cell.letter === ''
      });

      // Remove from temp positions
      tempPositions.value = tempPositions.value.filter(
        p => p.row !== position.row || p.col !== position.col
      );
    }

    const tile = player.tiles[tileIndex]!;
    console.log(`[SCRABBLE] Placing "${tile.letter}" at [${position.row}, ${position.col}] via keyboard`);

    board.value[position.row]![position.col] = {
      letter: tile.letter,
      isTemp: true,
      isPermanent: false,
      multiplier: cell.multiplier
    };

    tempPositions.value.push({ ...position });

    // Remove tile from player's hand
    player.tiles.splice(tileIndex, 1);

    return true;
  };

  // Remove letter at position (for backspace)
  const removeLetterAtPosition = (position: Position): boolean => {
    const cell = board.value[position.row]![position.col];
    if (!cell || !cell.isTemp) {
      console.log('[SCRABBLE] ✗ No temp letter to remove');
      return false;
    }

    const player = players.value[currentPlayerIndex.value];
    if (!player) return false;

    // Return letter to hand
    player.tiles.push({
      letter: cell.letter,
      score: letterScores[cell.letter] || 0,
      isBlank: cell.letter === ''
    });

    // Clear the cell
    board.value[position.row]![position.col] = {
      letter: '',
      isTemp: false,
      isPermanent: false,
      multiplier: cell.multiplier
    };

    // Remove from temp positions
    tempPositions.value = tempPositions.value.filter(
      p => p.row !== position.row || p.col !== position.col
    );

    console.log(`[SCRABBLE] Removed temp letter at [${position.row}, ${position.col}]`);
    return true;
  };

  return {
    board,
    players,
    currentPlayerIndex,
    currentRound,
    selectedCell,
    selectedTileIndex,
    tempPositions,
    usedWords,
    letterBag,
    initializeLetterBag,
    drawTile,
    drawTilesForPlayer,
    initializeBoard,
    placeTile,
    clearTempLetters,
    commitTempLetters,
    calculateWordScore,
    placeLetterFromKeyboard,
    removeLetterAtPosition
  };
}

