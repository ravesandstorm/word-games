import { validateWords } from '../utils/dictionary';
import type { WordValidationRequest } from '../../types/game';

export default defineEventHandler(async (event) => {
  const body = await readBody<WordValidationRequest>(event);
  const { words, usedWords } = body;

  console.log(`[API] POST /api/validate-words - Validating ${words.length} words`);

  // Simulate 1000ms timeout
  await new Promise(resolve => setTimeout(resolve, 1000));

  const result = validateWords(words, usedWords);

  console.log(`[API] ✓ Validation complete - ${result.validWords.filter(w => w.isValid).length} valid words found`);

  return result;
});