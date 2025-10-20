import { isMongoConnected } from '../plugins/mongodb';
import { loadDictionary } from '../utils/dictionary';

export default defineEventHandler(() => {
  console.log('[API] GET /api/status');
  
  const mongoAvailable = isMongoConnected();
  const dictionary = loadDictionary();
  
  return {
    mongoAvailable,
    dictionarySize: dictionary.size,
    timestamp: new Date().toISOString()
  };
});