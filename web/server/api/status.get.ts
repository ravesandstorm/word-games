import { isMongoConnected } from '../plugins/mongodb';
import { loadDictionary } from '../utils/dictionary';
import { loadWordleDictionary } from '../utils/wordleDict';

export default defineEventHandler(async () => {
  console.log('[API] GET /api/status');
  
  const mongoAvailable = await isMongoConnected();
  const dictionaryInfo = await loadDictionary();
  const wordleDictionaryInfo = await loadWordleDictionary();
  
  return {
    mongoAvailable,
    dictionarySize: dictionaryInfo.size,
    wordleDictionarySize: wordleDictionaryInfo.size,
    timestamp: new Date().toISOString()
  };
});