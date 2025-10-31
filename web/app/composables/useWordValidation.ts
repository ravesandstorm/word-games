import type { Cell, Position } from "../../types/game";

export function useWordValidation() {
  const extractWordsFromBoard = (
    board: Cell[][],
    tempPositions: Position[],
    allowFirstWord: boolean = false
  ): string[] => {
    if (board === undefined) {
      console.log("[WORD-EXTRACTION] ✗ Board or temp positions undefined");
      return [];
    }
    console.log("[WORD-EXTRACTION] Starting word extraction...");
    console.log(`[WORD-EXTRACTION] Temp positions: ${tempPositions.length}`);

    if (tempPositions.length === 0) {
      console.log("[WORD-EXTRACTION] No temp positions");
      return [];
    }

    // Check if all temp letters are on same row or column
    const rows = tempPositions.map((p) => p.row);
    const cols = tempPositions.map((p) => p.col);
    const allSameRow = rows.every((r) => r === rows[0]);
    const allSameCol = cols.every((c) => c === cols[0]);

    if (!allSameRow && !allSameCol) {
      console.log("[WORD-EXTRACTION] ✗ Temp letters not on same axis");
      return [];
    }

    console.log(
      `[WORD-EXTRACTION] Temp letters on same ${allSameRow ? "row" : "column"}`
    );

    const words = new Set<string>();

    if (allSameRow) {
      const row = rows[0] as number;
      const minCol = Math.min(...cols);
      const maxCol = Math.max(...cols);

      console.log(
        `[WORD-EXTRACTION] Checking row ${row}, cols ${minCol}-${maxCol}`
      );

      // Find the full sequence containing temp letters
      let startCol = minCol;
      let endCol = maxCol;

      // Extend left
      while (startCol > 0 && board[row]![startCol - 1]!.letter) {
        startCol--;
      }

      // Extend right
      while (endCol < board[row]!.length - 1 && board[row]![endCol + 1]!.letter) {
        endCol++;
      }

      console.log(
        `[WORD-EXTRACTION] Extended sequence: cols ${startCol}-${endCol}`
      );

      // Step 1: Find indices of all temporary letters
      const tempIndices: number[] = [];
      for (let col = startCol; col <= endCol; col++) {
        if (board[row]![col]!.isTemp) {
          tempIndices.push(col);
        }
      }

      // If no temp letters, just return sequences with permanents
      if (tempIndices.length === 0) {
        console.log("[WORD-EXTRACTION] No temporary letters, skipping");
        return [];
      }

      // Step 2: Generate all subsequences that include all temp letters
      // We'll consider sequences from the first temp to the last temp index
      const firstTemp = tempIndices[0];
      const lastTemp = tempIndices[tempIndices.length - 1];

      // Loop over possible start and end around temp range
      for (let start = firstTemp as number; start >= startCol; start--) {
        for (let end = lastTemp as number + 1; end <= endCol + 1; end++) {
          const segment = board[row]!.slice(start, end);

          // Check: segment includes all temp letters
          const tempInSegment = segment.some((cell) => cell.isTemp);
          const hasAllTemp = tempIndices.every(
            (i) => i >= start && i < end
          );

          if (!hasAllTemp) continue;

          // Check: must include at least one permanent letter (unless it's the first word)
          const hasPermanent = segment.some((cell) => cell.isPermanent);
          if (!hasPermanent && !allowFirstWord) continue;

          // Build the word
          const word = segment.map((cell) => cell.letter).join("");
          if (word.length >= 2) { // Only add words with 2+ letters
            words.add(word);
          }
        }
      }
    } else {
      // Vertical
      const col = cols[0] as number;
      const minRow = Math.min(...rows);
      const maxRow = Math.max(...rows);

      console.log(
        `[WORD-EXTRACTION] Checking column ${col}, rows ${minRow}-${maxRow}`
      );

      // Find the full sequence containing temp letters
      let startRow = minRow;
      let endRow = maxRow;

      // Extend up
      while (startRow > 0 && board[startRow - 1]![col]!.letter) {
        startRow--;
      }

      // Extend down
      while (endRow < board.length - 1 && board[endRow + 1]![col]!.letter) {
        endRow++;
      }

      console.log(
        `[WORD-EXTRACTION] Extended sequence: rows ${startRow}-${endRow}`
      );

      // Step 1: Find indices of all temporary letters in this column
      const tempIndices: number[] = [];
      for (let row = startRow; row <= endRow; row++) {
        if (board[row]![col]!.isTemp) {
          tempIndices.push(row);
        }
      }

      // No temporary letters => skip
      if (tempIndices.length === 0) {
        console.log("[WORD-EXTRACTION] No temporary letters in column, skipping");
        return [];
      }

      // Step 2: Determine start and end of the required temp sequence
      const firstTemp = tempIndices[0];
      const lastTemp = tempIndices[tempIndices.length - 1];

      // Step 3: Generate all vertical sequences that include all temp letters
      for (let start = firstTemp as number; start >= startRow; start--) {
        for (let end = lastTemp as number+ 1; end <= endRow + 1; end++) {
          const segment = board.slice(start, end).map(rowArr => rowArr[col]!);

          // Check all temp letters are included
          const hasAllTemp = tempIndices.every(i => i >= start && i < end);
          if (!hasAllTemp) continue;

          // Must include at least one permanent letter (unless it's the first word)
          const hasPermanent = segment.some((cell) => cell.isPermanent);
          if (!hasPermanent && !allowFirstWord) continue;

          // Build word
          const word = segment.map(cell => cell.letter).join("");
          if (word.length >= 2) { // Only add words with 2+ letters
            words.add(word);
          }
        }
      }
    }

    const wordArray = Array.from(words).sort((a, b) => b.length - a.length);
    console.log(
      `[WORD-EXTRACTION] ✓ Generated ${wordArray.length} word combinations`
    );
    wordArray.forEach((word, i) => {
      console.log(
        `[WORD-EXTRACTION]   ${i + 1}. "${word}" (${word.length} letters)`
      );
    });

    return wordArray;
  };

  const validateWordsOnServer = async (
    words: string[],
    usedWords: string[]
  ) => {
    console.log("[VALIDATION] Sending validation request to server...");

    try {
      const response = await $fetch("/api/validate-words", {
        method: "POST",
        body: { words, usedWords, wordle: false },
      });

      console.log("[VALIDATION] ✓ Server validation complete");
      return response;
    } catch (err) {
      console.error("[VALIDATION] ✗ Server validation failed:", err);
      throw err;
    }
  };

  return {
    extractWordsFromBoard,
    validateWordsOnServer
  };
}
