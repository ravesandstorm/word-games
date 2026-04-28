export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "nuxt-lottie"],
  lottie: {
    lottieFolder: "/assets/lottie",
  },
  runtimeConfig: {
    mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/wordchain",
    public: {
      apiBase: process.env.API_BASE_URL || "http://localhost:3000",
    },
  },

  nitro: {
    experimental: {
      websocket: true,
    },
  },
  ssr: true,
  app: {
    head: {
      title: "Word Chain Game",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
      ],
    },
  },

  compatibilityDate: "2024-11-01",
});