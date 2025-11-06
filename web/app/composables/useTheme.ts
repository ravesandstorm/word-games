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

  // Get hyperspeed cars colors for theme in 0x hex format (left and right)
  const getHyperspeedColors = computed(() => {
    const colors: Record<
      Theme,
      { left: number[]; right: number[]; background: number; sticks: number }
    > = {
      purple: {
        left: [0xff00cc, 0xbd00ff, 0xff3399],
        right: [0x00f7ff, 0x0099ff, 0x0066ff],
        background: 0x0d0221, 
        sticks: 0x00f7ff,
      },
      blue: {
        left: [0xdc5b20, 0xdca320, 0xdc2020],
        right: [0x334bf7, 0xe5e6ed, 0xbfc6f3],
        background: 0x0b4547,
        sticks: 0xc5e8eb,
      },
      green: {
        left: [0x39ff14, 0x00cc44, 0xadff2f],
        right: [0xffe8a3, 0xffd6a5, 0xffbd69],
        background: 0x0a1f0d,
        sticks: 0xffe8a3,
      },
      orange: {
        left: [0xff5500, 0xff3300, 0xff7700],
        right: [0xdadafa, 0xbebae3, 0x8f97e4],
        background: 0x1f1209,
        sticks: 0xdadafa,
      },
      pink: {
        left: [0xff073a, 0xd60058, 0xff4081],
        right: [0xcbffed, 0xa3ffe3, 0x70e0c8],
        background: 0x1f0510,
        sticks: 0xcbffed,
      },
      light: {
        left: [0x7d0d1b, 0xa90519, 0xff102a],
        right: [0xf1eece, 0xe6e2b1, 0xdfd98a],
        background: 0x0b4547,
        sticks: 0xf1eece,
      },
    };
    return colors[currentTheme.value];
  });

  return {
    currentTheme,
    setTheme,
    getGradientClass,
    getAccentColor,
    getHyperspeedColors
  };
}