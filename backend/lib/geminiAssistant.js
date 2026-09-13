const { DESTINATIONS, ITINERARIES, VEHICLES } = require('./knowledgeBase');
const { understand } = require('./nlu');

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

let nodeFetch;
async function getFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  if (!nodeFetch) {
    const module = await import('node-fetch');
    nodeFetch = module.default;
  }
  return nodeFetch;
}

function buildSystemPrompt({ tours = [], hotels = [], userName = null, text = '' } = {}) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const greeting = userName ? ` The user's name is ${userName}.` : '';

  let entityContext = '';
  if (text) {
    const parsed = understand(text);
    if (parsed && parsed.entities) {
      entityContext = `\n## Extracted Intent Signals from User Input\n- Detected Intent: ${parsed.intent}\n- Target Destination Entity: ${parsed.entities.destination || 'None'}\n- Duration Context: ${JSON.stringify(parsed.entities.duration || 'None')}\n- Selected Budget Level: ${parsed.entities.budgetLevel || 'None'}\n`;
    }
  }

  const topTours = tours.slice(0, 10).map(t =>
    `• ${t.title || t.name} — ${t.duration || '?'} days, from $${t.price || '?'} (${t.location || t.region || 'Sri Lanka'})`
  ).join('\n') || '(No tours loaded yet - tell users to browse /tours)';

  const topHotels = hotels.slice(0, 8).map(h =>
    `• ${h.name} — ${h.location || h.city}, $${h.pricePerNight || h.price || '?'}/night, ${h.stars || h.rating || '?'} stars`
  ).join('\n') || '(No hotels loaded yet - tell users to browse /hotels)';

  const destNames = Object.keys(DESTINATIONS).slice(0, 20).join(', ');

  const vehicleSummary = [
    '### Cars (city km/L | highway km/L)',
    ...Object.values(VEHICLES.cars).map(v => `- Examples: ${v.examples || 'Standard'}: ${v.city} city | ${v.highway} highway`),
    '### Bikes & Scooters (city km/L | outstation km/L)',
    ...Object.values(VEHICLES.bikes).map(v => `- Examples: ${v.examples || 'Standard'}: ${v.city} city | ${v.outstation} outstation`),
    '### Three-wheelers (tuk-tuks)',
    `- Petrol: ${VEHICLES.threeWheelers.petrol.city} city | ${VEHICLES.threeWheelers.petrol.outstation} outstation`,
    `- LPG/Diesel: ${VEHICLES.threeWheelers.lpgDiesel.city} city | ${VEHICLES.threeWheelers.lpgDiesel.outstation} outstation`,
    `- Electric e-Tuks: ${VEHICLES.threeWheelers.electric.range}`,
    '### Notes',
    ...VEHICLES.efficiencyFactors.map(f => `- ${f}`),
    '### Ride-hailing (PickMe/Uber) per km',
    `- Tuk-tuk: ${VEHICLES.rideHailing.tuktuk} Budget car: ${VEHICLES.rideHailing.budgetCar} Sedan: ${VEHICLES.rideHailing.sedan} Van/SUV: ${VEHICLES.rideHailing.vanSuv}`,
    '### Self-drive rental per day',
    `- Budget hatchback: ${VEHICLES.selfDriveRental.budgetHatchback} Hybrid/subcompact: ${VEHICLES.selfDriveRental.hybridSubcompact} SUV/sedan: ${VEHICLES.selfDriveRental.midSizeSuvSedan}`,
    '### Chauffeur-driven car per day',
    `- Sedan (1-3 pax): ${VEHICLES.chauffeurHire.sedanCompact} SUV/mini-van (3-5 pax): ${VEHICLES.chauffeurHire.suvMiniVan} Large van/luxury: ${VEHICLES.chauffeurHire.largeVanLuxury}`,
    '### Fixed airport transfers from BIA',
    `- To Colombo: ${VEHICLES.airportTransfers.biaToColombo} To Kandy: ${VEHICLES.airportTransfers.biaToKandy} To Galle/South Coast: ${VEHICLES.airportTransfers.biaToGalleSouth}`,
  ].join('\n');

  return `You are TourGenie AI, a real Sri Lankan travel expert chatting inside the TourGenie app. It is currently ${timeOfDay} in Sri Lanka.${greeting}${entityContext}

## How you talk
Talk like a well-traveled local friend messaging someone, not a corporate support bot. Vary your sentence length and openings across a conversation instead of repeating the same stock phrases. Actually react to what the person said before adding new information — if they mention they're nervous, budget-conscious, or traveling with kids, let that shape the whole reply, not just the first line. Ask a natural follow-up only when it genuinely helps, not as a scripted habit at the end of every message.

Use occasional Sri Lankan touches where they fit naturally, like "Ayubowan" as a greeting or "Bohoma sthuthi" for thanks, but don't force one into every message. Be honest about uncertainty ("prices shift a bit season to season, but roughly...") instead of stating invented specifics with false confidence.

## Fuel, mileage & transport cost data
When someone asks about fuel usage, mileage, or transport costs for a vehicle or route, do real napkin math using the figures below and the distance they mention (or a distance you know between two Sri Lankan towns) so they get an actual number, not a shrug. Make clear it's an estimate.
${vehicleSummary}

## App Pages You Can Link To
When relevant, mention these pages (format as plain text like "check out /tours"):
- /tours — Browse & book tours
- /hotels — Browse hotels  
- /daily — Daily Mode: real-time GPS navigation with live route planning
- /create-tour — Build a custom tour itinerary
- /profile — User profile, bookings, trip history
- /map — Interactive island map

## Available Tours Right Now
${topTours}

## Available Hotels Right Now
${topHotels}

## Key Destinations You Know Well
${destNames}

## Core Knowledge
- Best time to visit: West/South coast (Nov-Apr), East coast (May-Sep), Hill country (Jan-Mar, Jul-Sep)
- Visa: ETA required for most nationalities, apply online at eta.gov.lk, ~$35
- Currency: LKR (Sri Lankan Rupee). 1 USD ≈ 300 LKR
- Transport: Tuk-tuks for cities, trains for scenic routes (Kandy-Ella is iconic), buses for budget travel
- Famous experiences: Sigiriya rock fortress, Yala leopard safari, whale watching Mirissa, Kandy Temple of Tooth, Galle Fort, Ella 9-arch bridge, Adam's Peak climb
- Food staples: rice & curry, hoppers (appa), kottu roti, pol sambol, string hoppers, fish ambul thiyal

## Response Format
- Keep replies concise (2-5 sentences for simple questions, up to 3 short paragraphs for complex ones)
- Never use excessive bullet points — prefer flowing prose with occasional lists only when listing 4+ items
- A follow-up question is optional, not mandatory — only add one if it genuinely moves the conversation forward
- Include ACTION_HINTS in your response when relevant (see below)

## Action Hints (CRITICAL — include these at the END of your reply)
When your reply is relevant to a page, append one line at the very end:
ACTIONS: create-tour | daily-mode | hotels | tours | profile
Only include actions actually relevant to your reply. Max 2 actions. This line will be stripped before showing to the user.`;
}

function extractActionsAndReply(text) {
  const match = text.match(/\nACTIONS:\s*(.+)$/m);
  if (!match) {
    return { reply: text.trim(), actions: [] };
  }
  const actions = match[1]
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 2);
  const reply = text.slice(0, match.index).trim();
  return { reply, actions };
}


const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b:free';

async function callOpenRouter({ messages, context = {} }) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is not set');
  }

  const systemInstruction = buildSystemPrompt(context);

  const formattedMessages = [
    { role: 'system', content: systemInstruction },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    })),
  ];

  const fetchFn = await getFetch();
  const response = await fetchFn(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_URL || 'http://localhost',
      'X-Title': 'TourGenie AI',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: formattedMessages,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenRouter API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const replyText = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content || ''
    : '';
  const { reply, actions } = extractActionsAndReply(replyText);
  return { reply, actions };
}


async function callSimulatedGemini({ messages, context = {} }) {
  const { understand } = require('./nlu');
  const { DESTINATIONS } = require('./knowledgeBase');
  
  // Security: Sanitize input by stripping HTML tags
  const sanitize = (str) => typeof str === 'string' ? str.replace(/<[^>]*>?/gm, '').trim() : '';

  // Get recent conversation history to provide better context
  const validMessages = (messages || []).filter(m => m && ['user', 'assistant'].includes(m.role) && m.content);
  const recentHistory = validMessages.slice(-4);
  const lastUserMessage = sanitize(recentHistory.filter(m => m.role === 'user').pop()?.content || '');
  
  const parsed = understand(lastUserMessage);
  const intent = parsed?.intent || 'unknown';
  const entities = parsed?.entities || {};
  
  const userNameStr = context.userName ? ` ${sanitize(context.userName)}` : '';
  const tours = context.tours || [];
  const hotels = context.hotels || [];

  let reply = '';
  let actions = [];

  // Simulate thinking delay for realism
  await new Promise(r => setTimeout(r, 800));

  if (intent === 'greeting') {
    reply = `Ayubowan${userNameStr}! I am **TourGenie AI**, your personal Sri Lanka travel companion.\n\nI can help you:\n- Find the perfect **hotels**\n- Book amazing **tours**\n- Provide **daily navigation** assistance\n- Build a **custom itinerary**\n\nHow can I help you today?`;
    actions = ['tours', 'hotels'];
  } else if (intent === 'hotels') {
    // Make fallback slightly smarter by checking for location matches
    let relevantHotels = hotels;
    const lowerQuery = lastUserMessage.toLowerCase();
    const locationMatch = hotels.filter(h => lowerQuery.includes((h.location || '').split(',')[0].toLowerCase()) || lowerQuery.includes((h.city || '').toLowerCase()));
    
    if (locationMatch.length > 0) {
       relevantHotels = locationMatch;
    }

    if (relevantHotels.length > 0) {
      const topHotels = relevantHotels.slice(0, 3).map(h => `- **${h.name}** in ${h.location || 'Sri Lanka'} (from ${h.pricePerNight || 'N/A'}/night)`).join('\n');
      reply = `I can certainly help you find accommodation, ${userNameStr ? userNameStr.trim() : 'my friend'}! We have some excellent options currently available${locationMatch.length > 0 ? ' matching your location' : ''}:\n\n${topHotels}\n\nI recommend checking out our full hotel catalog to see real-time availability and book your stay.`;
    } else {
      reply = `I can certainly help you find accommodation! Sri Lanka has everything from luxury resorts to cozy boutique guesthouses.\n\nWhether you're looking for a beachfront villa in Mirissa or a tea estate bungalow in Nuwara Eliya, we have great options.\n\nI recommend checking out our full hotel catalog to see real-time availability and prices.`;
    }
    actions = ['hotels'];
  } else if (intent === 'tours_browse') {
    if (tours.length > 0) {
      const topTours = tours.slice(0, 3).map(t => `- **${t.title}** (${t.duration || '?'} days, from ${t.price || 'N/A'})`).join('\n');
      reply = `We have fantastic tour packages designed to showcase the very best of Sri Lanka! ??\n\nSome of our featured tours right now include:\n\n${topTours}\n\nHead over to the Tours page to browse our curated packages and see the full itineraries.`;
    } else {
      reply = `We have fantastic tour packages designed to showcase the very best of Sri Lanka! ??\n\nSome of our most popular experiences include:\n- **Wildlife Safaris** (Yala & Minneriya)\n- **Cultural Heritage** (Sigiriya & Kandy)\n- **Beach Getaways** (South & East Coasts)\n\nHead over to the Tours page to browse our curated packages.`;
    }
    actions = ['tours'];
  } else if (intent === 'create_tour' || intent === 'itinerary') {
    reply = `Planning a custom road trip is the best way to see the island! ???\n\nYou can use our **Custom Route Builder** to select your starting point, destination, and any stops along the way. I'll even calculate your estimated fuel costs and travel time.\n\nWould you like to start building your route now?`;
    actions = ['create-tour'];
  } else if (intent === 'daily_mode') {
    reply = `Ready to hit the road? ??\n\nOur **Daily Mode** provides live turn-by-turn navigation, tracks your GPS position along your tour route, and helps you find nearby restaurants, ATMs, and fuel stations using real-time OpenStreetMap data.`;
    actions = ['daily-mode'];
  } else if (intent === 'destination_info' && entities.destination) {
    const dest = DESTINATIONS[entities.destination];
    if (dest) {
       reply = `**${dest.name}** is a spectacular ${dest.category} destination! ??\n\n${dest.description}\n\n**Best time to visit:** ${dest.bestTime}\n\nIf you'd like to visit, we have several tours that include ${dest.name} in their itinerary.`;
       actions = ['tours'];
    } else {
       reply = `That sounds like an interesting place! While I don't have a specific encyclopedia entry for it, Sri Lanka is full of hidden gems. Let me know if you want to search our tours for it!`;
       actions = ['tours'];
    }
  } else if (intent === 'weather') {
    reply = `Sri Lanka's weather generally follows two main monsoon seasons: ???\n\n- **West & South Coasts:** Best from **November to April** (dry and sunny).\n- **East Coast:** Best from **May to September**.\n- **Hill Country:** Can be chilly year-round, best from Jan-Mar.\n\nIf you use **Daily Mode**, I can give you live weather updates for your exact location!`;
    actions = ['daily-mode'];
  } else if (intent === 'food') {
    reply = `Sri Lankan food is an absolute highlight! ????\n\nYou *must* try:\n- **Kottu Roti:** Chopped flatbread with veggies, egg, and meat.\n- **Hoppers (Appam):** Bowl-shaped rice flour pancakes, perfect with a fried egg.\n- **Fish Ambul Thiyal:** Sour fish curry (a southern specialty).\n\nLet me know if you need restaurant recommendations along your route!`;
    actions = [];
  } else if (intent === 'visa') {
    reply = `Most travelers need a visa to enter Sri Lanka. ??\n\nIt's a very straightforward process. You can apply for an **ETA (Electronic Travel Authorization)** online before you fly. It typically costs around **$35 - $50** depending on your nationality and is usually approved within 24 hours.`;
    actions = [];
  } else {
    // Check conversation history to see if they are just replying yes/no to a previous action
    const lastAssistantMessage = recentHistory.filter(m => m.role === 'assistant').pop()?.content || '';
    if (lastAssistantMessage.includes('Would you like to start building your route now?') && lastUserMessage.toLowerCase().match(/yes|sure|okay|yeah|yep/)) {
        reply = `Excellent! Let's get started. Head over to the Custom Tour Builder.`;
        actions = ['create-tour'];
    } else {
        reply = `Ayubowan${userNameStr}! I am your intelligent TourGenie travel assistant.\n\nI can help you find tours, book hotels, plan a custom itinerary, or provide live navigation assistance. What would you like to explore today?`;
        actions = ['tours', 'hotels', 'create-tour'];
    }
  }

  return { reply, actions };
}


async function handleGeminiMessage({ text, sessionId, userName, tours, hotels, messages }) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("No API Key");
    }

    const result = await callOpenRouter({
      messages: messages || [{ role: 'user', content: text }],
      context: { userName, tours, hotels, text },
    });

    return {
      reply: result.reply,
      meta: {
        intent: 'openrouter_ai',
        confidence: 1,
        engine: OPENROUTER_MODEL,
        actions: result.actions,
      },
    };
  } catch (err) {
    console.error('OpenRouter API Error (Falling back to local NLU):', err.message);
    
    // FALLBACK TO SIMULATED LOCAL AI
    const fallbackResult = await callSimulatedGemini({
      messages: messages || [{ role: 'user', content: text }],
      context: { userName, tours, hotels, text },
    });
    
    return {
      reply: fallbackResult.reply,
      meta: { 
        intent: 'simulated_ai', 
        confidence: 1, 
        engine: 'fallback-nlu', 
        actions: fallbackResult.actions 
      }
    };
  }
}

module.exports = { handleGeminiMessage };
