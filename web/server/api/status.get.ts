import { isMongoConnected } from '../plugins/mongodb';
import { loadDictionary } from '../utils/dictionary';

export default defineEventHandler(async () => {
  console.log('[API] GET /api/status');
  
  const mongoAvailable = await isMongoConnected();
  const dictionaryInfo = await loadDictionary();
  
  return {
    mongoAvailable,
    dictionarySize: dictionaryInfo.size,
    timestamp: new Date().toISOString()
  };
});