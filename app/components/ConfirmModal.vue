<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" @click.self="$emit('cancel')">
    <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl mx-4 animate-bounce-in">
      <h2 class="text-2xl font-bold text-white mb-4">{{ title }}</h2>
      <p class="text-gray-200 mb-6">{{ message }}</p>
      
      <div class="flex gap-4">
        <button
          @click="$emit('cancel')"
          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
        >
          Cancel
        </button>
        <button
          @click="$emit('confirm')"
          class="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all"
        >
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean;
  title: string;
  message: string;
  confirmText?: string;
}>();

defineEmits<{
  'confirm': [];
  'cancel': [];
}>();
</script>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounce-in {
  0% { 
    transform: scale(0.8) translateY(-20px);
    opacity: 0;
  }
  50% {
    transform: scale(1.05) translateY(0);
  }
  100% { 
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-in-out;
}

.animate-bounce-in {
  animation: bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
</style>

