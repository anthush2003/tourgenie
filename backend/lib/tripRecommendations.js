const { DESTINATIONS, PRACTICAL } = require('./knowledgeBase');
const { findDestination } = require('./routeSuggestions');

const TRIP_TYPES = ['family', 'friends', 'couple', 'solo', 'business'];

const TRIP_TYPE_META = {
  family: { label: 'Family Trip', icon: '' },
  friends: { label: 'Trip with Friends', icon: '' },
  couple: { label: "Couple's Getaway", icon: '' },
  solo: { label: 'Solo Adventure', icon: '' },
  business: { label: 'Business Trip', icon: '' },
};

function normalizeTripType(input) {
  const t = (input || '').toString().toLowerCase().trim();
  return TRIP_TYPES.includes(t) ? t : 'family';
}

const TYPE_TAGS = {
  family: ['wildlife', 'beach', 'culture', 'nature'],
  friends: ['adventure', 'nightlife', 'beach', 'surf'],
  couple: ['scenic', 'romantic', 'nature', 'hillcountry'],
  solo: ['culture', 'adventure', 'backpacker'],
  business: ['city'],
};

function pickDestinationHighlight(destDest, tripType) {
  if (!destDest?.highlights?.length) return null;
  if (tripType === 'family') {
    const easy = destDest.highlights.find((h) =>
      /beach|park|market|museum|zoo|garden|lake/i.test(h),
    );
    return easy || destDest.highlights[0];
  }
  if (tripType === 'couple') {
    const scenic = destDest.highlights.find((h) =>
      /view|sunset|beach|garden|falls|lake|hill/i.test(h),
    );
    return scenic || destDest.highlights[0];
  }
  return destDest.highlights[0];
}

function buildTripTypeRecommendations({
  tripType,
  origin,
  destination,
  distanceKm = 0,
  durationHours = 0,
  transportMode = 'driving',
  travelerCount = 2,
  pois = [],
}) {
  const type = normalizeTripType(tripType);
  const destDest = findDestination(destination);
  const recs = [];

  const destName = destDest?.name || destination || '';

  if (type === 'family') {
    if (durationHours > 3) {
      recs.push({
        type: 'pacing', icon: '',
        title: 'Plan a rest stop for the kids',
        description: `${durationHours.toFixed(1)}h on the road is a lot for little ones — break it up with a stop roughly halfway, ideally somewhere with shade and a toilet.`,
      });
    } else {
      recs.push({
        type: 'pacing', icon: '',
        title: 'A manageable drive for the family',
        description: `At ${durationHours.toFixed(1)}h, this is a comfortable length for kids — pack snacks and a couple of games for the ride anyway.`,
      });
    }
  } else if (type === 'friends') {
    recs.push({
      type: 'pacing', icon: '',
      title: `Splitting costs for ${travelerCount}`,
      description: `With ${travelerCount} in the group, a shared tuk-tuk or van hire for the day often works out cheaper per person than individual rides — worth arranging in advance.`,
    });
  } else if (type === 'couple') {
    recs.push({
      type: 'pacing', icon: '',
      title: 'Time it for sunset',
      description: destDest?.bestTimeToVisit
        ? `Arriving in ${destName} with time to catch sunset makes for a memorable first evening — the best window is ${destDest.bestTimeToVisit}.`
        : 'Try to time your arrival for late afternoon — golden hour makes for the best photos and a relaxed first evening.',
    });
  } else if (type === 'solo') {
    recs.push({
      type: 'pacing', icon: '',
      title: 'Share your plans with someone',
      description: `Travelling solo to ${destName} — let a friend, family member, or your accommodation know your rough route and expected arrival time.`,
    });
  } else if (type === 'business') {
    recs.push({
      type: 'pacing', icon: '',
      title: 'Build in a buffer for traffic',
      description: `Sri Lankan travel times can run over estimate — for a ${durationHours.toFixed(1)}h trip, leave at least 30-45 extra minutes if you have a meeting or check-in time to hit.`,
    });
  }

  const highlight = pickDestinationHighlight(destDest, type);
  if (highlight) {
    const framing = {
      family: `A great, easy stop for kids in ${destName}.`,
      friends: `A solid group activity to kick things off in ${destName}.`,
      couple: `A lovely, scenic spot to enjoy together in ${destName}.`,
      solo: `Well worth exploring at your own pace in ${destName}.`,
      business: `If you get a spare hour in ${destName}, this is worth a quick look.`,
    }[type];
    recs.push({
      type: 'highlight', icon: '',
      title: highlight,
      description: framing,
    });
  }

  if (destDest?.food?.length) {
    const place = destDest.food[0].split('(')[0].trim();
    const framing = {
      family: `${place} in ${destName} is a good bet for a group with kids — ask if they have simpler dishes for picky eaters.`,
      friends: `${place} in ${destName} is great for a group meal — book ahead if there are more than 4 of you.`,
      couple: `${place} in ${destName} makes for a nice dinner for two.`,
      solo: `${place} in ${destName} is a good spot to grab a seat at the counter and chat with locals.`,
      business: `${place} in ${destName} is reliable if you need a working lunch or a client dinner.`,
    }[type];
    recs.push({ type: 'food', icon: '', title: `Eat at ${place}`, description: framing });
  }

  if (type === 'family') {
    recs.push({
      type: 'tip', icon: '',
      title: 'Pack a small first-aid kit',
      description: 'Basics like plasters, antiseptic, and motion-sickness tablets are handy — pharmacies (marked with a red cross) are common but not always open late in smaller towns.',
    });
  } else if (type === 'friends') {
    const hasNightlifeOrBeach = destDest?.tags?.includes('nightlife') || destDest?.tags?.includes('beach');
    recs.push({
      type: 'tip', icon: '',
      title: 'Check nightlife options ahead',
      description: hasNightlifeOrBeach
        ? `${destName} has a decent evening scene — worth booking a table if you want a specific spot.`
        : `${destName} is fairly quiet after dark — if a night out matters to the group, check what's actually open before you commit to staying there.`,
    });
  } else if (type === 'couple') {
    recs.push({
      type: 'tip', icon: '',
      title: 'Book accommodation with a view, early',
      description: 'The best-positioned rooms (sea view, valley view, etc.) sell out first, especially on weekends — worth booking a few days ahead.',
    });
  } else if (type === 'solo') {
    recs.push({
      type: 'tip', icon: '',
      title: 'Hostels are a good way to meet people',
      description: 'If you want company for a day trip or hike, hostel common areas and organised day tours are the easiest way to team up with other travellers.',
    });
  } else if (type === 'business') {
    recs.push({
      type: 'tip', icon: '',
      title: 'Confirm wifi/connectivity',
      description: 'Rural and coastal areas can have patchy mobile data — if you need reliable connectivity for calls, confirm it with your hotel before you rely on it.',
    });
  }

  if (destDest?.bestTimeToVisit) {
    recs.push({
      type: 'warning', icon: '',
      title: `Best time for ${destName}`,
      description: destDest.bestTimeToVisit,
    });
  } else {
    recs.push({
      type: 'warning', icon: '',
      title: 'Check the weather before you go',
      description: PRACTICAL?.climate?.general || '',
    });
  }

  return recs.slice(0, 5);
}

module.exports = {
  buildTripTypeRecommendations,
  TRIP_TYPES,
  TRIP_TYPE_META,
  normalizeTripType,
};