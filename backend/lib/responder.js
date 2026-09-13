const { DESTINATIONS, FOOD, TRANSPORT, VEHICLES, PRACTICAL, ITINERARIES } = require('./knowledgeBase');

const GREET_OPENERS = [
  (name) => `Ayubowan${name}!`,
  (name) => `Hey${name}, welcome!`,
  (name) => `Hi${name}! Great to have you here.`
];

const GREET_BODIES = [
  "I'm TourGenie AI — think of me as a friend who's spent years exploring Sri Lanka and loves talking about it. Ask me about a place, food, getting around, budgeting, or planning a whole trip.",
  "I know this island pretty well — from the ancient cities up north to the surf breaks down south. What's on your mind? A destination, an itinerary, or something practical like visas or transport?",
  "Happy to help with anything Sri Lanka — destinations, food, where to stay, how to get around, or a full day-by-day plan. What are you curious about?"
];

const THANKS_REPLIES = [
  (name) => `You're so welcome${name}! Anything else you're curious about?`,
  (name) => `Anytime${name}! Sri Lanka's got a lot more to talk about if you want.`,
  (name) => `Happy to help${name}! Let me know what else you're planning.`
];

const FAREWELL_REPLIES = [
  "Take care, and enjoy Sri Lanka!",
  "Goodbye for now — come back anytime you've got more questions!",
  "Have a wonderful trip — Ayubowan!"
];

const AFFIRM_FOLLOWUPS = [
  "Great — let's go.",
  "Perfect, here we go.",
  "Sounds good."
];

function pick(arr, seed) {
  if (arr.length === 1) return arr[0];
  const idx = typeof seed === 'number' ? seed % arr.length : Math.floor(Math.random() * arr.length);
  return arr[idx];
}

function firstName(userName) {
  return userName ? ` ${userName.split(' ')[0]}` : '';
}

function joinNatural(items) {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function empathyPrefix(sentiment) {
  if (sentiment.label === 'very_negative') {
    return pick([
      "I'm really sorry to hear that — that sounds frustrating. ",
      "Oh no, I'm sorry you're dealing with that. ",
      "That's not the experience you should be having, and I'm sorry. "
    ]);
  }
  if (sentiment.label === 'negative') {
    return pick([
      "I understand the frustration — let me help sort this out. ",
      "Sorry about that. "
    ]);
  }
  return '';
}

function escalationNote() {
  return `\n\nIf you'd rather speak with a member of our team directly, just say "talk to a human" and I'll flag this conversation for handover.`;
}

function replyDestination(destKey, ctx) {
  const d = DESTINATIONS[destKey];
  if (!d) return null;
  const highlights = d.highlights?.slice(0, 4).join(', ') || '';
  const tips = d.tips?.slice(0, 2).join(' · ') || '';

  const openers = [
    `**${d.name}** — ${d.description}`,
    `Ah, **${d.name}**! ${d.description}`,
    `Good choice — **${d.name}**. ${d.description}`
  ];
  let reply = pick(openers);
  if (highlights) reply += `\n\n**Don't miss:** ${highlights}`;
  if (tips) reply += `\n**Good to know:** ${tips}`;
  if (d.entry) reply += `\n**Entry:** ${d.entry}`;
  if (d.bestTimeToVisit) reply += `\n**Best time:** ${d.bestTimeToVisit}`;
  if (d.nearby?.length) reply += `\n**Nearby:** ${d.nearby.slice(0, 3).join(', ')}`;

  const followUps = [
    `\n\nWant tips on getting there, places to stay nearby, or what to eat?`,
    `\n\nI can also tell you how to get there, where to stay, or what's good to eat nearby — just ask.`,
    `\n\nWant me to suggest how to combine this with nearby places, or build it into an itinerary?`
  ];
  reply += pick(followUps);
  return reply;
}

function replyFood(textNorm, destKey) {
  const destNote = destKey ? ` In ${DESTINATIONS[destKey]?.name}, ` : '';
  if (textNorm.includes('vegetarian') || textNorm.includes('vegan')) {
    return `Sri Lanka is genuinely excellent for vegetarians.\n\n${FOOD.vegetarian}\n\n**Best vegetarian dishes:** dhal curry, jackfruit curry, pol sambol, string hoppers with coconut milk, hoppers, pittu.\n\n**Budget:** ${FOOD.budgetGuide}`;
  }
  if (textNorm.includes('breakfast')) {
    return `Sri Lankan breakfasts are one of the best parts of visiting.\n\n• **Hoppers** — bowl-shaped rice pancakes (plain, egg, or sweet milk hopper)\n• **String hoppers** — steamed rice noodle nests with coconut curry\n• **Pol roti** — coconut flatbread with lunu miris sambol\n• **Pittu** — steamed rice flour cylinders with coconut milk\n\nMost guesthouses serve these for LKR 300-600.${destNote}Ask for a "full Sri Lankan breakfast" and you'll get a proper spread.`;
  }
  if (textNorm.includes('seafood') || textNorm.includes('fish')) {
    return `Sri Lankan seafood is something else.\n\n**Must try:**\n• Jaffna crab curry — the ultimate northern speciality\n• Fish ambul thiyal — sour dry fish curry from the south\n• Devilled prawns — spicy, sweet, addictive\n• Grilled barracuda — common on the southern coast\n\n**Best places for it:** Negombo, Jaffna, Mirissa, Trincomalee.`;
  }
  if (textNorm.includes('kottu')) {
    return `Kottu roti — you'll hear it before you see it.\n\n${FOOD.mainDishes['kottu roti']}\n\nThat rhythmic "tak-tak-tak" chopping sound from street stalls is basically the soundtrack of Sri Lankan evenings. Order vegetable (cheapest), egg, chicken, or seafood kottu — available pretty much everywhere, any time of day.`;
  }
  if (textNorm.includes('hopper') || textNorm.includes('appam')) {
    return `Hoppers (appam)\n\n${FOOD.mainDishes['hoppers (appam)']}\n\n**Types:** plain, egg (cracked in the middle — the classic), and milk (sweet, coconut-based). Best with pol sambol or dhal curry.`;
  }
  if (textNorm.includes('tea') || textNorm.includes('ceylon')) {
    return `Ceylon Tea — best enjoyed where it's grown: Nuwara Eliya, Ella, or Haputale.\n\n**Pedro** tea estates (Nuwara Eliya) run factory tours showing the whole process — plucking → withering → rolling → fermenting → drying.\n\nAsk for "pure Ceylon" leaf tea rather than bags, and buy directly from the estate or a Dilmah shop rather than roadside touts.`;
  }
  if (textNorm.includes('drink') || textNorm.includes('alcohol') || textNorm.includes('arrack')) {
    return `**Drinks worth trying**\n\n• **King coconut (thambili)** — my top pick, safe, refreshing, everywhere\n• **Ceylon tea** — best in the hill country\n• **Lion Lager / Three Coins** — local beers\n• **Arrack** — the national spirit; "Sprite Arrack" is the classic mix\n• **Faluda** — rose milk with chia seeds and ice cream`;
  }
  return `Sri Lankan food really is one of the highlights of visiting.\n\n**Must-try dishes:**\n• Rice & curry — the national staple (often 6-10 curries around rice)\n• Kottu roti — chopped flatbread stir-fry, a true Sri Lanka icon\n• Hoppers — bowl-shaped fermented rice pancakes\n• Jaffna crab curry — if you make it north\n\n**To drink:** king coconut, Ceylon tea\n\n**Budget:** ${FOOD.budgetGuide}\n\nWant something specific — a dietary need, a region's food, or a particular dish?`;
}

function replyTransport(textNorm) {
  if (textNorm.includes('fuel') || textNorm.includes('mileage') || textNorm.includes('km/l') || textNorm.includes('petrol') || textNorm.includes('diesel')) {
    const isBike = textNorm.includes('bike') || textNorm.includes('scooter') || textNorm.includes('motorbike') || textNorm.includes('motorcycle');
    const isTuk = textNorm.includes('tuk') || textNorm.includes('three wheel');
    if (isTuk) {
      return `**Tuk-tuk fuel efficiency**\n\nPetrol three-wheelers get about ${VEHICLES.threeWheelers.petrol.city} in city traffic and ${VEHICLES.threeWheelers.petrol.outstation} on the open road. 4-stroke LPG/diesel variants do a bit better: ${VEHICLES.threeWheelers.lpgDiesel.city} city, ${VEHICLES.threeWheelers.lpgDiesel.outstation} outstation. Electric e-Tuks manage ${VEHICLES.threeWheelers.electric.range}.\n\nTell me your route distance and I can rough out a fuel cost.`;
    }
    if (isBike) {
      return `**Bike fuel efficiency**\n\nDepends a lot on the bike — a budget 100cc commuter sips fuel at ${VEHICLES.bikes.budgetCommuter.city} city / ${VEHICLES.bikes.budgetCommuter.outstation} outstation, while something like a Royal Enfield Classic 350 is closer to ${VEHICLES.bikes.classicCruiser.city} city / ${VEHICLES.bikes.classicCruiser.outstation} outstation.\n\nA couple of things that eat into mileage: ${VEHICLES.efficiencyFactors[0].toLowerCase()} And ${VEHICLES.efficiencyFactors[1].toLowerCase()}\n\nWhat bike are you riding, and how far are you going? I can estimate the fuel cost.`;
    }
    return `**Car fuel efficiency**\n\nA hybrid like the Toyota Aqua/Axio is the most efficient common option — ${VEHICLES.cars.hybridBudgetHatchback.city} city, ${VEHICLES.cars.hybridBudgetHatchback.highway} highway. A regular petrol sedan like a Corolla is closer to ${VEHICLES.cars.standardSedan.city} city / ${VEHICLES.cars.standardSedan.highway} highway, and a diesel van like a HiAce KDH runs ${VEHICLES.cars.passengerVan.city} city / ${VEHICLES.cars.passengerVan.highway} highway.\n\n${VEHICLES.efficiencyFactors[2]}\n\nTell me the vehicle and the distance and I'll work out roughly how much fuel — and cost — you're looking at.`;
  }
  if (textNorm.includes('train')) {
    const routes = Object.entries(TRANSPORT.train.routes).map(([r, d]) => `• **${r}:** ${d}`).join('\n');
    return `**Sri Lanka by train**\n\n${TRANSPORT.train.overview}\n\n**Key routes:**\n${routes}\n\n**Tips:** ${TRANSPORT.train.tips.slice(0, 3).join(' · ')}\n**Booking:** ${TRANSPORT.train.booking}`;
  }
  if (textNorm.includes('tuk') || textNorm.includes('three wheel') || textNorm.includes('rickshaw')) {
    return `**Tuk-tuks**\n\n${TRANSPORT.tukTuk.overview}\n\n**Pricing:** ${TRANSPORT.tukTuk.pricing}\n**Best app:** ${TRANSPORT.tukTuk.apps}\n\n**Tips:** ${TRANSPORT.tukTuk.tips.join(' · ')}`;
  }
  if (textNorm.includes('bus')) {
    return `**Buses**\n\n${TRANSPORT.bus.overview}\n\n**Types:** ${TRANSPORT.bus.types}\n**Cost:** ${TRANSPORT.bus.cost}\n\n**Tips:** ${TRANSPORT.bus.tips.join(' · ')}`;
  }
  if (textNorm.includes('car') || textNorm.includes('driver') || textNorm.includes('private')) {
    return `**Private car + driver**\n\n${TRANSPORT.privateCar.overview}\n\n**Cost:** ${TRANSPORT.privateCar.cost}\n\n**Tips:** ${TRANSPORT.privateCar.tips.join(' · ')}`;
  }
  if (textNorm.includes('fly') || textNorm.includes('flight')) {
    return `**Domestic flights**\n\n${TRANSPORT.domestic.flights}\n\nMost travellers stick with train or private car — flights mainly save time on the longer hauls (Colombo-Trincomalee is 4h by road vs ~45min flying).`;
  }
  if (textNorm.includes('ferry') || textNorm.includes('boat')) {
    return `**Ferries & boats**\n\nFor island trips: Pigeon Island (Trincomalee), Nainativu/Nagadeepa (Jaffna), Delft Island (Jaffna) — all arranged through local boatmen at the jetty.\n\nBentota River mangrove safaris run 30-60 minutes, LKR 800-1,500 per boat.`;
  }
  return `**Getting around Sri Lanka**\n\n• **Train** — scenic and cheap; Colombo-Kandy-Ella is world-famous. Book the observation car early.\n• **Tuk-tuk** — best for short hops. Use PickMe for metered fares.\n• **Bus** — cheapest option, LKR 50-300 per trip.\n• **Private car + driver** — most comfortable for multi-city trips, ~LKR 10,000-15,000/day.\n• **Domestic flights** — Cinnamon Air, mainly Colombo-Trincomalee or Koggala.\n\nWhat kind of journey are you planning?`;
}

function replyWeather(textNorm) {
  if (/west|south|galle|mirissa|colombo/.test(textNorm)) {
    return `**West & south coast weather**\n\n${PRACTICAL.climate.general}\n\n**Good season:** November-April\n**Avoid:** May-September (southwest monsoon — rain, rougher seas)\n\nThat covers Galle, Mirissa, Unawatuna, Hikkaduwa, Bentota, Negombo, and Colombo.`;
  }
  if (/east|trinco|arugam|batticaloa/.test(textNorm)) {
    return `**East coast weather**\n\n**Good season:** April-September (the coast flips opposite to the south/west)\n• Great for Trincomalee, Arugam Bay, Passikudah, Batticaloa\n• Arugam Bay surf peaks May-October\n\n**Avoid:** November-January.`;
  }
  if (/hill|kandy|ella|nuwara/.test(textNorm)) {
    return `**Hill country weather**\n\n**Best:** December-April — crisp, clear, genuinely beautiful\n• Kandy, Ella, Nuwara Eliya, Horton Plains all shine in this window\n• Light rain can happen any time in the hills, so pack a thin rain layer\n• Temps run 15-22°C, cool compared to the lowlands`;
  }
  return `**Sri Lanka weather, in short**\n\n${PRACTICAL.climate.general}\n\n**West & south coast:** Nov-Apr best, avoid May-Sep\n**East coast:** Apr-Sep best\n**Hill country:** Dec-Apr best\n**Cultural Triangle:** year-round\n\nThe trick is that Sri Lanka's two monsoons hit opposite coasts — there's almost always good weather *somewhere* on the island. Where are you hoping to go?`;
}

function replyBudget(textNorm) {
  if (/entry|entrance|ticket|fee/.test(textNorm)) {
    return `**Entry fees, foreigner rates**\n\n**UNESCO sites:**\n• Sigiriya: LKR 7,500\n• Anuradhapura: LKR 7,500\n• Polonnaruwa: LKR 7,500\n• Dambulla: LKR 3,500\n• Kandy Temple of the Tooth: LKR 2,500\n• Peradeniya Botanical Gardens: LKR 2,000\n\n**National parks:**\n• Yala: LKR 6,000+ pp + jeep\n• Horton Plains: LKR 4,800\n• Minneriya: LKR 4,500\n• Pigeon Island: LKR 3,500\n\nMany temples, beaches, and viewpoints are free, but the headline entry fees add up — budget roughly LKR 15,000-25,000 for a week of solid sightseeing.`;
  }
  return `**Budget guide**\n\n• Backpacker: LKR 3,000-5,000/day\n• Mid-range: LKR 8,000-15,000/day\n• Comfort: LKR 18,000-30,000/day\n• Luxury: LKR 40,000+/day\n\n**Food:** local meal LKR 250-600, tourist restaurant LKR 800-2,500\n**Transport:** train LKR 100-1,000, tuk-tuk LKR 200-500/trip, private car LKR 10,000-15,000/day\n**Stay:** hostel LKR 1,500-3,000, guesthouse LKR 3,000-8,000, hotel LKR 8,000-25,000\n\nRoughly 1 USD ≈ 300 LKR. ${PRACTICAL.currency.exchange}`;
}

function pickItineraryKey(textNorm, durationDays) {
  if (/beach|coast|coastal/.test(textNorm)) return 'beach';
  if (/east|arugam|trinco|batticaloa/.test(textNorm)) return 'eastCoast';
  if (/cultural|heritage|ancient|unesco/.test(textNorm)) return 'cultural';
  if (/wildlife|safari|leopard|animal/.test(textNorm)) return 'wildlife';
  if (durationDays) {
    if (durationDays <= 3) return '3days';
    if (durationDays <= 5) return '5days';
    if (durationDays <= 7) return '7days';
    if (durationDays <= 10) return '10days';
    return '2weeks';
  }
  return null;
}

function replyItinerary(textNorm, duration) {
  const days = duration?.days || null;
  const key = pickItineraryKey(textNorm, days);
  if (key && ITINERARIES[key]) {
    const plan = ITINERARIES[key];
    return `**${plan.title}**\n\n${plan.days.join('\n')}\n\n*${plan.notes}*\n\nWant me to add hotel suggestions, transport options, or a rough cost estimate for this?`;
  }
  return null; 
}

function askForDuration() {
  return `How many days do you have for Sri Lanka? I've got ready-made plans for **3, 5, 7, 10 days, or 2 weeks** — plus themed routes for **beaches, the east coast, cultural heritage, or wildlife safaris**.\n\nOr just tell me roughly how long your trip is and what you're most excited about, and I'll put something together.`;
}

function replyBeach(textNorm) {
  if (textNorm.includes('surf')) {
    return `**Surfing**\n\n• **Arugam Bay** (east) — world-class, Main Point / Whiskey Point / Pottuvil Point. Season: May-October.\n• **Weligama** (south) — great for beginners. Nov-April.\n• **Hikkaduwa** — fun beach break. Nov-April.\n• **Kalpitiya** — kite surfing, May-October.\n\nLessons run LKR 2,500-4,000 for ~1.5 hours with a board.`;
  }
  if (textNorm.includes('dive') || textNorm.includes('snorkel')) {
    return `**Diving & snorkelling**\n\n• **Pigeon Island** (Trincomalee) — the best in Sri Lanka, reef sharks included. Apr-Sep.\n• **Hikkaduwa** — accessible, good for beginners. Nov-Apr.\n• **Unawatuna** — easy snorkelling right off the beach. Nov-Apr.\n• **Bar Reef** (Kalpitiya) — remote and pristine. Nov-Mar.`;
  }
  return `**Sri Lanka's beaches**\n\n• **South (Nov-Apr):** Unawatuna (swimming/snorkel), Mirissa (whales + bay), Hikkaduwa (reef, turtles), Tangalle (quiet, turtle nesting)\n• **West (Nov-Apr):** Negombo (near airport), Bentota strip (resorts, water sports)\n• **East (Apr-Sep):** Nilaveli/Uppuveli (pristine), Passikudah (calm, shallow), Arugam Bay (surf)\n\nWhich coast sounds like your kind of trip?`;
}

function replyWildlife(textNorm) {
  if (textNorm.includes('leopard')) {
    return `**Leopards**\n\n• **Yala** — highest leopard density in the world, very reliable sightings (best Feb-Jul)\n• **Wilpattu** — quieter, sightings in natural "villu" basins\n\nMorning safaris (6am) are best — ask your driver specifically for leopard spots, they know the regulars.`;
  }
  if (textNorm.includes('elephant')) {
    return `**Wild elephants**\n\n• **Minneriya** — "The Gathering", up to 300 elephants, July-October\n• **Udawalawe** — near-guaranteed sightings year-round\n• **Yala** — elephants alongside leopards\n\nNever approach or feed wild elephants — keep your distance, always.`;
  }
  if (textNorm.includes('whale')) {
    return `**Whale watching**\n\n**Mirissa**, November-April (best Dec-Mar). Blue whales, sperm whales, and big pods of spinner dolphins are common.\n\nTake the 6am boat — afternoon trips see fewer whales. Use a licensed operator, expect LKR 4,000-6,000 per person.`;
  }
  return `**Wildlife highlights**\n\n• **Yala** — leopards, elephants, sloth bears\n• **Minneriya** — elephant gathering (Jul-Oct)\n• **Sinharaja** — endemic birds, rare plants\n• **Mirissa** — whale watching (Nov-Apr)\n• **Kalpitiya** — dolphin pods (Nov-Mar)\n\nIs there a particular animal you're hoping to see?`;
}

function replyHiking() {
  return `**Hiking**\n\n• **Little Adam's Peak** (Ella) — 1.5h round trip, easy, great views\n• **Ella Rock** — 4h, moderate, guide recommended\n• **Adam's Peak (Sri Pada)** — night climb, ~5,500 steps, very spiritual. Dec-May.\n• **World's End** (Horton Plains) — flat 9km loop, arrive before 9am before the clouds roll in\n• **Lipton's Seat** (Haputale) — tuk-tuk up, walk down through tea estates\n\nBest hiking season overall: December-April.`;
}

module.exports = {
  pick,
  firstName,
  joinNatural,
  empathyPrefix,
  escalationNote,
  GREET_OPENERS,
  GREET_BODIES,
  THANKS_REPLIES,
  FAREWELL_REPLIES,
  AFFIRM_FOLLOWUPS,
  replyDestination,
  replyFood,
  replyTransport,
  replyWeather,
  replyBudget,
  replyItinerary,
  askForDuration,
  replyBeach,
  replyWildlife,
  replyHiking
};