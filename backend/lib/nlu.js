const { DESTINATIONS } = require('./knowledgeBase');

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'at',
  'for', 'and', 'or', 'but', 'i', 'me', 'my', 'you', 'your', 'it', 'do', 'does',
  'can', 'could', 'would', 'should', 'will', 'please', 'tell', 'about', 'with'
]);

const DEST_ALIASES = {
  sigiriya: ['lion rock', 'rock fortress', 'sigiri'],
  ella: ['nine arch', 'little adams', 'ella rock', 'rawana falls'],
  kandy: ['tooth temple', 'tooth relic', 'peradeniya', 'dalada'],
  galle: ['galle fort', 'dutch fort'],
  mirissa: ['parrot rock', 'coconut tree hill'],
  colombo: ['pettah', 'galle face', 'gangaramaya', 'beira lake'],
  trincomalee: ['trinco', 'pigeon island', 'nilaveli', 'uppuveli'],
  nuwaraEliya: ['nuwara', 'little england'],
  yala: ['leopard safari', 'yala national park', 'yala block'],
  anuradhapura: ['maha bodhi', 'ruwanwelisaya'],
  polonnaruwa: ['gal vihara', 'vatadage'],
  minneriya: ['the gathering', 'elephant gathering'],
  arugamBay: ['arugam', 'a-bay', 'main point surf', 'pottuvil'],
  jaffna: ['nallur', 'jaffna fort', 'jaffna crab curry', 'point pedro'],
  kataragama: ['fire walking', 'kavadi'],
  adamsPeak: ["adam's peak", 'sri pada', 'sacred mountain footprint'],
  hortonPlains: ['horton plains', "world's end", 'bakers falls'],
  sinharaja: ['sinharaja'],
  wilpattu: ['wilpattu'],
  kalpitiya: ['kalpitiya'],
  dambulla: ['cave temple', 'golden temple'],
  bentota: ['brief garden', 'lunuganga'],
  hikkaduwa: ['hikkaduwa', 'hikka'],
  tangalle: ['rekawa turtle'],
  hambantota: ['bundala']
};

const DAY_WORD_NUM = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, fourteen: 14, twenty: 20
};

const TICKET_TYPES = ['adult', 'child', 'children', 'senior', 'student', 'group', 'infant'];

const NEGATIVE_WORDS = {
  'angry': 2, 'furious': 3, 'terrible': 2, 'awful': 2, 'horrible': 2.5,
  'worst': 2.5, 'hate': 2, 'scam': 2, 'scammed': 2.5, 'cheated': 2.5,
  'ripped off': 2.5, 'rude': 1.5, 'useless': 2, 'broken': 1.5, 'frustrated': 2,
  'frustrating': 2, 'annoyed': 1.5, 'annoying': 1.5, 'disappointed': 1.5,
  'disappointing': 1.5, 'unacceptable': 2, 'refund': 0.5, 'cancel': 0.5,
  'problem': 1, 'issue': 0.8, 'wrong': 1, 'never': 0.5, 'waste': 1.5,
  'complain': 1.5, 'complaint': 1.5, 'unsafe': 2, 'scared': 1.5, 'worried': 1,
  'lost': 0.8, 'stuck': 1, 'stranded': 2, 'emergency': 2.5, 'help me': 1,
  'not working': 1.5, "doesn't work": 1.5, 'sad': 1, 'upset': 1.5
};

const POSITIVE_WORDS = {
  'thanks': 1, 'thank you': 1.2, 'great': 1, 'awesome': 1.3, 'amazing': 1.5,
  'perfect': 1.3, 'excellent': 1.4, 'love': 1.3, 'wonderful': 1.3,
  'fantastic': 1.4, 'helpful': 1, 'nice': 0.8, 'cool': 0.7, 'good': 0.8,
  'beautiful': 1, 'happy': 1, 'excited': 1.1, 'wow': 0.8, 'best': 1.2
};

const NEGATORS = new Set(['not', "n't", 'no', 'never', 'without']);
const INTENSIFIERS = new Set(['very', 'really', 'extremely', 'so', 'absolutely', 'totally']);

const NEGATIVE_PHRASES = Object.entries(NEGATIVE_WORDS).filter(([k]) => k.includes(' '));
const POSITIVE_PHRASES = Object.entries(POSITIVE_WORDS).filter(([k]) => k.includes(' '));

let cachedDestinations = null;

function getCachedDestinations() {
  if (!cachedDestinations) {
    cachedDestinations = Object.entries(DESTINATIONS).map(([key, val]) => ({
      key,
      lowerKey: key.toLowerCase(),
      lowerName: val.name.toLowerCase(),
      firstNameOfName: val.name.toLowerCase().split(' ')[0],
      aliases: DEST_ALIASES[key] || []
    }));
  }
  return cachedDestinations;
}

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text) {
  return normalize(text).split(' ').filter(Boolean);
}

function contentWords(text) {
  return tokenize(text).filter(w => !STOPWORDS.has(w));
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  let prevRow = Array.from({ length: bl + 1 }, (_, i) => i);
  let currRow = new Array(bl + 1);

  for (let i = 1; i <= al; i++) {
    currRow[0] = i;
    for (let j = 1; j <= bl; j++) {
      currRow[j] = Math.min(
        prevRow[j] + 1,
        currRow[j - 1] + 1,
        prevRow[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }
  return prevRow[bl];
}

function fuzzyEquals(word, target) {
  if (!word || !target) return false;
  if (word === target) return true;
  if (STOPWORDS.has(word) || word.length < 5) return false;
  const maxDist = target.length <= 7 ? 1 : target.length <= 10 ? 2 : 3;
  return levenshtein(word, target) <= maxDist;
}

function fuzzyIncludes(text, phrase) {
  if (text.includes(phrase)) return true;
  if (phrase.includes(' ') || phrase.length < 5) return false;
  return tokenize(text).some(w => fuzzyEquals(w, phrase));
}

function any(text, ...phrases) {
  return phrases.some(p => fuzzyIncludes(text, p));
}

function extractDestination(textNorm) {
  const dests = getCachedDestinations();

  for (const dest of dests) {
    if (textNorm.includes(dest.lowerName) || textNorm.includes(dest.lowerKey)) {
      return dest.key;
    }
    if (dest.aliases.some(a => textNorm.includes(a))) {
      return dest.key;
    }
  }

  const words = tokenize(textNorm);
  for (const w of words) {
    if (w.length < 5) continue;
    for (const dest of dests) {
      if (fuzzyEquals(w, dest.lowerKey) || fuzzyEquals(w, dest.firstNameOfName)) {
        return dest.key;
      }
    }
  }
  return null;
}

function extractDuration(textNorm) {
  const numMatch = textNorm.match(/(\d+)\s*-?\s*(day|days|night|nights|week|weeks)/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    const unit = numMatch[2].startsWith('week') ? 'week' : 'day';
    return { value: n, unit, days: unit === 'week' ? n * 7 : n };
  }
  const wordMatch = textNorm.match(/(one|two|three|four|five|six|seven|eight|nine|ten|fourteen|twenty)\s*-?\s*(day|days|night|nights|week|weeks)/);
  if (wordMatch) {
    const n = DAY_WORD_NUM[wordMatch[1]];
    const unit = wordMatch[2].startsWith('week') ? 'week' : 'day';
    return { value: n, unit, days: unit === 'week' ? n * 7 : n };
  }
  if (/\bfortnight\b/.test(textNorm)) return { value: 2, unit: 'week', days: 14 };
  if (/\bweekend\b/.test(textNorm)) return { value: 3, unit: 'day', days: 3 };
  if (/\ba week\b|\bone week\b/.test(textNorm)) return { value: 1, unit: 'week', days: 7 };
  return null;
}

function extractTicketType(textNorm) {
  for (const t of TICKET_TYPES) {
    if (textNorm.includes(t)) return t.replace('children', 'child');
  }
  return null;
}

function extractPeopleCount(textNorm) {
  const m = textNorm.match(/(\d+)\s*(people|persons|person|pax|travellers|travelers|adults|guests)/);
  if (m) return parseInt(m[1], 10);
  return null;
}

function extractBudgetLevel(textNorm) {
  if (any(textNorm, 'luxury', 'high end', 'premium', 'five star', '5 star')) return 'luxury';
  if (any(textNorm, 'budget', 'cheap', 'cheapest', 'backpacker', 'low cost')) return 'budget';
  if (any(textNorm, 'mid range', 'moderate', 'comfortable')) return 'mid-range';
  return null;
}

function analyzeSentiment(textNorm, rawText) {
  const words = textNorm.split(' ');
  let score = 0;
  let intensity = 1;
  let negate = false;
  const hits = [];

  for (const [phrase, weight] of NEGATIVE_PHRASES) {
    if (textNorm.includes(phrase)) {
      score -= weight;
      hits.push(phrase);
    }
  }
  for (const [phrase, weight] of POSITIVE_PHRASES) {
    if (textNorm.includes(phrase)) {
      score += weight;
      hits.push(phrase);
    }
  }

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (NEGATORS.has(w)) {
      negate = true;
      continue;
    }
    if (INTENSIFIERS.has(w)) {
      intensity = 1.5;
      continue;
    }

    let weight = 0;
    if (NEGATIVE_WORDS[w] !== undefined) {
      weight = -NEGATIVE_WORDS[w];
    } else if (POSITIVE_WORDS[w] !== undefined) {
      weight = POSITIVE_WORDS[w];
    }

    if (weight !== 0) {
      const applied = (negate ? -weight : weight) * intensity;
      score += applied;
      hits.push(w);
      negate = false;
      intensity = 1;
    }
  }

  const exclaims = (rawText.match(/!/g) || []).length;
  if (exclaims >= 2 && score < 0) score -= 0.5;

  const normalized = Math.max(-1, Math.min(1, score / 3));

  let label = 'neutral';
  if (normalized <= -0.6) label = 'very_negative';
  else if (normalized <= -0.2) label = 'negative';
  else if (normalized >= 0.6) label = 'very_positive';
  else if (normalized >= 0.2) label = 'positive';

  const escalate = normalized <= -0.5 || (
    normalized <= -0.2 &&
    hits.some(h => [
      'scam', 'scammed', 'cheated', 'ripped off',
      'unsafe', 'emergency', 'stranded'
    ].includes(h))
  );

  const capsRatio = (() => {
    const letters = rawText.replace(/[^a-z]/gi, '');
    return letters.length > 6 ? (rawText.match(/[A-Z]/g) || []).length / letters.length : 0;
  })();

  return { score: normalized, label, escalate, signals: hits, capsRatio };
}

const INTENT_DEFS = [
  {
    intent: 'greeting',
    test: (t) => /^(hi|hello|hey|ayubowan|hiya|greetings?|good\s?(morning|evening|afternoon|day)|howdy|sup|yo)\b/.test(t) || t === 'hi' || t === 'hello',
    weight: 1
  },
  {
    intent: 'thanks',
    test: (t) => /^(thanks|thank you|thx|ty|cheers)\b/.test(t),
    weight: 1
  },
  {
    intent: 'farewell',
    test: (t) => /^(bye|goodbye|see ya|see you|later|gtg|good night)\b/.test(t) || /\b(bye|goodbye|gtg|good night)\b/.test(t),
    weight: 1.1
  },
  {
    intent: 'affirm',
    test: (t) => /^(yes|yeah|yep|sure|ok|okay|alright|sounds good|please do|go ahead)\b/.test(t) && !/\b(bye|goodbye|gtg|good night)\b/.test(t),
    weight: 0.9
  },
  {
    intent: 'deny',
    test: (t) => /^(no|nope|nah|not really|no thanks)\b/.test(t),
    weight: 0.9
  },
  {
    intent: 'help',
    test: (t) => any(t, 'help', 'what can you', 'what do you do', 'capabilities', 'how do you work', 'what do you know', 'tell me about yourself', 'who are you'),
    weight: 1
  },
  {
    intent: 'human_handoff',
    test: (t) => any(t, 'talk to a human', 'real person', 'human agent', 'speak to someone', 'customer service', 'live agent', 'representative'),
    weight: 1.3
  },
  {
    intent: 'destination_info',
    test: (t) => extractDestination(t) !== null,
    weight: 1.2
  },
  {
    intent: 'food',
    test: (t) => any(t, 'food', 'eat', 'eating', 'cuisine', 'dish', 'meal', 'restaurant', 'hungry', 'menu', 'local food', 'street food', 'vegetarian', 'vegan', 'kottu', 'hoppers', 'rice and curry', 'curry', 'seafood', 'what to eat', 'dining', 'breakfast', 'lunch', 'dinner', 'snack'),
    weight: 1
  },
  {
    intent: 'transport',
    test: (t) => any(t, 'transport', 'get around', 'tuk tuk', 'three wheel', 'train', 'bus', 'taxi', 'drive', 'driving', 'pickme', 'uber', 'how to get', 'getting there', 'ferry', 'flight', 'fly to', 'boat', 'fuel', 'mileage', 'km/l', 'kmpl', 'petrol', 'diesel', 'fuel cost', 'fuel efficiency', 'rent a car', 'self drive', 'chauffeur') || /\bhow (do|can|would|to) i get\b|\bget (there|from|to)\b|\bhow far\b|\bdistance (from|to|between)\b/.test(t),
    weight: 1,
    boost: (t) => /\bhow (do|can|would|to) i get\b|\bget (there|from|to)\b|\bhow far\b|\bdistance (from|to|between)\b/.test(t) ? 0.35 : 0
  },
  {
    intent: 'weather',
    test: (t) => any(t, 'weather', 'climate', 'rain', 'monsoon', 'best time', 'when to visit', 'when to go', 'season', 'dry season', 'wet season', 'temperature', 'rainy') || /\bwhen (should|do|can|would) i (visit|go|travel|come)\b/.test(t),
    weight: 1
  },
  {
    intent: 'budget',
    test: (t) => any(t, 'cost', 'price', 'prices', 'budget', 'expensive', 'cheap', 'cheapest', 'how much', 'afford', 'entry fee', 'entrance fee', 'ticket price'),
    weight: 1,
    boost: (t) => any(t, 'cost', 'price', 'prices', 'budget', 'expensive', 'cheap', 'cheapest', 'afford', 'entry fee', 'entrance fee', 'ticket price') ? 0 : -0.1
  },
  {
    intent: 'visa',
    test: (t) => any(t, 'visa', 'eta', 'passport', 'immigration', 'travel document', 'how to enter'),
    weight: 1.1
  },
  {
    intent: 'safety',
    test: (t) => any(t, 'safe', 'safety', 'danger', 'dangerous', 'crime', 'scam', 'emergency', 'police', 'ambulance', 'theft', 'robbery'),
    weight: 1.1
  },
  {
    intent: 'health',
    test: (t) => any(t, 'health', 'hospital', 'doctor', 'medicine', 'vaccination', 'vaccine', 'mosquito', 'dengue', 'malaria', 'water safe', 'sick', 'pharmacy'),
    weight: 1
  },
  {
    intent: 'connectivity',
    test: (t) => any(t, 'sim card', 'sim', 'wifi', 'internet', 'mobile data', 'connectivity', 'roaming'),
    weight: 1
  },
  {
    intent: 'electricity',
    test: (t) => any(t, 'electricity', 'plug', 'socket', 'adapter', 'voltage', 'power cut', 'charging'),
    weight: 1
  },
  {
    intent: 'shopping',
    test: (t) => any(t, 'shopping', 'souvenir', 'gift', 'market', 'gem', 'sapphire', 'ruby', 'batik', 'spice garden', 'handicraft', 'what to buy'),
    weight: 1
  },
  {
    intent: 'culture',
    test: (t) => any(t, 'culture', 'custom', 'tradition', 'etiquette', 'dress code', 'modesty', 'temple rules', 'local customs', 'greeting word', 'ayubowan meaning', 'sinhala', 'tamil language'),
    weight: 1
  },
  {
    intent: 'itinerary',
    test: (t) => any(t, 'itinerary', 'plan a trip', 'plan my trip', 'plan me a trip', 'schedule my trip', 'road trip', 'trip plan', 'how long should i', 'day plan', 'plan a tour for me') || /\b\d+\s*-?\s*(day|days|week|weeks)\b/.test(t),
    weight: 1.1
  },
  {
    intent: 'beach',
    test: (t) => any(t, 'beach', 'swimming', 'snorkel', 'snorkelling', 'dive', 'diving', 'surf', 'surfing', 'water sport', 'coral', 'reef'),
    weight: 1
  },
  {
    intent: 'wildlife',
    test: (t) => any(t, 'wildlife', 'safari', 'leopard', 'elephant', 'sloth bear', 'national park', 'whale', 'dolphin', 'turtle', 'crocodile', 'birdwatching'),
    weight: 1
  },
  {
    intent: 'hiking',
    test: (t) => any(t, 'hike', 'hiking', 'trek', 'trekking', 'trail', 'climb', 'summit'),
    weight: 1
  },
  {
    intent: 'create_tour',
    test: (t) => any(t, 'create tour', 'custom tour', 'build a tour', 'make a tour', 'plan a tour', 'my own tour', 'custom route', 'build route'),
    weight: 1.2
  },
  {
    intent: 'daily_mode',
    test: (t) => any(t, 'daily mode', 'live navigation', 'turn by turn', 'get directions', 'navigate me'),
    weight: 1.2
  },
  {
    intent: 'hotels',
    test: (t) => any(t, 'hotel', 'hotels', 'accommodation', 'guesthouse', 'resort', 'villa', 'hostel', 'where to stay', 'book a room', 'lodge'),
    weight: 1.25
  },
  {
    intent: 'tours_browse',
    test: (t) => any(t, 'browse tours', 'show tours', 'see tours', 'available tours', 'list tours', 'best tours', 'recommend a tour', 'what tours') || /\bshow\s+me\s+(the\s+)?tours\b|\btours?\s+(page|list|available)\b|\bwhat\s+tours\b/.test(t),
    weight: 1.1
  },
  {
    intent: 'booking',
    test: (t) => any(t, 'book a tour', 'book a hotel', 'booking', 'reserve', 'reservation', 'cancel my booking', 'my booking', 'confirm booking'),
    weight: 1.1
  },
  {
    intent: 'profile',
    test: (t) => any(t, 'my profile', 'my account', 'booking history', 'log in', 'sign in', 'sign up', 'register', 'log out', 'forgot password'),
    weight: 1
  },
  {
    intent: 'region_overview',
    test: (t) => any(t, 'province', 'region', 'which area', 'where should i go') || /\b(north|south|east|west|central)ern?\b/.test(t),
    weight: 0.8
  }
];

function classifyIntent(textNorm) {
  return INTENT_DEFS
    .map(def => {
      let confidence = 0;
      try {
        if (def.test(textNorm)) {
          confidence = Math.min(1, 0.75 * def.weight);
          if (typeof def.boost === 'function') {
            confidence = Math.min(1, confidence + def.boost(textNorm));
          }
        }
      } catch {
        confidence = 0;
      }
      return { intent: def.intent, confidence };
    })
    .filter(s => s.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence);
}

const FALLBACK_THRESHOLD = 0.3;

function understand(rawText) {
  const textNorm = normalize(rawText);
  const intents = classifyIntent(textNorm);
  const topIntent = intents[0] || { intent: 'unknown', confidence: 0 };
  const fallback = topIntent.confidence < FALLBACK_THRESHOLD;

  const entities = {
    destination: extractDestination(textNorm),
    duration: extractDuration(textNorm),
    ticketType: extractTicketType(textNorm),
    peopleCount: extractPeopleCount(textNorm),
    budgetLevel: extractBudgetLevel(textNorm)
  };

  const sentiment = analyzeSentiment(textNorm, rawText);

  return {
    raw: rawText,
    normalized: textNorm,
    tokens: tokenize(textNorm),
    keywords: contentWords(textNorm),
    intent: topIntent.intent,
    confidence: topIntent.confidence,
    allIntents: intents,
    fallback,
    entities,
    sentiment
  };
}

module.exports = {
  normalize,
  tokenize,
  contentWords,
  fuzzyIncludes,
  fuzzyEquals,
  levenshtein,
  any,
  extractDestination,
  extractDuration,
  extractTicketType,
  extractPeopleCount,
  extractBudgetLevel,
  analyzeSentiment,
  classifyIntent,
  understand,
  FALLBACK_THRESHOLD
};