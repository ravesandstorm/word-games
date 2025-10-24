export function useWordle() {
  const targetWord = ref('');
  const guesses = ref<string[]>([]);
  const currentGuess = ref('');
  const gameStatus = ref<'playing' | 'won' | 'lost'>('playing');
  const winStreak = ref(0);
  const highScore = ref(0);
  const maxGuesses = 6;

  // Load win streak and high score from localStorage
  onMounted(() => {
    if (typeof window !== 'undefined') {
      const savedStreak = localStorage.getItem('wordle-win-streak');
      const savedHighScore = localStorage.getItem('wordle-high-score');
      
      if (savedStreak) winStreak.value = parseInt(savedStreak);
      if (savedHighScore) highScore.value = parseInt(savedHighScore);
    }
  });

  // Save to localStorage
  const saveStats = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wordle-win-streak', winStreak.value.toString());
      localStorage.setItem('wordle-high-score', highScore.value.toString());
    }
  };

  // Get a random 5-letter word from dictionary
  const getRandomWord = async (): Promise<string> => {
    try {
      // Fetch dictionary
      const response = await fetch('/wordleDict.json');
      const words: string[] = await response.json();
      
      // Filter for 5-letter words
      const fiveLetterWords = words.filter(word => word.length === 5);
      
      if (fiveLetterWords.length === 0) {
        console.error('[WORDLE] No 5-letter words found in dictionary');
        return 'START'; // Fallback
      }
      
      const randomIndex = Math.floor(Math.random() * fiveLetterWords.length);
      const word = fiveLetterWords[randomIndex]!.toUpperCase();
      
      console.log(`[WORDLE] Selected word: ${word}`);
      return word;
    } catch (err) {
      console.error('[WORDLE] Error loading dictionary:', err);
      // Fallback words
      const fallbackWords = ['HELLO', 'WORLD', 'GAMES', 'WORDS', 'BRAIN', 'SMART', 'QUICK', 'JUMPS'];
      return fallbackWords[Math.floor(Math.random() * fallbackWords.length)]!;
    }
  };

  // Initialize new game
  const initializeGame = async () => {
    targetWord.value = await getRandomWord();
    guesses.value = [];
    currentGuess.value = '';
    gameStatus.value = 'playing';
    console.log('[WORDLE] Game initialized');
  };

  // Add letter to current guess
  const addLetter = (letter: string) => {
    if (currentGuess.value.length < 5 && gameStatus.value === 'playing') {
      currentGuess.value += letter.toUpperCase();
    }
  };

  // Remove last letter
  const removeLetter = () => {
    if (currentGuess.value.length > 0) {
      currentGuess.value = currentGuess.value.slice(0, -1);
    }
  };

  // Get letter status for a guess
  const getLetterStatus = (guess: string, index: number): 'correct' | 'present' | 'absent' => {
    const letter = guess[index]!;
    const targetLetter = targetWord.value[index]!;

    // Correct position
    if (letter === targetLetter) {
      return 'correct';
    }

    // Letter exists in word but wrong position
    if (targetWord.value.includes(letter)) {
      return 'present';
    }

    // Letter not in word
    return 'absent';
  };

  // Submit current guess
  const submitGuess = async (): Promise<boolean> => {
    if (currentGuess.value.length !== 5) {
      console.log('[WORDLE] Guess must be 5 letters');
      return false;
    }

    if (gameStatus.value !== 'playing') {
      console.log('[WORDLE] Game is not in playing state');
      return false;
    }

    // Validate word exists in dictionary
    try {
      const result = await $fetch('/api/validate-words', {
        method: 'POST',
        body: { words: [currentGuess.value], wordle: true }
      });

      if (!result) {
        console.log('[WORDLE] Invalid word');
        return false;
      }
    } catch (err) {
      console.error('[WORDLE] Error validating word:', err);
      return false;
    }

    guesses.value.push(currentGuess.value);
    console.log(`[WORDLE] Guess ${guesses.value.length}: ${currentGuess.value}`);

    // Check if won
    if (currentGuess.value === targetWord.value) {
      gameStatus.value = 'won';
      winStreak.value++;
      
      if (winStreak.value > highScore.value) {
        highScore.value = winStreak.value;
      }
      
      saveStats();
      console.log(`[WORDLE] ✓ Won! Streak: ${winStreak.value}`);
    } 
    // Check if lost
    else if (guesses.value.length >= maxGuesses) {
      gameStatus.value = 'lost';
      winStreak.value = 0;
      saveStats();
      console.log(`[WORDLE] ✗ Lost! Word was: ${targetWord.value}`);
    }

    currentGuess.value = '';
    return true;
  };

  // Get keyboard letter status
  const getKeyboardLetterStatus = (letter: string): 'correct' | 'present' | 'absent' | 'unused' => {
    let status: 'correct' | 'present' | 'absent' | 'unused' = 'unused';

    guesses.value.forEach(guess => {
      guess.split('').forEach((guessLetter, index) => {
        if (guessLetter === letter) {
          const letterStatus = getLetterStatus(guess, index);
          
          // Priority: correct > present > absent
          if (letterStatus === 'correct') {
            status = 'correct';
          } else if (letterStatus === 'present' && status !== 'correct') {
            status = 'present';
          } else if (letterStatus === 'absent' && status === 'unused') {
            status = 'absent';
          }
        }
      });
    });

    return status;
  };

  return {
    targetWord,
    guesses,
    currentGuess,
    gameStatus,
    winStreak,
    highScore,
    maxGuesses,
    initializeGame,
    addLetter,
    removeLetter,
    getLetterStatus,
    submitGuess,
    getKeyboardLetterStatus
  };
}

