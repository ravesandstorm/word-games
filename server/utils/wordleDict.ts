import fs from 'fs'
import path from 'path'

const FALLBACK_WORDS = [
  'BEAST', 'CREASE', 'START'
]

  let dictionaryCache: Set<string> | null = null

  export function loadWordleDictionary(): { size: number } {
    if (dictionaryCache) {
      console.log('[DICTIONARY] Using cached dictionary')
      return { size: dictionaryCache.size }
    }

    console.log('[DICTIONARY] Loading dictionary...')

    try {
      const publicPath = path.join(process.cwd(), 'public', 'wordleDict.json')
      if (fs.existsSync(publicPath)) {
        console.log('[DICTIONARY] Found wordleDict.json in public folder')
        const data = fs.readFileSync(publicPath, 'utf8')
        const words = JSON.parse(data)
        dictionaryCache = new Set(words.map((w: string) => w.toUpperCase()))
        console.log(`[DICTIONARY] ✓ Loaded ${dictionaryCache.size} words from file`)
        return { size: dictionaryCache.size }
      }
    } catch (err) {
      console.error('[DICTIONARY] ✗ Error loading wordleDict.json:', err)
    }

    console.log('[DICTIONARY] Using fallback dictionary')
    dictionaryCache = new Set(FALLBACK_WORDS)
    console.log(`[DICTIONARY] ✓ Loaded ${dictionaryCache.size} fallback words`)
    return { size: dictionaryCache.size }
  }

export function validateWordleWord(words: string[]): boolean {
  const dictionary = dictionaryCache || new Set(FALLBACK_WORDS)

  const upperWord = words[0]!.toUpperCase()
  const isInDictionary = dictionary.has(upperWord)

  const status = !isInDictionary ? 'INVALID ✗' : 'VALID ✓'
  console.log(`[VALIDATION] "${upperWord}": ${status}`)

  return isInDictionary
}