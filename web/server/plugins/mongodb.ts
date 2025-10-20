import mongoose from 'mongoose';

let isConnected = false;

export default defineNitroPlugin(async () => {
  const config = useRuntimeConfig();
  
  if (isConnected) {
    console.log('[MONGODB] Already connected');
    return;
  }

  try {
    await mongoose.connect(config.mongoUri);
    isConnected = true;
    console.log('[MONGODB] ✓ Connected successfully');
  } catch (err) {
    console.error('[MONGODB] ✗ Connection failed:', err);
    console.log('[MONGODB] → Online multiplayer will be disabled');
  }
});

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}