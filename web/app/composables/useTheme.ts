export type Theme = 'purple' | 'blue' | 'green' | 'orange' | 'pink';

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
      purple: 'from-purple-900 via-blue-900 to-indigo-900',
      blue: 'from-blue-900 via-cyan-900 to-teal-900',
      green: 'from-green-900 via-teal-900 to-emerald-900',
      orange: 'from-orange-900 via-red-900 to-pink-900',
      pink: 'from-pink-900 via-purple-900 to-indigo-900'
    };
    return gradients[currentTheme.value];
  });

  // Get accent color for theme
  const getAccentColor = computed(() => {
    const colors: Record<Theme, string> = {
      purple: 'bg-purple-500 hover:bg-purple-600',
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
      pink: 'bg-pink-500 hover:bg-pink-600'
    };
    return colors[currentTheme.value];
  });

  return {
    currentTheme,
    setTheme,
    getGradientClass,
    getAccentColor
  };
}

