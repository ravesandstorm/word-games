<template>
  <div class="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl">
      <h1 class="text-4xl font-bold text-white mb-8 text-center">Word Chain</h1>
      
      <div class="space-y-4">
        <button
          @click="$emit('local-game')"
          class="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Local Multiplayer
        </button>
        
        <button
          @click="$emit('online-game')"
          :disabled="!mongoAvailable"
          :class="[
            'w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all',
            mongoAvailable 
              ? 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105' 
              : 'bg-gray-500 cursor-not-allowed text-gray-300'
          ]"
        >
          <svg v-if="mongoAvailable" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
          </svg>
          Online Multiplayer {{ !mongoAvailable ? '(Disabled)' : '' }}
        </button>
      </div>
      
      <p v-if="message" class="mt-4 text-yellow-300 text-center">{{ message }}</p>
      <p class="mt-6 text-gray-300 text-sm text-center">
        Dictionary: {{ dictionarySize }} words loaded
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  mongoAvailable: boolean;
  dictionarySize: number;
  message?: string;
}>();

defineEmits<{
  'local-game': [];
  'online-game': [];
}>();
</script>