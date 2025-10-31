<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
      <h2 class="text-3xl font-bold text-white mb-6">Game Setup</h2>
      
      <!-- Online Room Section -->
      <div v-if="isOnline && !roomCode" class="mb-6 space-y-4">
        <button
          @click="$emit('create-room')"
          :disabled="isCreating"
          class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Create Room
        </button>
        
        <div class="flex gap-2">
          <input
            v-model="joinCode"
            type="text"
            placeholder="Enter room code"
            class="flex-1 bg-white/20 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            maxlength="6"
            @input="joinCode = joinCode.toUpperCase()"
          />
          <button
            @click="$emit('join-room', joinCode)"
            :disabled="!joinCode"
            class="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg"
          >
            Join
          </button>
        </div>
      </div>
      
      <!-- Room Code Display -->
      <div v-if="isOnline && roomCode" class="mb-6 bg-purple-500/30 rounded-xl p-4">
        <p class="text-white font-semibold mb-2">Room Code:</p>
        <div class="flex gap-2 mb-3">
          <div class="flex-1 bg-white/20 text-white rounded-lg px-4 py-3 text-xl font-mono font-bold text-center">
            {{ roomCode }}
          </div>
          <button
            @click="$emit('copy-code', roomCode)"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        <!-- Lobby Player Count -->
        <div class="bg-white/10 rounded-lg p-3">
          <div class="flex items-center justify-between">
            <span class="text-white font-semibold">Players in Lobby:</span>
            <span class="text-green-400 font-bold text-lg">{{ lobbyPlayerCount }}</span>
          </div>
          <div v-if="lobbyPlayers.length > 0" class="mt-2 space-y-1">
            <div v-for="(player, idx) in lobbyPlayers" :key="idx" class="text-sm text-gray-300">
              • {{ player.name }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Game Settings -->
      <div class="space-y-6">
        <div>
          <label class="text-white font-semibold mb-2 block">Board Size (Square)</label>
          <input
            v-model.number="settings.boardSize"
            type="number"
            :disabled="controlsDisabled"
            :class="[
              'w-full text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400',
              controlsDisabled ? 'bg-white/10 cursor-not-allowed' : 'bg-white/20'
            ]"
            min="10"
            max="20"
          />
        </div>

        <div>
          <label class="text-white font-semibold mb-2 block">Starting Letters Per Turn</label>
          <input
            v-model.number="settings.maxLettersPerTurn"
            type="number"
            :disabled="controlsDisabled"
            :class="[
              'w-full text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400',
              controlsDisabled ? 'bg-white/10 cursor-not-allowed' : 'bg-white/20'
            ]"
            min="2"
            max="6"
          />
        </div>

        <div>
          <label class="text-white font-semibold mb-2 block">Rounds Before Increment</label>
          <input
            v-model.number="settings.roundsPerIncrement"
            type="number"
            :disabled="controlsDisabled"
            :class="[
              'w-full text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400',
              controlsDisabled ? 'bg-white/10 cursor-not-allowed' : 'bg-white/20'
            ]"
            min="1"
            max="10"
          />
        </div>
        
        <!-- Local Players -->
        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="text-white font-semibold">Players (Local Device)</label>
            <button
              @click="$emit('add-player')"
              :disabled="controlsDisabled"
              :class="[
                'text-white rounded-lg px-3 py-1 flex items-center gap-1',
                controlsDisabled ? 'bg-green-500/50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
              ]"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>

          <div class="space-y-2">
            <div v-for="(player, index) in players" :key="index" class="flex gap-2">
              <input
                :value="player.name"
                @input="$emit('update-player', index, ($event.target as HTMLInputElement).value)"
                type="text"
                :disabled="controlsDisabled"
                :class="[
                  'flex-1 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400',
                  controlsDisabled ? 'bg-white/10 cursor-not-allowed' : 'bg-white/20'
                ]"
              />
              <button
                v-if="players.length > 1"
                @click="$emit('remove-player', index)"
                :disabled="controlsDisabled"
                :class="[
                  'text-white rounded-lg px-3 py-2',
                  controlsDisabled ? 'bg-red-500/50 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
                ]"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button
            @click="$emit('back')"
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl"
          >
            Back
          </button>
          <button
            @click="$emit('start-game', settings)"
            :disabled="controlsDisabled"
            :class="[
              'flex-1 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2',
              controlsDisabled ? 'bg-green-500/50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ controlsDisabled ? 'Waiting for Host...' : 'Start Game' }}
          </button>
        </div>
      </div>
      
      <p v-if="message" class="mt-4 text-yellow-300 font-semibold text-center">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '../../types/game';

interface GameSettings {
  boardSize: number;
  maxLettersPerTurn: number;
  roundsPerIncrement: number;
}

const props = defineProps<{
  isOnline: boolean;
  roomCode?: string;
  isCreating?: boolean;
  players: Player[];
  message?: string;
  lobbyPlayerCount: number | 0;
  lobbyPlayers: Player[];
  isHost?: boolean;
}>();

// Determine if controls should be disabled (for non-hosts in online mode)
const controlsDisabled = computed(() => props.isOnline && props.roomCode && !props.isHost);

const settings = ref<GameSettings>({
  boardSize: 15,
  maxLettersPerTurn: 3,
  roundsPerIncrement: 6
});

const joinCode = ref('');

defineEmits<{
  'create-room': [];
  'join-room': [code: string];
  'copy-code': [code: string];
  'add-player': [];
  'remove-player': [index: number];
  'update-player': [index: number, name: string];
  'start-game': [settings: GameSettings];
  'back': [];
}>();
</script>