## INSTALLATION INSTRUCTIONS
1. Create a new directory and navigate to it:
   mkdir word-chain-game && cd word-chain-game

2. Initialize package.json and install dependencies:
   npm init -y
   npm install nuxt vue @nuxtjs/tailwindcss mongoose socket.io socket.io-client
   npm install -D @types/node typescript

3. Create the directory structure:
   mkdir -p server/api/rooms server/models server/utils server/plugins
   mkdir -p pages components composables types public

4. Copy each file section above into its respective location

5. Create .env file (optional):
   MONGO_URI=mongodb://localhost:27017/wordchain

6. Start MongoDB (if using online mode):
   mongod

7. Run the development server:
   npm run dev

8. Open http://localhost:3000

## GAME FEATURES:
✓ Local multiplayer (multiple players on same device)
✓ Online multiplayer with room codes (requires MongoDB)
✓ Smart word validation (all combinations checked at once)
✓ Only validates words on same axis with existing letters
✓ Tracks used words (no repeats)
✓ Progressive difficulty (letter limit increases)
✓ Full keyboard controls
✓ Edit temporary letters without penalty
✓ Comprehensive console logging
✓ TypeScript for type safety
✓ Nuxt 4 with Vue 3 Composition API
✓ Server API routes with proper structure
✓ Modular component architecture

## CONSOLE LOG PREFIXES:
[APP]         - Application-level events
[GAME]        - Game state changes
[BOARD]       - Board operations
[PLAYER]      - Player management
[ROOM]        - Room operations
[INPUT]       - User input handling
[SUBMIT]      - Turn submission process
[VALIDATION]  - Word validation
[WORD-EXTRACTION] - Word extraction logic
[API]         - API endpoints
[MONGODB]     - Database operations
[DICTIONARY]  - Dictionary loading

## CONSOLE EXAMPLE OUTPUT:
[SUBMIT] ========== VALIDATION RESULTS ==========
[SUBMIT] 1. "MEAT" (4 letters) VALID ✓ ← LONGEST
[SUBMIT] 2. "EAT" (3 letters) VALID ✓
[SUBMIT] 3. "TEA" (3 letters) VALID ✓
[SUBMIT] 4. "GAME" (4 letters) ALREADY USED ✗
[SUBMIT] =======================================
[SUBMIT] ✓ Scoring word: "MEAT" (4 letters)
[SUBMIT] Marked "MEAT" as used
[SUBMIT] Total words used: 5