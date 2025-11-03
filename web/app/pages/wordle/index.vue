<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
    <!-- Confirmation Modal -->
    <ConfirmModal
      :show="showExitConfirm"
      title="Exit Game?"
      message="Are you sure you want to exit? Your current game progress will be lost."
      confirm-text="Exit"
      @confirm="confirmExit"
      @cancel="showExitConfirm = false"
    />

    <!-- Game Screen -->
    <div v-if="game.gameStatus.value !== 'lost'" class="max-w-lg w-full">
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
        <!-- Header -->
        <div class="text-center mb-6">
          <div class="flex justify-between items-center mb-2">
            <button
              @click="handleHomeClick"
              class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
            >
              ← Home
            </button>
            <h1 class="text-4xl font-bold text-white">Wordle</h1>
            <div class="w-20"></div> <!-- Spacer for centering -->
          </div>
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

        <!-- Game Won Message with Animation -->
        <div v-if="game.gameStatus.value === 'won'" class="mb-6 relative">
          <!-- Win Animation Overlay -->
          <div v-if="showWinAnimation" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
            <div class="text-center animate-bounce-in">
              <div class="text-9xl mb-4 animate-spin-slow">🎉</div>
              <h2 class="text-6xl font-bold text-yellow-400 mb-2 animate-pulse">You Won!</h2>
              <p class="text-2xl text-white">You guessed it in {{ game.guesses.value.length }} tries!</p>
            </div>
          </div>

          <!-- Regular Win Message -->
          <div class="bg-green-500/30 rounded-xl p-4 text-center">
            <p class="text-white font-bold text-xl mb-2">🎉 Congratulations!</p>
            <p class="text-gray-200">You guessed the word in {{ game.guesses.value.length }} tries!</p>
            <button
              @click="restartGame"
              class="mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg"
            >
              Play Again
            </button>
          </div>
        </div>

        <!-- Guess Grid -->
        <div class="mb-6 space-y-2">
          <div
            v-for="(guess, guessIndex) in displayGuesses"
            :key="guessIndex"
            :class="[
              'flex gap-2 justify-center',
              shakeRow === guessIndex ? 'animate-shake' : '',
              flipRow === guessIndex ? 'animate-flip-row' : ''
            ]"
          >
            <div
              v-for="(letter, letterIndex) in guess.split('')"
              :key="letterIndex"
              :class="[
                'w-14 h-14 flex items-center justify-center text-2xl font-bold rounded-lg border-2 transition-all',
                getLetterClass(guess, letterIndex, guessIndex < game.guesses.value.length),
                flipRow === guessIndex ? `animate-flip-${letterIndex}` : ''
              ]"
              :style="flipRow === guessIndex ? `animation-delay: ${letterIndex * 0.15}s` : ''"
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
import type { WordleServerStatus } from '../../../types/index';

const game = useWordle();
const message = ref('');
const shakeRow = ref(-1);
const flipRow = ref(-1);
const showWinAnimation = ref(false);
const showExitConfirm = ref(false);

const keyboardLayout = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
];

// Initialize game on mount
onMounted(async () => {
  await game.initializeGame();
  // send request param with origin
  const status = await $fetch('/api/status', { params: { origin: 'wordle' } }) as WordleServerStatus;
  console.log('[WORDLE] Server status:', status);
});

// Watch for win status to trigger animation
watch(() => game.gameStatus.value, (newStatus) => {
  if (newStatus === 'won') {
    showWinAnimation.value = true;
    setTimeout(() => {
      showWinAnimation.value = false;
    }, 3000); // Show for 3 seconds
  }
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
    const currentRowIndex = game.guesses.value.length;
    const success = await game.submitGuess();

    if (!success) {
      // Shake animation for invalid word
      shakeRow.value = currentRowIndex;
      setTimeout(() => shakeRow.value = -1, 500);

      if (game.currentGuess.value.length !== 5) {
        message.value = 'Word must be 5 letters!';
      } else {
        message.value = 'Not a valid word!';
      }
      setTimeout(() => message.value = '', 2000);
    } else {
      // Flip animation for valid word
      flipRow.value = currentRowIndex;
      setTimeout(() => flipRow.value = -1, 1500);
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

// Handle home button click
const handleHomeClick = () => {
  // Show confirmation if game is in progress
  if (game.gameStatus.value === 'playing' && game.guesses.value.length > 0) {
    showExitConfirm.value = true;
  } else {
    navigateTo('/');
  }
};

// Confirm exit
const confirmExit = () => {
  showExitConfirm.value = false;
  navigateTo('/');
};
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

@keyframes flip {
  0% { transform: rotateX(0); }
  50% { transform: rotateX(90deg); }
  100% { transform: rotateX(0); }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounce-in {
  0% {
    transform: scale(0) translateY(-100px);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) translateY(0);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes spin-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-shake {
  /* change intensity of shake */ 
  animation: shake 0.5s ease-in-out ;
}

.animate-flip-0,
.animate-flip-1,
.animate-flip-2,
.animate-flip-3,
.animate-flip-4 {
  animation: flip 0.8s ease-in-out;
  animation-fill-mode: forwards;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-in-out;
}

.animate-bounce-in {
  animation: bounce-in 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.animate-spin-slow {
  animation: spin-slow 2s linear infinite;
}
</style>
