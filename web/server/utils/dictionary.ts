import fs from 'fs';
import path from 'path';
import type { WordValidationResponse } from '../../types/game';

const FALLBACK_WORDS = [
  'GAME', 'WORD', 'PLAY', 'START', 'BEGIN', 'CHESS', 'MAGIC', 'HELLO', 'WORLD', 'COMPUTER',
  'PHONE', 'MOUSE', 'KEYBOARD', 'SCREEN', 'TABLE', 'CHAIR', 'HOUSE', 'WATER', 'LIGHT', 'SOUND',
  'MUSIC', 'SONG', 'DANCE', 'PAINT', 'DRAW', 'WRITE', 'READ', 'BOOK', 'PAGE', 'PAPER',
  'LETTER', 'NUMBER', 'COUNT', 'MATH', 'SCIENCE', 'SPACE', 'EARTH', 'MOON', 'STAR', 'PLANET',
  'HUMAN', 'ANIMAL', 'PLANT', 'TREE', 'FLOWER', 'GRASS', 'LEAF', 'ROOT', 'SEED', 'FRUIT',
  'FOOD', 'BREAD', 'MEAT', 'FISH', 'RICE', 'SUGAR', 'SALT', 'PEPPER', 'SPICE', 'SAUCE',
  'DRINK', 'JUICE', 'COFFEE', 'TEA', 'MILK', 'CREAM', 'BUTTER', 'CHEESE', 'YOGURT', 'WINE',
  'BOTTLE', 'GLASS', 'CUP', 'PLATE', 'BOWL', 'SPOON', 'FORK', 'KNIFE', 'TOOL', 'HAMMER',
  'DRILL', 'SAW', 'NAIL', 'SCREW', 'BOLT', 'NUT', 'WIRE', 'ROPE', 'STRING', 'THREAD',
  'CLOTH', 'SHIRT', 'PANTS', 'DRESS', 'SKIRT', 'SHOE', 'BOOT', 'SOCK', 'HAT', 'CAP',
  'COAT', 'JACKET', 'SWEATER', 'GLOVE', 'SCARF', 'TIE', 'BELT', 'WATCH', 'RING', 'CHAIN',
  'GOLD', 'SILVER', 'BRONZE', 'COPPER', 'IRON', 'STEEL', 'METAL', 'STONE', 'ROCK', 'SAND',
  'DIRT', 'CLAY', 'MUD', 'DUST', 'SMOKE', 'FIRE', 'FLAME', 'BURN', 'HEAT', 'COLD',
  'ICE', 'SNOW', 'RAIN', 'WIND', 'STORM', 'CLOUD', 'SKY', 'AIR', 'OXYGEN', 'CARBON',
  'ATOM', 'MOLECULE', 'CELL', 'GENE', 'DNA', 'PROTEIN', 'ENZYME', 'VIRUS', 'BACTERIA', 'DISEASE',
  'HEALTH', 'DOCTOR', 'NURSE', 'HOSPITAL', 'MEDICINE', 'DRUG', 'PILL', 'CURE', 'PAIN', 'INJURY',
  'BONE', 'MUSCLE', 'SKIN', 'HAIR', 'EYE', 'EAR', 'NOSE', 'MOUTH', 'TOOTH', 'TONGUE',
  'HAND', 'FINGER', 'THUMB', 'ARM', 'LEG', 'FOOT', 'TOE', 'HEAD', 'NECK', 'CHEST',
  'HEART', 'LUNG', 'LIVER', 'KIDNEY', 'BRAIN', 'NERVE', 'BLOOD', 'VEIN', 'ARTERY', 'PULSE',
  'LIFE', 'DEATH', 'BIRTH', 'CHILD', 'BABY', 'PARENT', 'MOTHER', 'FATHER', 'SISTER', 'BROTHER',
  'FAMILY', 'FRIEND', 'PERSON', 'PEOPLE', 'MAN', 'WOMAN', 'BOY', 'GIRL', 'KING', 'QUEEN',
  'PRINCE', 'PRINCESS', 'LORD', 'LADY', 'MASTER', 'SERVANT', 'SLAVE', 'WORKER', 'FARMER', 'HUNTER',
  'SOLDIER', 'WARRIOR', 'KNIGHT', 'HERO', 'VILLAIN', 'THIEF', 'PIRATE', 'WIZARD', 'WITCH', 'FAIRY',
  'DRAGON', 'MONSTER', 'BEAST', 'CREATURE', 'SPIRIT', 'GHOST', 'ANGEL', 'DEMON', 'GOD', 'GODDESS',
  'TEMPLE', 'CHURCH', 'MOSQUE', 'SHRINE', 'ALTAR', 'PRAY', 'BLESS', 'CURSE', 'SPELL', 'CHARM',
  'POWER', 'FORCE', 'ENERGY', 'SPEED', 'STRENGTH', 'SKILL', 'TALENT', 'ABILITY', 'GIFT', 'LUCK',
  'CHANCE', 'FATE', 'DESTINY', 'FUTURE', 'PAST', 'PRESENT', 'TIME', 'YEAR', 'MONTH', 'WEEK',
  'DAY', 'HOUR', 'MINUTE', 'SECOND', 'MOMENT', 'INSTANT', 'PERIOD', 'AGE', 'ERA', 'EPOCH',
  'HISTORY', 'STORY', 'TALE', 'LEGEND', 'MYTH', 'FABLE', 'POEM', 'VERSE', 'RHYME', 'SONG',
  'TIGER', 'LION', 'BEAR', 'WOLF', 'DEER', 'HORSE', 'SHEEP', 'GOAT', 'RABBIT', 'SQUIRREL',
  'EAGLE', 'HAWK', 'OWL', 'CROW', 'RAVEN', 'DOVE', 'SWAN', 'DUCK', 'GOOSE', 'CHICKEN'
];

  let dictionaryCache: Set<string> | null = null;

  export function loadDictionary(): { size: number } {
    if (dictionaryCache) {
      console.log('[DICTIONARY] Using cached dictionary');
      return { size: dictionaryCache.size };
    }

    console.log('[DICTIONARY] Loading dictionary...');

    try {
      const publicPath = path.join(process.cwd(), 'public', 'dictionary.json');
      if (fs.existsSync(publicPath)) {
        console.log('[DICTIONARY] Found dictionary.json in public folder');
        const data = fs.readFileSync(publicPath, 'utf8');
        const words = JSON.parse(data);
        dictionaryCache = new Set(words.map((w: string) => w.toUpperCase()));
        console.log(`[DICTIONARY] ✓ Loaded ${dictionaryCache.size} words from file`);
        return { size: dictionaryCache.size };
      }
    } catch (err) {
      console.error('[DICTIONARY] ✗ Error loading dictionary.json:', err);
    }

    console.log('[DICTIONARY] Using fallback dictionary');
    dictionaryCache = new Set(FALLBACK_WORDS);
    console.log(`[DICTIONARY] ✓ Loaded ${dictionaryCache.size} fallback words`);
    return { size: dictionaryCache.size };
  }

export function validateWords(words: string[], usedWords: string[]): WordValidationResponse {
  const dictionary = dictionaryCache || new Set(FALLBACK_WORDS);
  const usedSet = new Set(usedWords.map(w => w.toUpperCase()));
  
  console.log(`[VALIDATION] Validating ${words.length} words...`);
  console.log(`[VALIDATION] Used words count: ${usedSet.size}`);

  const validWords = words.map(word => {
    const upperWord = word.toUpperCase();
    const isInDictionary = dictionary.has(upperWord);
    const alreadyUsed = usedSet.has(upperWord);
    const isValid = isInDictionary && !alreadyUsed;

    const status = alreadyUsed ? 'ALREADY USED ✗' : 
                  !isInDictionary ? 'NOT IN DICTIONARY ✗' : 
                  'VALID ✓';
    console.log(`[VALIDATION] "${word}": ${status}`);

    return {
      word,
      length: word.length,
      isValid,
      alreadyUsed
    };
  });

  const validOnly = validWords.filter(w => w.isValid);
  const longestValid = validOnly.length > 0 
    ? validOnly.reduce((a, b) => a.length > b.length ? a : b).word 
    : null;

  if (longestValid) {
    console.log(`[VALIDATION] ✓ Longest valid word: "${longestValid}" (${longestValid.length} letters)`);
  } else {
    console.log('[VALIDATION] ✗ No valid words found');
  }

  return { validWords, longestValid };
}