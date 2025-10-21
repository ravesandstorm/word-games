import type { Cell, Position } from "../../types/game";

export function useWordValidation() {
  const extractWordsFromBoard = (
    board: Cell[][],
    tempPositions: Position[]
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

      // Check if sequence contains at least one permanent letter
      let hasPermanent = false;
      for (let col = startCol; col <= endCol; col++) {
        if (board[row]![col]!.isPermanent) {
          hasPermanent = true;
          break;
        }
      }

      if (!hasPermanent) {
        console.log(
          "[WORD-EXTRACTION] ✗ No permanent letters in sequence (cannot create isolated words)"
        );
        return [];
      }

      // Extract letters
      const letters: string[] = [];
      for (let col = startCol; col <= endCol; col++) {
        letters.push(board[row]![col]!.letter);
      }

      console.log(`[WORD-EXTRACTION] Full sequence: "${letters.join("")}"`);

      // Generate all subsequences
      for (let start = 0; start < letters.length; start++) {
        for (let end = start + 2; end <= letters.length; end++) {
          const word = letters.slice(start, end).join("");
          words.add(word);
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

      // Check if sequence contains at least one permanent letter
      let hasPermanent = false;
      for (let row = startRow; row <= endRow; row++) {
        if (board[row]![col]!.isPermanent) {
          hasPermanent = true;
          break;
        }
      }

      if (!hasPermanent) {
        console.log(
          "[WORD-EXTRACTION] ✗ No permanent letters in sequence (cannot create isolated words)"
        );
        return [];
      }

      // Extract letters
      const letters: string[] = [];
      for (let row = startRow; row <= endRow; row++) {
        letters.push(board[row]![col]!.letter);
      }

      console.log(`[WORD-EXTRACTION] Full sequence: "${letters.join("")}"`);

      // Generate all subsequences
      for (let start = 0; start < letters.length; start++) {
        for (let end = start + 2; end <= letters.length; end++) {
          const word = letters.slice(start, end).join("");
          words.add(word);
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
        body: { words, usedWords },
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
