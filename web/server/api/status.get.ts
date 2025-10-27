import { isMongoConnected } from '../plugins/mongodb'
import { loadDictionary } from '../utils/dictionary'
import { loadWordleDictionary } from '../utils/wordleDict'

export default defineEventHandler(async (event) => {
  //read event body without readBody as http functions are rejected, readmmultipartformdata returns undefined
  const origin = event._path?.split('?origin=')[1]
  
  console.log('[API] GET /api/status from origin:', origin)

  if (origin === 'wordle') {
    const mongoAvailable = await isMongoConnected()
    const wordleDictionaryInfo = await loadWordleDictionary()
    return {
      mongoAvailable,
      wordleDictionarySize: wordleDictionaryInfo.size,
      timestamp: new Date().toISOString()
    }
  }
  else if (origin === 'scrabble' || origin === 'wordchain') {
    const mongoAvailable = await isMongoConnected()
    const dictionaryInfo = await loadDictionary()
    
    return {
      mongoAvailable,
      dictionarySize: dictionaryInfo.size,
      timestamp: new Date().toISOString()
    }
  }
})