<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
    <div class="max-w-7xl mx-auto">
      <!-- Game Header -->
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center gap-4">
            <button
              @click="$emit('home')"
              class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
            >
              ← Home
            </button>
            <div>
              <h2 class="text-2xl font-bold text-white">Round {{ currentRound }}</h2>
              <p class="text-yellow-300 font-semibold text-lg">
                {{ currentPlayer?.name }}'s Turn
              </p>
              <p v-if="roomCode" class="text-purple-300 text-sm">Room: {{ roomCode }}</p>
            </div>
          </div>
          <button
            @click="$emit('reset')"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset
          </button>
        </div>
        
        <!-- Player Scores -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div
            v-for="(player, index) in players"
            :key="player.id"
            :class="[
              'bg-white/20 rounded-lg p-3',
              index === currentPlayerIndex ? 'ring-2 ring-yellow-400' : ''
            ]"
          >
            <p class="text-white font-semibold truncate">{{ player.name }}</p>
            <p class="text-2xl font-bold text-yellow-300">{{ player.score }}</p>
          </div>
        </div>
        
        <!-- Turn Controls -->
        <div class="flex justify-between items-center text-white mb-2">
          <p>Letters: {{ lettersPlaced }} / {{ currentLimit }}</p>
          <div class="flex gap-2">
            <button
              @click="$emit('clear-letters')"
              :disabled="lettersPlaced === 0"
              class="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear
            </button>
            <button
              @click="$emit('submit-turn')"
              :disabled="lettersPlaced === 0 || isValidating"
              class="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              {{ isValidating ? 'Validating...' : 'Submit' }}
            </button>
          </div>
        </div>
        
        <p v-if="message" class="mt-2 text-yellow-300 font-semibold text-center">{{ message }}</p>
      </div>
      
      <!-- Game Board -->
      <div class="flex justify-center overflow-auto">
        <div class="inline-block bg-gray-800 p-2 rounded-lg shadow-2xl">
          <div
            :style="{
              display: 'grid',
              gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
              gap: '2px'
            }"
          >
            <div
              v-for="(cell, index) in flatBoard"
              :key="index"
              @click="$emit('cell-click', Math.floor(index / boardSize), index % boardSize)"
              :class="[
                'w-8 h-8 flex items-center justify-center text-sm font-bold cursor-pointer border-2 transition-all',
                cell.isPermanent ? 'bg-blue-500 text-white border-blue-600' :
                cell.isTemp ? 'bg-yellow-400 text-gray-900 border-yellow-500' :
                'bg-gray-700 text-gray-400 border-gray-600',
                isSelected(Math.floor(index / boardSize), index % boardSize) ? 'ring-2 ring-green-400 scale-110' : '',
                'hover:bg-gray-600'
              ]"
            >
              {{ cell.letter }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Game Info -->
      <div class="mt-4 bg-white/10 backdrop-blur-lg rounded-xl p-4">
        <p class="text-white text-sm text-center mb-2">
          <span class="font-bold">Controls:</span> Arrow keys to move | Type letters to place | Backspace to delete
        </p>
        <p class="text-gray-300 text-xs text-center mb-2">
          Blue = Permanent | Yellow = Temporary | Green ring = Selected | Edit temp letters without penalty
        </p>
        <p class="text-purple-300 text-xs text-center">
          Words used: {{ usedWordsCount }} | Dictionary: {{ dictionarySize }} words
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Cell, Player, Position } from '../../types/game';

const props = defineProps<{
  board: Cell[][];
  players: Player[];
  currentPlayerIndex: number;
  currentRound: number;
  selectedCell: Position | null;
  lettersPlaced: number;
  currentLimit: number;
  isValidating: boolean;
  message?: string;
  roomCode?: string;
  boardSize: number;
  usedWordsCount: number;
  dictionarySize: number;
}>();

defineEmits<{
  'cell-click': [row: number, col: number];
  'clear-letters': [];
  'submit-turn': [];
  'reset': [];
  'home': [];
}>();

const currentPlayer = computed(() => props.players[props.currentPlayerIndex]);

const flatBoard = computed(() => {
  return props.board.flat();
});

const isSelected = (row: number, col: number) => {
  return props.selectedCell?.row === row && props.selectedCell?.col === col;
};
</script>