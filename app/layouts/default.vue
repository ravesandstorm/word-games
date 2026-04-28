<template>
  <div :class="['min-h-screen bg-gradient-to-br transition-all duration-500 relative', currentGradientClass]">
    <!-- Header with Theme Selector -->
    <header v-if="!route.meta.hideHeader && !hideHeader" class="header">
      <div class="header-content">
        <div class="header-inner">
          <div>
            <h1>Word Games Collection</h1>
            <p>Challenge your vocabulary and have fun!</p>
          </div>

          <!-- Theme Selector -->
          <div class="theme-selector">
            <span>Theme:</span>
            <button v-for="themeOption in themes" :key="themeOption.name" @click="setTheme(themeOption.name)"
              :class="[
                'w-10 h-10 rounded-full border-2 transition-all transform hover:scale-110',
                currentTheme === themeOption.name ? 'border-white scale-110' : 'border-transparent',
                themeOption.color
              ]" 
              :title="themeOption.label" 
            />
          </div>
        </div>
      </div>
    </header>
    <!-- Main Content -->
    <slot />
  </div>
</template>

<script setup lang="ts">
  const route = useRoute();
  const { setTheme, currentGradientClass, currentTheme, themes } = useTheme();

  // Shared state to dynamically hide header on certain pages
  const hideHeader = useState('hideHeader', () => false);
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out;
}

.header {
  @apply bg-white/10 backdrop-blur-lg border-b border-white/20 relative z-10;
}

.header-content {
  @apply max-w-7xl mx-auto px-4 py-6;
}

.header-inner {
  @apply flex justify-between items-center;
}

.header-inner h1 {
  @apply text-4xl font-bold text-white mb-1 animate-fade-in;
}

.header-inner p {
  @apply text-gray-300 text-sm;
}

.theme-selector {
  @apply flex gap-2 items-center p-2;
}

.theme-selector span {
  @apply text-white text-sm mr-2;
}

@media (max-width: 768px) {
  .header {
    @apply text-center;
  }

  .header-inner {
    @apply flex-col gap-4;
  }
}
</style>