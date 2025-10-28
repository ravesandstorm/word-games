# Welcome to Word Games!

This repo contains a collection of word games built with Nuxt 4, Vue 3, TypeScript, Tailwind CSS, and Socket.IO.

## [Live Demo](https://word-games-rave.onrender.com)

## Multiplayer Games
- Scrabble
- A custom Scrabble-like game called **Word Chain**

Which support:
- Local multiplayer (multiple players on the same device, passing turns)
- Across-device multiplayer when a MongoDB connection is present (games are stored in MongoDB and polled from clients)
- Host can configure game options (board size, rounds, players, etc.)

## Singleplayer Games
- Wordle
Guess the 5-letter word in 6 attempts, try to achieve a high score by winning multiple games in a row!

## How to run
1. Start MongoDB (optional). If you don't provide `MONGO_URI`, across-device features are disabled and the server will run in local-only mode.

2. Development Mode
```bash
cd web
npm i
npm run dev
```

3. Production Mode
```bash
cd web
npm i
npm run build
npm run start
```

Open the frontend at http://localhost:3000
