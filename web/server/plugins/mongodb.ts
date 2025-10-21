import mongoose from 'mongoose';

let isConnected = false;
let connectAttempted = false;

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig();
  
  if (isConnected) {
    console.log('[MONGODB] Already connected');
    return;
  }

  if (connectAttempted) {
    console.log('[MONGODB] Connection already attempted -> Failed');
    return;
  }

  console.log('[MONGODB] Attempting to connect...');
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 2000 }); // added timeout
    isConnected = true;
    console.log('[MONGODB] ✓ Connected successfully');
  } catch (err) {
    console.error('[MONGODB] ✗ Connection failed:', err);
    console.log('[MONGODB] → Online multiplayer will be disabled');
  }
  connectAttempted = true;
});

export function isMongoConnected(): boolean {
  console.log(`[MONGODB] Connection status: ${isConnected}`)
  return isConnected && mongoose.connection.readyState === 1;
}