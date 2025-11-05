export type Theme = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'light';

export function useTheme() {
  const currentTheme = ref<Theme>('purple');

  // Load theme from localStorage on mount
  onMounted(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('word-games-theme') as Theme;
      if (savedTheme) {
        currentTheme.value = savedTheme;
      }
    }
  });

  // Save theme to localStorage
  const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    if (typeof window !== 'undefined') {
      localStorage.setItem('word-games-theme', theme);
    }
    console.log(`[THEME] Changed to: ${theme}`);
  };

  // Get gradient classes for theme
  const getGradientClass = computed(() => {
    const gradients: Record<Theme, string> = {
      purple: "from-purple-900/85 via-indigo-950/80 to-violet-950/85",
      blue: "from-blue-950/85 via-cyan-900/80 to-sky-950/85",
      green: "from-emerald-950/85 via-teal-900/80 to-green-950/85",
      orange: "from-amber-900/85 via-orange-950/80 to-rose-950/85",
      pink: "from-pink-900/85 via-fuchsia-950/80 to-purple-950/85",
      light: "from-gray-900/85 via-gray-800/80 to-gray-700/85"
    };
    return gradients[currentTheme.value];
  });

  // Get accent color for theme
const getAccentColor = computed(() => {
  const colors: Record<Theme, string> = {
    purple:
      "bg-purple-600 hover:bg-violet-700 active:bg-purple-800 ring-2 ring-purple-400/30 hover:ring-purple-300/40",
    blue: "bg-blue-600 hover:bg-sky-700 active:bg-blue-800 ring-2 ring-blue-400/30 hover:ring-blue-300/40",
    green:
      "bg-emerald-600 hover:bg-teal-700 active:bg-emerald-800 ring-2 ring-emerald-400/30 hover:ring-emerald-300/40",
    orange:
      "bg-amber-600 hover:bg-orange-700 active:bg-amber-800 ring-2 ring-amber-400/30 hover:ring-amber-300/40",
    pink: "bg-pink-600 hover:bg-fuchsia-700 active:bg-pink-800 ring-2 ring-pink-400/30 hover:ring-pink-300/40",
    light: "bg-gray-600 hover:bg-gray-700 active:bg-gray-800 ring-2 ring-gray-400/30 hover:ring-gray-300/40"
  };
  return colors[currentTheme.value];
});

  // Get hyperspeed background color for theme (in 0x hex format)
  const getHyperspeedBgColor = computed(() => {
    const colors: Record<Theme, number> = {
      purple: 0x1a0a2e ,  // Dark purple
      blue: 0x0a1929,    // Dark blue
      green: 0x0a1f1a,   // Dark green
      orange: 0x1f1209,  // Dark orange
      pink: 0x1f0a1a,     // Dark pink
      light: 0x1a1a1a,
    };
    return colors[currentTheme.value];
  });

  return {
    currentTheme,
    setTheme,
    getGradientClass,
    getAccentColor,
    getHyperspeedBgColor
  };
}