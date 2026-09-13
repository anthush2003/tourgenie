const { DESTINATIONS, PRACTICAL } = require('./knowledgeBase');

const CATEGORY_EMOJI = {
  fuel: '',
  restaurant: '',
  cafe: '',
  hospital: '',
  atm: '',
  toilets: '',
  supermarket: '',
  parking: '',
  other: ''
};

function emojiFor(category) {
  return CATEGORY_EMOJI[category] || CATEGORY_EMOJI.other;
}

function findDestination(name) {
  if (!name || !DESTINATIONS) return null;
  const norm = name.toLowerCase();
  for (const [key, val] of Object.entries(DESTINATIONS)) {
    if (val && val.name) {
      const valNameNorm = val.name.toLowerCase();
      if (norm.includes(valNameNorm) || norm.includes(key.toLowerCase()) || valNameNorm.includes(norm)) {
        return val;
      }
    }
  }
  return null;
}

function buildRouteSuggestions({ origin, destination, distanceKm, durationHours, transportMode, pois = [], tripType }) {
  const suggestions = [];
  const destDest = findDestination(destination);

  const restaurant = pois.find(p => p.category === 'restaurant');
  const cafe = pois.find(p => p.category === 'cafe');
  if (restaurant) {
    suggestions.push({
      type: 'stop',
      icon: '',
      title: `Stop at ${restaurant.name}`,
      description: `Roughly ${((restaurant.distanceFromStart || 0) / 1000).toFixed(0)}km into your route — a good spot to break up the drive.`,
      addable: true
    });
  } else if (destDest?.highlights?.length) {
    suggestions.push({
      type: 'stop',
      icon: '',
      title: `Don't miss ${destDest.highlights[0]}`,
      description: `One of the top things to see once you arrive in ${destDest.name}.`,
      addable: true
    });
  }

  if (destDest?.food?.length) {
    suggestions.push({
      type: 'food',
      icon: '',
      title: `Eat at ${destDest.food[0].split('(')[0].trim()}`,
      description: `A well-liked spot in ${destDest.name}.`,
      addable: false
    });
  } else if (cafe) {
    suggestions.push({
      type: 'food',
      icon: '',
      title: `Coffee break at ${cafe.name}`,
      description: `Conveniently placed along your route.`,
      addable: true
    });
  }

  if (tripType === 'family') {
    suggestions.push({
      type: 'tip',
      icon: '',
      title: 'Family travel pace',
      description: `With kids, expect the ${durationHours.toFixed(1)}h drive to take a bit longer. Plan for frequent bathroom and snack stops.`,
      addable: false
    });
  } else if (tripType === 'solo') {
    suggestions.push({
      type: 'tip',
      icon: '',
      title: 'Solo traveler safety',
      description: `Keep your friends or family updated on your location along the ${distanceKm.toFixed(0)}km route, especially in rural areas.`,
      addable: false
    });
  } else if (tripType === 'friends') {
    suggestions.push({
      type: 'tip',
      icon: '',
      title: 'Group road trip',
      description: `Stock up on snacks and a good playlist for the ${durationHours.toFixed(1)}h journey!`,
      addable: false
    });
  }


  if (transportMode === 'driving' && distanceKm > 100) {
    suggestions.push({
      type: 'tip',
      icon: '',
      title: 'Fuel up before you leave',
      description: `It's a ${distanceKm.toFixed(0)}km drive — top up the tank in town, as stations thin out on rural stretches.`,
      addable: false
    });
  } else if (transportMode === 'cycling') {
    suggestions.push({
      type: 'tip',
      icon: '',
      title: 'Pack extra water',
      description: `${distanceKm.toFixed(0)}km by bike in tropical heat — carry more water than you think you need, and start early.`,
      addable: false
    });
  } else if (transportMode === 'walking') {
    suggestions.push({
      type: 'tip',
      icon: '',
      title: 'Watch the midday heat',
      description: `Walking ${distanceKm.toFixed(1)}km — aim to do the bulk of it before 11am or after 4pm.`,
      addable: false
    });
  } else {
    suggestions.push({
      type: 'tip',
      icon: '',
      title: 'Roads can be slower than expected',
      description: `Sri Lankan roads are winding in places — your ${durationHours.toFixed(1)}h estimate can stretch with traffic, so build in a buffer.`,
      addable: false
    });
  }

  if (destDest?.tips?.length) {
    suggestions.push({
      type: 'experience',
      icon: '',
      title: `Local tip for ${destDest.name}`,
      description: destDest.tips[0],
      addable: false
    });
  } else {
    suggestions.push({
      type: 'experience',
      icon: '',
      title: 'Dress modestly for temple stops',
      description: `If your route passes any temples, cover shoulders and knees and be ready to remove your shoes.`,
      addable: false
    });
  }

  if (destDest?.bestTimeToVisit) {
    suggestions.push({
      type: 'warning',
      icon: '',
      title: `Best time for ${destDest.name}`,
      description: destDest.bestTimeToVisit,
      addable: false
    });
  } else {
    suggestions.push({
      type: 'warning',
      icon: '',
      title: 'Check the weather before you go',
      description: PRACTICAL?.climate?.general || '',
      addable: false
    });
  }

  return suggestions.slice(0, 5);
}

function buildDailyTips({ hour, weatherContext, originDestName }) {
  const tips = [];
  const timeOfDay = hour < 11 ? 'morning' : hour < 14 ? 'midday' : hour < 18 ? 'afternoon' : 'evening';

  if (timeOfDay === 'morning') {
    tips.push('Mornings are the best time to visit popular sites before the heat and crowds build up.');
  } else if (timeOfDay === 'midday') {
    tips.push("It's peak heat right now — keep water on hand and consider an indoor or shaded stop for the next hour or two.");
  } else if (timeOfDay === 'afternoon') {
    tips.push('Afternoon light is great for photos, but traffic tends to build heading into towns around this time.');
  } else {
    tips.push("Many rural roads have limited lighting after dark — if you're still driving, take it slow and watch for pedestrians and animals.");
  }

  if (weatherContext === 'rainy') {
    tips.push('Rain can make Sri Lankan roads slippery and visibility lower — reduce speed and increase following distance.');
  } else if (weatherContext === 'sunny') {
    tips.push('Strong sun today — sunscreen and a hat will go a long way, especially at exposed viewpoints.');
  } else {
    tips.push('Cloud cover today is actually good news for hiking or outdoor sightseeing — less heat fatigue.');
  }

  const dest = findDestination(originDestName);
  if (dest?.tips?.length) {
    tips.push(dest.tips[Math.floor(Math.random() * dest.tips.length)]);
  } else {
    tips.push("Keep a little cash on hand — small towns and rural stops don't always take cards.");
  }

  return tips.slice(0, 3);
}

module.exports = {
  emojiFor,
  findDestination,
  buildRouteSuggestions,
  buildDailyTips
};