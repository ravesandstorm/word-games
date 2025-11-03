<template>
  <div :class="['min-h-screen bg-gradient-to-br transition-all duration-500', theme.getGradientClass.value]">
    <!-- Header with Theme Selector -->
    <header class="bg-white/10 backdrop-blur-lg border-b border-white/20">
      <div class="max-w-7xl mx-auto px-4 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-4xl font-bold text-white mb-1 animate-fade-in">Word Games Collection</h1>
            <p class="text-gray-300 text-sm">Challenge your vocabulary and have fun!</p>
          </div>

          <!-- Theme Selector -->
          <div class="flex gap-2 items-center">
            <span class="text-white text-sm mr-2">Theme:</span>
            <button
              v-for="themeOption in themes"
              :key="themeOption.name"
              @click="theme.setTheme(themeOption.name)"
              :class="[
                'w-10 h-10 rounded-full border-2 transition-all transform hover:scale-110',
                theme.currentTheme.value === themeOption.name ? 'border-white scale-110' : 'border-transparent',
                themeOption.color
              ]"
              :title="themeOption.label"
            />
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Game Cards -->
        <div
          v-for="game in games"
          :key="game.id"
          @mouseenter="hoveredGame = game.id"
          @mouseleave="hoveredGame = null"
          class="group relative bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl cursor-pointer"
          @click="navigateToGame(game.route)"
        >
          <!-- Game Image/Icon -->
          <div class="h-48 bg-gradient-to-br overflow-hidden relative" :class="game.gradient">
            <div class="absolute inset-0 flex items-center justify-center">
              <div class="text-8xl opacity-20 group-hover:opacity-30 transition-opacity">
                {{ game.icon }}
              </div>
            </div>

            <!-- Hover Overlay -->
            <div
              :class="[
                'absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300',
                hoveredGame === game.id ? 'opacity-100' : 'opacity-0'
              ]"
            >
              <div class="text-center px-6">
                <p class="text-white text-sm leading-relaxed">{{ game.description }}</p>
                <div class="mt-4 flex flex-wrap gap-2 justify-center">
                  <span
                    v-for="feature in game.features"
                    :key="feature"
                    class="bg-white/20 text-white text-xs px-3 py-1 rounded-full"
                  >
                    {{ feature }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Game Info -->
          <div class="p-6">
            <h3 class="text-2xl font-bold text-white mb-2 group-hover:text-yellow-300 transition-colors">
              {{ game.name }}
            </h3>
            <p class="text-gray-300 text-sm mb-4">{{ game.tagline }}</p>

            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-yellow-400 text-sm">{{ game.difficulty }}</span>
                <span class="text-gray-400 text-xs">•</span>
                <span class="text-gray-400 text-sm">{{ game.players }}</span>
              </div>

              <button
                :class="[
                  'px-4 py-2 rounded-lg font-semibold text-sm transition-all transform group-hover:scale-110',
                  theme.getAccentColor.value,
                  'text-white'
                ]"
              >
                Play Now →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Info -->
      <div class="mt-16 text-center">
        <div class="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-2xl mx-auto">
          <h2 class="text-2xl font-bold text-white mb-4">About Word Games</h2>
          <p class="text-gray-300 leading-relaxed mb-4">
            Welcome to our collection of word games! Challenge yourself with classic games like Wordle,
            test your vocabulary with Word Chain, or compete with friends in Scrabble. Each game offers
            unique challenges and endless fun.
          </p>
          <div class="flex justify-center gap-4 text-sm text-gray-400">
            <span>🎮 3 Games</span>
            <span>•</span>
            <span>🌐 Online & Local Play</span>
            <span>•</span>
            <span>📊 Track Your Progress</span>
          </div>
        </div>
      </div>
    </main>

    <!-- <footer class="h-96 z-0" >
      <div class="hyperspeed-container w-full h-full top-0 left-0">
          <Hyperspeed 
            :effect-options="customOptions"
          />
      </div>
    </footer> -->
  </div>
</template>

<script setup lang="ts">
import { hyperspeedPresets } from '../../utils/HyperspeedPresets'
const effectOptions = ref(hyperspeedPresets.one)

const customOptions = ref({
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.03, 400 * 0.2],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
      roadColor: 0xffffff,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0xffffff,
      brokenLines: 0xffffff,
      leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
      rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
      sticks: 0x03b3c3,
    },
  })

const theme = useTheme();
const hoveredGame = ref<string | null>(null);

const themes = [
  { name: 'purple' as const, label: 'Purple', color: 'bg-purple-500' },
  { name: 'blue' as const, label: 'Blue', color: 'bg-blue-500' },
  { name: 'green' as const, label: 'Green', color: 'bg-green-500' },
  { name: 'orange' as const, label: 'Orange', color: 'bg-orange-500' },
  { name: 'pink' as const, label: 'Pink', color: 'bg-pink-500' }
];

const games = [
  {
    id: 'wordchain',
    name: 'Word Chain',
    tagline: 'Build words, chain letters, score big!',
    description: 'Place letters on the board to form words. Each word must connect to existing letters. Longer words score more points!',
    icon: '🔗',
    gradient: 'from-purple-600 to-blue-600',
    route: '/wordchain',
    difficulty: '⭐⭐⭐',
    players: '1-4 Players',
    features: ['Strategic', 'Multiplayer', 'Online']
  },
  {
    id: 'scrabble',
    name: 'Scrabble',
    tagline: 'Classic word-building at its finest',
    description: 'The timeless classic! Draw tiles, form words, and use multipliers strategically. Play locally or online with up to 3 players.',
    icon: '📝',
    gradient: 'from-green-600 to-teal-600',
    route: '/scrabble',
    difficulty: '⭐⭐⭐⭐',
    players: '1-3 Players',
    features: ['Classic', 'Multipliers', 'Tile Bag']
  },
  {
    id: 'wordle',
    name: 'Wordle',
    tagline: 'Guess the word in 6 tries',
    description: 'Guess the 5-letter word in 6 attempts. Green means correct position, yellow means wrong position. Track your win streak!',
    icon: '🎯',
    gradient: 'from-indigo-600 to-purple-600',
    route: '/wordle',
    difficulty: '⭐⭐',
    players: 'Solo',
    features: ['Daily Challenge', 'Win Streak', 'Quick Play']
  }
];

const navigateToGame = (route: string) => {
  navigateTo(route);
};
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

.hyperspeed-container {
  width: 100%;
  height: 100%;
  cursor: pointer;
}
</style>
