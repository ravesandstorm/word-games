<template>
  <div :class="[currentGradientClass, 'min-h-screen flex items-center justify-center p-4 relative']">
    <!-- LaserFlow Background Effect -->
    <!-- <div class="fixed inset-0 z-0 opacity-15 pointer-events-none">
      <LaserFlow
        :beam-x-frac="0.5"
        :beam-y-frac="0.5"
        :h-len-factor="0.7"
        :v-len-factor="0.7"
        :decay="2.5"
        :flow-speed="0.2"
        :flow-strength="0.2"
      />
    </div> -->
    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative z-10">
      <h2 class="text-3xl font-bold text-white mb-6">Game Setup</h2>

      <!-- Online Room Section -->
      <div v-if="isOnline && !roomCode" class="mb-6 space-y-4">
        <button
          @click="$emit('create-room')"
          :disabled="isCreating"
          class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-600 text-white font-bold py-3 rounded-xl"
        >
          Create Room
        </button>

        <div class="flex w-full gap-2 pt-2">
          <input
            v-model="joinCode"
            type="text"
            placeholder="Enter room code"
            class="flex-1 min-w-0 bg-white/20 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
            maxlength="6"
            @input="joinCode = joinCode.toUpperCase()"
          />
          <button
            @click="$emit('join-room', joinCode)"
            :disabled="!joinCode"
            class="shrink-0 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg"
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
            Copy
          </button>
        </div>

        <!-- Lobby Player Count -->
        <div class="bg-white/10 rounded-lg p-3">
          <div class="flex items-center justify-between">
            <span class="text-white font-semibold">Players in Lobby:</span>
            <span class="text-green-400 font-bold text-lg">{{ lobbyPlayerCount }}</span>
          </div>
        </div>
      </div>

      <!-- Your Name Section -->
      <div class="mb-6">
        <label class="text-white font-semibold mb-2 block">Your Name</label>
        <input
          :value="localPlayerName"
          @change="$emit('update-local-name', ($event.target as HTMLInputElement).value)"
          type="text"
          class="w-full bg-white/20 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 placeholder-gray-400"
          placeholder="Enter your name"
        />
      </div>

      <!-- Players List (Local) -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <label class="text-white font-semibold">Players (Max 4)</label>
          <button
            v-if="!isOnline && players.length < 4"
            @click="$emit('add-player')"
            :disabled="!isHost"
            :class="[
              'text-white rounded-lg px-3 py-1',
              !isHost ? 'bg-green-500/50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
            ]"
          >
            Add Player
          </button>
        </div>

        <div class="space-y-2">
          <div v-for="(player, index) in (isOnline ? lobbyPlayers : players)" :key="index" class="flex gap-2">
            <input
              :value="player.name"
              @input="$emit('update-player', index, ($event.target as HTMLInputElement).value)"
              type="text"
              :disabled="isOnline || !isHost"
              :class="[
                'flex-1 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400',
                (isOnline || !isHost) ? 'bg-white/10 cursor-not-allowed' : 'bg-white/20'
              ]"
            />
            <button
              v-if="!isOnline && players.length > 1"
              @click="$emit('remove-player', index)"
              :disabled="!isHost"
              :class="[
                'text-white rounded-lg px-3 py-2',
                !isHost ? 'bg-red-500/50 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'
              ]"
            >
              Remove
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
          @click="$emit('start-game')"
          :disabled="!isHost"
          :class="[
            'flex-1 text-white font-bold py-3 rounded-xl',
            !isHost ? 'bg-green-500/50 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'
          ]"
        >
          {{ !isHost ? 'Waiting for Host...' : 'Start Game' }}
        </button>
      </div>

      <p v-if="message" class="mt-4 text-yellow-300 font-semibold text-center">{{ message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Player } from '../../../types/game';

const { currentGradientClass } = useTheme();

const props = defineProps<{
  isOnline: boolean;
  roomCode?: string;
  isCreating?: boolean;
  players: Player[];
  message?: string;
  lobbyPlayerCount: number | 0;
  lobbyPlayers: Player[];
  isHost?: boolean;
  localPlayerId?: string;
}>();

const joinCode = ref('');

const localPlayerName = computed(() => {
  if (props.isOnline) {
    const p = props.lobbyPlayers.find(p => p.id === props.localPlayerId);
    return p ? p.name : '';
  }
  return props.players[0]?.name || '';
});

defineEmits<{
  'create-room': [];
  'join-room': [code: string];
  'copy-code': [code: string];
  'add-player': [];
  'remove-player': [index: number];
  'update-player': [index: number, name: string];
  'update-local-name': [name: string];
  'start-game': [];
  'back': [];
}>();
</script>