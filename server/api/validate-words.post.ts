import { validateWords } from '../utils/dictionary';
import { validateWordleWord } from '../utils/wordleDict'
import type { WordValidationRequest } from '../../types/game';

export default defineEventHandler(async (event) => {
  const body = await readBody<WordValidationRequest>(event);
  const { words, usedWords, wordle } = body;

  console.log(`[API] POST /api/validate-words - Validating ${words.length} words`);

  var result = null;
  if (wordle) {
    result = validateWordleWord(words);
    console.log(`[API] ✓ Validation complete - ${result ? 'VALID' : 'INVALID'}`);
  }
  else {
    result = validateWords(words, usedWords);
    console.log(`[API] ✓ Validation complete - ${result.validWords.filter(w => w.isValid).length} valid words found`);
  }

  return result;
});