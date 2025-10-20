# Lexiladder — simple fullstack implementation

This repo contains a small fullstack implementation of your custom Scrabble-like game (suggested name: **Lexiladder**).
It supports:
- Local multiplayer (multiple players on the same device, passing turns)
- Across-device multiplayer when a MongoDB connection is present (games are stored in MongoDB and polled from clients)
- Host can configure game options (board size, rounds, players, etc.)


## Structure (this single file contains all snippets you can split into files)
- `frontend/` — React app (uses Tailwind classes; you can drop Tailwind or replace styles)
  - `src/App.jsx` — main component
  - `src/index.css` — minimal styles (or Tailwind)
- `backend/` — Express server
  - `server.js` — server + routes
  - `models/Game.js` — mongoose schema


## Quick start (development)
1. Start MongoDB (optional). If you don't provide `MONGO_URI`, across-device features are disabled and the server will run in local-only mode.

2. Backend
```bash
cd backend
npm init -y
npm i express mongoose cors body-parser
# optional: install nodemon
MONGO_URI="mongodb://..." node server.js
```

3. Frontend (use Vite or Create React App)
```bash
cd frontend
# with Vite + React
npm create vite@latest . --template react
npm i
# copy src/App.jsx and src/index.css into your project
npm run dev
```

Open the frontend (usually http://localhost:5173) and backend at http://localhost:4000