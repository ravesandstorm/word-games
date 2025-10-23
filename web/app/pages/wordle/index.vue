<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
    <!-- Game Screen -->
    <div v-if="game.gameStatus.value !== 'lost'" class="max-w-lg w-full">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-4xl font-bold text-white mb-2">Wordle</h1>
          <div class="flex justify-center gap-6 text-white">
            <div class="bg-white/20 rounded-lg px-4 py-2">
              <p class="text-sm text-gray-300">Win Streak</p>
              <p class="text-2xl font-bold text-green-400">{{ game.winStreak.value }}</p>
            </div>
            <div class="bg-white/20 rounded-lg px-4 py-2">
              <p class="text-sm text-gray-300">High Score</p>
              <p class="text-2xl font-bold text-yellow-400">{{ game.highScore.value }}</p>
            </div>
          </div>
        </div>

        <!-- Game Won Message -->
        <div v-if="game.gameStatus.value === 'won'" class="mb-6 bg-green-500/30 rounded-xl p-4 text-center">
          <p class="text-white font-bold text-xl mb-2">🎉 Congratulations!</p>
          <p class="text-gray-200">You guessed the word in {{ game.guesses.value.length }} tries!</p>
          <button
            @click="restartGame"
            class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
          >
            Play Again
          </button>
        </div>

        <!-- Guess Grid -->
        <div class="mb-6 space-y-2">
          <div
            v-for="(guess, guessIndex) in displayGuesses"
            :key="guessIndex"
            class="flex gap-2 justify-center"
          >
            <div
              v-for="(letter, letterIndex) in guess.split('')"
              :key="letterIndex"
              :class="[
                'w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-all',
                getLetterClass(guess, letterIndex, guessIndex < game.guesses.value.length)
              ]"
            >
              {{ letter }}
            </div>
          </div>
        </div>

        <!-- Message -->
        <p v-if="message" class="text-center text-yellow-300 font-semibold mb-4">{{ message }}</p>

        <!-- Keyboard -->
        <div class="space-y-2">
          <div v-for="(row, rowIndex) in keyboardLayout" :key="rowIndex" class="flex gap-1 justify-center">
            <button
              v-for="key in row"
              :key="key"
              @click="handleKeyPress(key)"
              :class="[
                'px-3 py-4 rounded font-bold text-sm transition-all',
                key === 'ENTER' || key === 'BACK' ? 'bg-gray-500 hover:bg-gray-600 text-white' : getKeyClass(key)
              ]"
            >
              {{ key === 'BACK' ? '⌫' : key }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Over Screen -->
    <div v-else class="max-w-lg w-full">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl text-center">
        <h1 class="text-4xl font-bold text-white mb-4">Game Over!</h1>
        <p class="text-gray-200 text-xl mb-2">The word was:</p>
        <p class="text-yellow-400 text-3xl font-bold mb-6">{{ game.targetWord.value }}</p>

        <div class="bg-white/20 rounded-xl p-6 mb-6">
          <p class="text-white text-lg mb-2">Your High Score</p>
          <p class="text-green-400 text-5xl font-bold">{{ game.highScore.value }}</p>
          <p class="text-gray-300 text-sm mt-2">consecutive wins</p>
        </div>

        <button
          @click="restartGame"
          class="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all transform hover:scale-105"
        >
          Play Again
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const game = useWordle();
const message = ref('');

const keyboardLayout = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
];

// Initialize game on mount
onMounted(async () => {
  await game.initializeGame();
});

// Display guesses (filled + current + empty)
const displayGuesses = computed(() => {
  const result: string[] = [];

  // Add completed guesses
  game.guesses.value.forEach((guess: string) => {
    result.push(guess);
  });

  // Add current guess if game is still playing
  if (game.gameStatus.value === 'playing') {
    const currentGuess = game.currentGuess.value.padEnd(5, ' ');
    result.push(currentGuess);
  }

  // Fill remaining rows with empty spaces
  while (result.length < game.maxGuesses) {
    result.push('     ');
  }

  return result;
});

// Get letter class based on status
const getLetterClass = (guess: string, index: number, isSubmitted: boolean) => {
  if (!isSubmitted) {
    return 'bg-white/20 border-gray-400 text-white';
  }

  const status = game.getLetterStatus(guess, index);

  if (status === 'correct') {
    return 'bg-green-500 border-green-600 text-white';
  } else if (status === 'present') {
    return 'bg-yellow-500 border-yellow-600 text-white';
  } else {
    return 'bg-gray-600 border-gray-700 text-white';
  }
};

// Get keyboard key class
const getKeyClass = (key: string) => {
  const status = game.getKeyboardLetterStatus(key);

  if (status === 'correct') {
    return 'bg-green-500 hover:bg-green-600 text-white';
  } else if (status === 'present') {
    return 'bg-yellow-500 hover:bg-yellow-600 text-white';
  } else if (status === 'absent') {
    return 'bg-gray-700 hover:bg-gray-800 text-white';
  } else {
    return 'bg-gray-500 hover:bg-gray-600 text-white';
  }
};

// Handle key press
const handleKeyPress = async (key: string) => {
  if (game.gameStatus.value !== 'playing') return;

  if (key === 'ENTER') {
    const success = await game.submitGuess();
    if (!success) {
      if (game.currentGuess.value.length !== 5) {
        message.value = 'Word must be 5 letters!';
      } else {
        message.value = 'Not a valid word!';
      }
      setTimeout(() => message.value = '', 2000);
    }
  } else if (key === 'BACK') {
    game.removeLetter();
  } else {
    game.addLetter(key);
  }
};

// Keyboard event listener
onMounted(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    const key = e.key.toUpperCase();

    if (key === 'ENTER') {
      handleKeyPress('ENTER');
    } else if (key === 'BACKSPACE') {
      handleKeyPress('BACK');
    } else if (key.length === 1 && key.match(/[A-Z]/)) {
      handleKeyPress(key);
    }
  };

  window.addEventListener('keydown', handleKeyboard);

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyboard);
  });
});

// Restart game
const restartGame = async () => {
  await game.initializeGame();
  message.value = '';
};
</script>
