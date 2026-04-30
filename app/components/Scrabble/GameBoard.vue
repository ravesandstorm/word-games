<template>
  <div :class="[currentGradientClass, 'min-h-screen p-4']">
    <!-- LaserFlow Background Effect -->
    <!-- <div class="fixed inset-0 z-0 opacity-10 pointer-events-none">
      <LaserFlow
        :beam-x-frac="0.5"
        :beam-y-frac="0.5"
        :h-len-factor="0.6"
        :v-len-factor="0.6"
        :decay="3.0"
        :flow-speed="0.15"
        :flow-strength="0.15"
      />
    </div> -->
    <div class="max-w-7xl mx-auto">
      <!-- Game Header -->
      <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <button
              @click="$emit('home')"
              class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
            >
              ← Home
            </button>
            <div>
              <h2 class="text-2xl font-bold text-white">Round {{ currentRound }}</h2>
              <p v-if="isMyTurn" class="text-yellow-300 font-semibold text-lg">Your Turn</p>
              <p v-else class="text-yellow-300 font-semibold text-lg">{{ currentPlayer?.name }}'s Turn</p>
            </div>
          </div>
          <button
            @click="$emit('reset')"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Reset
          </button>
        </div>

        <!-- Player Scores -->
        <div class="mt-4 grid grid-cols-3 gap-4">
          <div
            v-for="(player, index) in players"
            :key="index"
            :class="[
              'bg-white/10 rounded-lg p-3',
              index === currentPlayerIndex ? 'ring-2 ring-yellow-400' : ''
            ]"
          >
            <p class="text-white font-semibold">{{ player.name }}</p>
            <p class="text-green-400 text-2xl font-bold">{{ player.score }}</p>
            <p class="text-gray-300 text-sm">{{ player.tiles?.length || 0 }} tiles</p>
          </div>
        </div>
      </div>

      <!-- Board and Tiles Container -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Scrabble Board -->
        <div class="lg:col-span-3 overflow-auto justify-center">
          <div class="inline-block bg-gray-800 p-2 rounded-lg shadow-2xl">
            <div
              :style="{
                display: 'grid',
                gridTemplateColumns: 'repeat(15, 1fr)',
                gap: '2px'
              }"
            >
              <div
                v-for="(cell, index) in flatBoard"
                :key="index"
                @click="$emit('cell-click', Math.floor(index / 15), index % 15)"
                :class="cellClass(cell, Math.floor(index / 15), index % 15)"
              >
                <span v-if="cell.letter" class="text-sm font-bold">{{ cell.letter }}</span>
                <span v-else-if="cell.multiplier" class="text-xs font-semibold">{{ cell.multiplier }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Player Bottom Section -->
        <div class="lg:col-span-1">
          <div class="bg-white/10 backdrop-blur-lg rounded-xl p-4">
            <h3 class="text-white font-bold mb-3">Your Tiles</h3>
            <!-- Player Tiles -->
            <div class="grid grid-cols-4 gap-2 mb-4">
              <div
                v-for="(tile, index) in viewingPlayer?.tiles"
                :key="index"
                @click="isMyTurn ? $emit('select-tile', index) : null"
                :class="[
                  'aspect-square bg-yellow-100 rounded-lg flex flex-col items-center justify-center transition-all',
                  !isMyTurn ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer',
                  selectedTileIndex === index ? 'ring-2 ring-blue-400 scale-110' : (isMyTurn ? 'hover:scale-105' : '')
                ]"
              >
                <span class="text-xl font-bold text-gray-900">{{ tile.letter || '?' }}</span>
                <span class="text-xs text-gray-600">{{ tile.score }}</span>
              </div>
            </div>

            <button
              @click="$emit('draw-tile')"
              :disabled="!isMyTurn || (viewingPlayer && viewingPlayer.tiles.length >= 7) || tempPositions.length > 0"
              class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white font-bold py-2 rounded-lg mb-2"
            >
              Draw Tile ({{ gameLetterbag?.length || 0 }} left)
            </button>

            <button
              @click="$emit('clear-letters')"
              :disabled="!isMyTurn"
              class="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-500 text-white font-bold py-2 rounded-lg mb-2"
            >
              Clear
            </button>

            <button
              @click="$emit('submit-turn')"
              :disabled="!isMyTurn || isValidating || tempPositions.length === 0"
              class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white font-bold py-2 rounded-lg"
            >
              Submit Turn
            </button>

            <button
              @click="$emit('skip-turn')"
              :disabled="!isMyTurn || isValidating"
              class="w-full mt-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-500 text-white font-bold py-2 rounded-lg"
            >
              Skip Turn
            </button>

            <p v-if="message" class="mt-3 text-yellow-300 text-sm text-center">{{ message }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Position } from '../../../types/game';
import type { ScrabblePlayer, ScrabbleCell, ScrabbleTile } from '~~/types/scrabble';

const { currentGradientClass } = useTheme();

const props = defineProps<{
  board: ScrabbleCell[][];
  players: ScrabblePlayer[];
  currentPlayerIndex: number;
  currentRound: number;
  isValidating: boolean;
  message?: string;
  isOnline?: boolean;
  localPlayerId?: string;
  selectedTileIndex: number | null;
  tempPositions: Position[];
  gameLetterbag: ScrabbleTile[];
  cellClass: (cell: ScrabbleCell, row: number, col: number) => string;
}>();

defineEmits<{
  'cell-click': [row: number, col: number];
  'clear-letters': [];
  'submit-turn': [];
  'skip-turn': [];
  'reset': [];
  'home': [];
  'select-tile': [index: number];
  'draw-tile': [];
}>();

const currentPlayer = computed(() => {
  if (!props.players || props.players.length === 0) return null;
  return props.players[props.currentPlayerIndex] || props.players[0];
});

const viewingPlayer = computed(() => {
  if (!props.players || props.players.length === 0) return null;
  if (props.isOnline && props.localPlayerId) {
    return props.players.find(p => p.id === props.localPlayerId) || props.players[0];
  }
  return currentPlayer.value;
});

const isMyTurn = computed(() => {
  if (!props.isOnline) return true;
  return currentPlayer.value?.id === props.localPlayerId;
});

const flatBoard = computed(() => {
  if (!props.board) return [];
  return props.board.flat();
});
</script>
