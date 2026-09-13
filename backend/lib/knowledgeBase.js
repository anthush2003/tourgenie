const DESTINATIONS = {
  sigiriya: { 
    name: 'Sigiriya Rock Fortress',
    lat: 7.9570,
    lng: 80.7603,
    category: 'Cultural',
    tags: ['unesco', 'history', 'hiking', 'views'],
    bestTimeToVisit: 'December to April',
    bestTime: 'December to April',
    recommendedStayDays: 1,
    description: 'An ancient rock fortress rising 200m from the jungle, featuring historical frescoes and mirror walls.',
    desc: 'An ancient rock fortress rising 200m from the jungle, featuring historical frescoes and mirror walls.',
    highlights: ['Sigiriya Rock Climb', 'Frescoes', 'Mirror Wall', 'Water Gardens'],
    food: ['Sigiri Rest Restaurant (Local Rice & Curry)', 'Chuti Juice Bar'],
    tips: ['Climb early morning to avoid the heat', 'Bring plenty of water'],
    entry: 'LKR 7,500',
    nearby: ['Dambulla', 'Pidurangala']
  },
  ella: { 
    name: 'Ella',
    lat: 6.8724,
    lng: 81.0510,
    category: 'Nature/Adventure',
    tags: ['hiking', 'tea-estates', 'waterfalls', 'trains'],
    bestTimeToVisit: 'January to May',
    bestTime: 'January to May',
    recommendedStayDays: 3,
    description: 'A scenic mountain town famous for the Nine Arch Bridge, hiking Ravana Ella, and lush tea plantations.',
    desc: 'A scenic mountain town famous for the Nine Arch Bridge, hiking Ravana Ella, and lush tea plantations.',
    highlights: ['Nine Arch Bridge', 'Little Adam\'s Peak', 'Ella Rock', 'Ravana Falls'],
    food: ['Cafe Chill (Western & Local fusion)', 'Matey Hut'],
    tips: ['Book your Kandy-Ella train tickets weeks in advance', 'Pack a light jacket for evenings'],
    entry: 'Free / Varies by hike',
    nearby: ['Haputale', 'Badulla']
  },
  kandy: { 
    name: 'Kandy',
    lat: 7.2906,
    lng: 80.6337,
    category: 'Cultural',
    tags: ['unesco', 'temple', 'lake', 'city-life'],
    bestTimeToVisit: 'December to April',
    bestTime: 'December to April',
    recommendedStayDays: 2,
    description: 'The last royal capital of Sri Lanka, home to the sacred Temple of the Tooth Relic.',
    desc: 'The last royal capital of Sri Lanka, home to the sacred Temple of the Tooth Relic.',
    highlights: ['Temple of the Tooth', 'Kandy Lake', 'Royal Botanical Gardens'],
    food: ['Slightly Chilled Lounge', 'Balaji Dosai'],
    tips: ['Wear clothing that covers shoulders and knees', 'Remove shoes at the temple entrance'],
    entry: 'LKR 2,500',
    nearby: ['Peradeniya', 'Matale']
  },
  galle: { 
    name: 'Galle',
    lat: 6.0535,
    lng: 80.2117,
    category: 'Cultural/Coastal',
    tags: ['unesco', 'fort', 'colonial-architecture', 'shopping'],
    bestTimeToVisit: 'November to April',
    bestTime: 'November to April',
    recommendedStayDays: 2,
    description: 'A historic coastal city known for its beautifully preserved 16th-century Dutch Fort.',
    desc: 'A historic coastal city known for its beautifully preserved 16th-century Dutch Fort.',
    highlights: ['Galle Dutch Fort', 'Light House', 'Ramparts at Sunset'],
    food: ['A Minute by Tuk Tuk', 'Pedlar\'s Inn Cafe'],
    tips: ['Walk the ramparts during sunset for the best views', 'Explore the narrow streets on foot'],
    entry: 'Free',
    nearby: ['Unawatuna', 'Hikkaduwa']
  },
  mirissa: { 
    name: 'Mirissa',
    lat: 5.9483,
    lng: 80.4716,
    category: 'Beach/Coastal',
    tags: ['beach', 'surfing', 'whale-watching', 'nightlife'],
    bestTimeToVisit: 'November to April',
    bestTime: 'November to April',
    recommendedStayDays: 2,
    description: 'A laid-back beach destination famed for whale watching, surfing, and Coconut Tree Hill.',
    desc: 'A laid-back beach destination famed for whale watching, surfing, and Coconut Tree Hill.',
    highlights: ['Coconut Tree Hill', 'Parrot Rock', 'Whale Watching Safari'],
    food: ['Zephyr Restaurant & Bar', 'No.1 Dewmini Roti Shop'],
    tips: ['Take the 6 AM boat for the best whale watching conditions', 'Coconut Tree Hill is best at sunrise'],
    entry: 'Free',
    nearby: ['Weligama', 'Matara']
  },
  colombo: { 
    name: 'Colombo',
    lat: 6.9271,
    lng: 79.8612,
    category: 'City/Commercial',
    tags: ['shopping', 'foodie', 'history', 'nightlife'],
    bestTimeToVisit: 'December to March',
    bestTime: 'December to March',
    recommendedStayDays: 1,
    description: 'The bustling, multi-cultural commercial capital blending colonial charm with modern skyscrapers.',
    desc: 'The bustling, multi-cultural commercial capital blending colonial charm with modern skyscrapers.',
    highlights: ['Galle Face Green', 'Pettah Market', 'Gangaramaya Temple'],
    food: ['Ministry of Crab', 'Upali\'s by Nawaloka'],
    tips: ['Use PickMe app for metered tuk-tuks', 'Galle Face Green is exceptional for street food in the evening'],
    entry: 'Free',
    nearby: ['Negombo', 'Mount Lavinia']
  },
  trincomalee: { 
    name: 'Trincomalee',
    lat: 8.5711,
    lng: 81.2335,
    category: 'Beach/Coastal',
    tags: ['beach', 'diving', 'snorkeling', 'temples'],
    bestTimeToVisit: 'May to October',
    bestTime: 'May to October',
    recommendedStayDays: 3,
    description: 'A natural harbor city on the east coast famous for Nilaveli Beach, Pigeon Island, and historic temples.',
    desc: 'A natural harbor city on the east coast famous for Nilaveli Beach, Pigeon Island, and historic temples.',
    highlights: ['Pigeon Island National Park', 'Nilaveli Beach', 'Koneswaram Temple'],
    food: ['Fernandos Beach Bar', 'Dutch Bank Cafe'],
    tips: ['Pigeon Island is fantastic for spotting blacktip reef sharks', 'Plan for hot afternoon weather'],
    entry: 'Varies',
    nearby: ['Nilaveli', 'Uppuveli']
  },
  nuwaraEliya: { 
    name: 'Nuwara Eliya',
    lat: 6.9497,
    lng: 80.7891,
    category: 'Nature/Highlands',
    tags: ['chilly-weather', 'tea-estates', 'golf', 'colonial'],
    bestTimeToVisit: 'February to April',
    bestTime: 'February to April',
    recommendedStayDays: 2,
    description: 'Often called "Little England," this cool, misty town is the heart of Sri Lankan tea production.',
    desc: 'Often called "Little England," this cool, misty town is the heart of Sri Lankan tea production.',
    highlights: ['Gregory Lake', 'Pedro Tea Estate', 'Post Office'],
    food: ['The Grand Thai', 'Barnes Hall'],
    tips: ['Bring warm clothes as temperatures drop significantly at night', 'Factory tours usually take 45 minutes'],
    entry: 'Free',
    nearby: ['Horton Plains', 'Hakgala']
  },
  yala: { 
    name: 'Yala National Park',
    lat: 6.3694,
    lng: 81.5173,
    category: 'Wildlife/Safari',
    tags: ['safari', 'leopards', 'elephants', 'camping'],
    bestTimeToVisit: 'February to June',
    bestTime: 'February to June',
    recommendedStayDays: 1,
    description: 'A wildlife reserve boasting one of the highest leopard densities in the world.',
    desc: 'A wildlife reserve boasting one of the highest leopard densities in the world.',
    highlights: ['4x4 Safari Ride', 'Leopard Sightings', 'Elephant Corridors'],
    food: ['Safari Lodge Buffet', 'Campsite BBQ'],
    tips: ['Book an open-top 4x4 jeep early', 'The park closes during peak dry months around September'],
    entry: 'LKR 6,000+',
    nearby: ['Kataragama', 'Tissamaharama']
  },
  anuradhapura: { 
    name: 'Anuradhapura',
    lat: 8.3114,
    lng: 80.4037,
    category: 'Cultural/Ancient',
    tags: ['unesco', 'ruins', 'temples', 'sacred-tree'],
    bestTimeToVisit: 'December to April',
    bestTime: 'December to April',
    recommendedStayDays: 2,
    description: 'One of the ancient capitals of Sri Lanka, famous for its massive, well-preserved Buddhist ruins.',
    desc: 'One of the ancient capitals of Sri Lanka, famous for its massive, well-preserved Buddhist ruins.',
    highlights: ['Jaya Sri Maha Bodhi', 'Ruwanwelisaya Stupa', 'Abhayagiri Monastery'],
    food: ['Seedevi Family Restaurant', 'The Sanctuary at Tissawewa'],
    tips: ['Rent a bicycle to explore the vast sacred layout comfortably', 'Wear thick socks as stone pathways get very hot'],
    entry: 'LKR 7,500',
    nearby: ['Mihintale', 'Polonnaruwa']
  },
  polonnaruwa: { 
    name: 'Polonnaruwa',
    lat: 7.9403,
    lng: 81.0188,
    category: 'Cultural/Ancient',
    tags: ['unesco', 'ruins', 'biking', 'history'],
    bestTimeToVisit: 'December to April',
    bestTime: 'December to April',
    recommendedStayDays: 1,
    description: 'A medieval capital city showcasing impressive stone sculptures, palace ruins, and ancient reservoirs.',
    desc: 'A medieval capital city showcasing impressive stone sculptures, palace ruins, and ancient reservoirs.',
    highlights: ['Gal Vihara', 'The Quadrangle', 'Parakrama Samudra'],
    food: ['Jayantha Rice Garden', 'Hotel Polonnaruwa Rest'],
    tips: ['Biking is the single best way to view the ruins', 'Keep an eye out for gray langur monkeys'],
    entry: 'LKR 7,500',
    nearby: ['Minneriya', 'Sigiriya']
  },
  minneriya: { 
    name: 'Minneriya',
    lat: 8.0305,
    lng: 80.8244,
    category: 'Wildlife/Safari',
    tags: ['safari', 'elephants', 'lake', 'national-park'],
    bestTimeToVisit: 'July to October', 
    bestTime: 'July to October', 
    recommendedStayDays: 1,
    description: 'A national park renowned for the spectacular "Gathering" of hundreds of wild Asian elephants.',
    desc: 'A national park renowned for the spectacular "Gathering" of hundreds of wild Asian elephants.',
    highlights: ['The Elephant Gathering', 'Minneriya Tank Scenic Views'],
    food: ['Lake Side Restaurant', 'Giritale Hotel Dining'],
    tips: ['Plan your safari for the late afternoon when herds gather by the water', 'Bring a telephoto lens'],
    entry: 'LKR 4,500',
    nearby: ['Habarana', 'Sigiriya']
  },
  arugamBay: { 
    name: 'Arugam Bay',
    lat: 6.8415,
    lng: 81.8310,
    category: 'Beach/Surf',
    tags: ['surfing', 'backpacker-vibe', 'nightlife', 'coastal'],
    bestTimeToVisit: 'May to September',
    bestTime: 'May to September',
    recommendedStayDays: 4,
    description: 'A world-class surf point on the southeast coast with a relaxed backpacker and surf culture.',
    desc: 'A world-class surf point on the southeast coast with a relaxed backpacker and surf culture.',
    highlights: ['Main Point Surf Break', 'Whiskey Point', 'Elephant Rock'],
    food: ['Hideaway Resort Restaurant', 'Siam View'],
    tips: ['Surf rentals are easily available along the main strip', 'The peak swell occurs around July and August'],
    entry: 'Free',
    nearby: ['Pottuvil', 'Kumana']
  },
  jaffna: { 
    name: 'Jaffna',
    lat: 9.6615,
    lng: 80.0088,
    category: 'Cultural',
    tags: ['hindu-culture', 'islands', 'seafood', 'history'],
    bestTimeToVisit: 'January to April',
    bestTime: 'January to April',
    recommendedStayDays: 3,
    description: 'The vibrant heart of northern Tamil culture, rich with colorful Kovils, fort ruins, and unique food.',
    desc: 'The vibrant heart of northern Tamil culture, rich with colorful Kovils, fort ruins, and unique food.',
    highlights: ['Nallur Kandaswamy Kovil', 'Jaffna Fort', 'Delft Island'],
    food: ['Mangos Indian Restaurant', 'Malayan Cafe'],
    tips: ['Men must remove shirts before entering the inner sanctum of Nallur Kovil', 'Try the local crab curry'],
    entry: 'Free',
    nearby: ['Point Pedro', 'Karainagar']
  },
  kataragama: { 
    name: 'Kataragama',
    lat: 6.4131,
    lng: 81.3312,
    category: 'Religious/Cultural',
    tags: ['pilgrimage', 'multifaith', 'temple', 'festivals'],
    bestTimeToVisit: 'July to August', 
    bestTime: 'July to August', 
    description: 'A sacred multi-religious pilgrimage site revered by Buddhists, Hindus, Muslims, and indigenous Vedda.',
    desc: 'A sacred multi-religious pilgrimage site revered by Buddhists, Hindus, Muslims, and indigenous Vedda.',
    highlights: ['Ruhunu Maha Kataragama Devalaya', 'Kiri Vehera Stupa'],
    food: ['Pilgrims Rest Dining', 'Local Sweet Stalls'],
    tips: ['The evening Pooja ritual features exceptional drumming and chanting ceremonies', 'Dress completely in white optionally'],
    entry: 'Free',
    nearby: ['Yala', 'Tissamaharama']
  },
  adamsPeak: { 
    name: "Adams Peak", 
    lat: 6.8096,
    lng: 80.4994,
    category: 'Religious/Adventure',
    tags: ['pilgrimage', 'night-hike', 'mountains', 'sunrise'],
    bestTimeToVisit: 'December to May', 
    bestTime: 'December to May', 
    recommendedStayDays: 1,
    description: 'A holy mountain featuring a sacred footprint, typically climbed overnight to witness an incredible sunrise.',
    desc: 'A holy mountain featuring a sacred footprint, typically climbed overnight to witness an incredible sunrise.',
    highlights: ['Sacred Footprint Peak', 'Sunrise Shadow Phenomenon'],
    food: ['Trailside Tea Stalls', 'Dalhousie Village Bakeries'],
    tips: ['Start climbing around 1 AM to catch the sunrise at the top', 'Avoid long weekend climbs during peak season'],
    entry: 'Free',
    nearby: ['Hatton', 'Kitulgala']
  },
  hortonPlains: { 
    name: 'Horton Plains',
    lat: 6.8028,
    lng: 80.8021,
    category: 'Nature/Adventure',
    tags: ['hiking', 'cloud-forest', 'waterfalls', 'views'],
    bestTimeToVisit: 'January to March',
    bestTime: 'January to March',
    recommendedStayDays: 1,
    description: 'A chilly, high-altitude plateau culminating in the dramatic 880-meter drop known as World\'s End.',
    desc: 'A chilly, high-altitude plateau culminating in the dramatic 880-meter drop known as World\'s End.',
    highlights: ['World\'s End Cliff Drop', 'Baker\'s Falls', 'Mini World\'s End'],
    food: ['Horton Plains Visitor Center Cafe'],
    tips: ['Pass the entrance gate by 6 AM before standard fog blocks the panoramic valley views', 'Plastics are completely banned'],
    entry: 'LKR 4,800',
    nearby: ['Nuwara Eliya', 'Ohiya']
  },
  sinharaja: { 
    name: 'Sinharaja',
    lat: 6.4011,
    lng: 80.4164,
    category: 'Nature/Rainforest',
    tags: ['unesco', 'rainforest', 'biodiversity', 'birdwatching'],
    bestTimeToVisit: 'January to March',
    bestTime: 'January to March',
    recommendedStayDays: 2,
    description: 'A virgin rainforest and UNESCO World Heritage site home to over 50% of Sri Lanka\'s endemic species.',
    desc: 'A virgin rainforest and UNESCO World Heritage site home to over 50% of Sri Lanka\'s endemic species.',
    highlights: ['Rainforest Trekking', 'Endemic Bird Watching', 'Hidden Waterfalls'],
    food: ['Rainforest Eco Lodge Dining', 'Local Village Guesthouses'],
    tips: ['Always hire a local tracker at the gate to avoid getting lost', 'Wear specialized leech socks'],
    entry: 'Varies',
    nearby: ['Deniyaya', 'Kudawa']
  },
  wilpattu: { 
    name: 'Wilpattu',
    lat: 8.4419,
    lng: 80.0152,
    category: 'Wildlife/Safari',
    tags: ['safari', 'leopards', 'bears', 'lakes'],
    bestTimeToVisit: 'February to October',
    bestTime: 'February to October',
    recommendedStayDays: 1,
    description: 'Sri Lanka\'s largest national park, characterized by unique natural rain-fed lakes (villus).',
    desc: 'Sri Lanka\'s largest national park, characterized by unique natural rain-fed lakes (villus).',
    highlights: ['Natural Villus Lakes', 'Leopard and Sloth Bear Safari'],
    food: ['Wilpattu Safari Camp Dining'],
    tips: ['Wilpattu offers a quieter experience with far fewer jeeps than Yala', 'Bring standard dust protection gear'],
    entry: 'Varies',
    nearby: ['Anuradhapura', 'Puttalam']
  },
  kalpitiya: { 
    name: 'Kalpitiya',
    lat: 8.2281,
    lng: 79.7611,
    category: 'Beach/Adventure',
    tags: ['kitesurfing', 'dolphins', 'beaches', 'marine-life'],
    bestTimeToVisit: 'May to September',
    bestTime: 'May to September',
    recommendedStayDays: 3,
    description: 'An adventure hotspot renowned for kitesurfing, dolphin watching, and pristine marine sanctuaries.',
    desc: 'An adventure hotspot renowned for kitesurfing, dolphin watching, and pristine marine sanctuaries.',
    highlights: ['Kitesurfing Lagoons', 'Dolphin Watching Cruises', 'Bar Reef Reefs'],
    food: ['Kitesurfing Camp Restaurants', 'Local Seafood Shacks'],
    tips: ['Dolphin tracking safaris operate optimally from November to April', 'Wind conditions peak from May through September'],
    entry: 'Free',
    nearby: ['Puttalam', 'Wilpattu']
  },
  dambulla: { 
    name: 'Dambulla Cave Temple',
    lat: 7.8564,
    lng: 80.6517,
    category: 'Cultural',
    tags: ['unesco', 'caves', 'temples', 'history'],
    bestTimeToVisit: 'December to April',
    bestTime: 'December to April',
    recommendedStayDays: 1,
    description: 'The largest and best-preserved cave temple complex in the country, filled with Buddhist murals and statues.',
    desc: 'The largest and best-preserved cave temple complex in the country, filled with Buddhist murals and statues.',
    highlights: ['Five Golden Cave Sanctuaries', 'Golden Buddha Statue'],
    food: ['Gami Gedara Traditional Buffet', 'Mango Mango Restaurant'],
    tips: ['Purchase tickets down at the primary base before hiking up the rock slope', 'Beware of wild monkeys'],
    entry: 'LKR 3,500',
    nearby: ['Sigiriya', 'Habarana']
  },
  bentota: { 
    name: 'Bentota',
    lat: 6.4211,
    lng: 79.9984,
    category: 'Beach/Resort',
    tags: ['beaches', 'watersports', 'luxury-resorts', 'river-safari'],
    bestTimeToVisit: 'November to April',
    bestTime: 'November to April',
    recommendedStayDays: 2,
    description: 'A pristine golden-sand beach community popular for river safaris, luxury resorts, and adrenaline-pumping watersports.',
    desc: 'A pristine golden-sand beach community popular for river safaris, luxury resorts, and adrenaline-pumping watersports.',
    highlights: ['Bentota River Safari', 'Jet Skiing & Wakeboarding', 'Brief Garden'],
    food: ['The Villa Cafe', 'Golden Grill Restaurant'],
    tips: ['The Madu Ganga river safari is a 30-minute drive away and well worth a visit', 'Book luxury resorts early'],
    entry: 'Free',
    nearby: ['Aluthgama', 'Ambalangoda']
  },
  hikkaduwa: { 
    name: 'Hikkaduwa',
    lat: 6.1388,
    lng: 80.1031,
    category: 'Beach/Nightlife',
    tags: ['beaches', 'coral-reef', 'snorkeling', 'nightlife'],
    bestTimeToVisit: 'November to April',
    bestTime: 'November to April',
    recommendedStayDays: 2,
    description: 'One of Sri Lanka\'s earliest tourist towns, highly popular for coral reef snorkeling, surfing, and beach parties.',
    desc: 'One of Sri Lanka\'s earliest tourist towns, highly popular for coral reef snorkeling, surfing, and beach parties.',
    highlights: ['Hikkaduwa Coral Sanctuary', 'Turtle Beach Hatchery', 'Surf Breaks'],
    food: ['Refresh Restaurant', 'Top Secret Beach Cafe'],
    tips: ['Snorkel early in the day when wave breaks are minimal to observe sea turtles clearly', 'Nightlife peaks on weekends'],
    entry: 'Free',
    nearby: ['Galle', 'Ambalangoda']
  },
  tangalle: { 
    name: 'Tangalle',
    lat: 6.0234,
    lng: 80.7967,
    category: 'Beach/Nature',
    tags: ['secluded-beaches', 'turtles', 'relaxation', 'coastal'],
    bestTimeToVisit: 'December to April',
    bestTime: 'December to April',
    recommendedStayDays: 3,
    description: 'A quieter coastal haven known for rugged wild beaches, quiet coves, and sea turtle nesting sites.',
    desc: 'A quieter coastal haven known for rugged wild beaches, quiet coves, and sea turtle nesting sites.',
    highlights: ['Hiriketiya Horseshoe Bay', 'Rekawa Turtle Sanctuary', 'Goyambokka Beach'],
    food: ['Dots Bay House', 'Cactus Lounge Tangalle'],
    tips: ['Head down to Rekawa beach at night to observe wild sea turtles nesting on the sand', 'Hiriketiya is amazing for surfing'],
    entry: 'Free',
    nearby: ['Dondra', 'Matara']
  },
  hambantota: { 
    name: 'Hambantota',
    lat: 6.1248,
    lng: 81.1185,
    category: 'City/Commercial',
    tags: ['port', 'dry-zone', 'salt-pans', 'nature-reserves'],
    bestTimeToVisit: 'January to April',
    bestTime: 'January to April',
    recommendedStayDays: 1,
    description: 'A key southern development hub characterized by arid landscapes, salt pans, and proximity to national parks.',
    desc: 'A key southern development hub characterized by arid landscapes, salt pans, and proximity to national parks.',
    highlights: ['Bundala National Park Bird Sanctuary', 'Salt Pans', 'Botanical Gardens'],
    food: ['Peacock Beach Dining Room', 'Jade Green Restaurant'],
    tips: ['Bundala is a world-class destination for observing seasonal migratory flamingo populations', 'Arid weather conditions prevail'],
    entry: 'Free',
    nearby: ['Yala', 'Tangalle']
  }
};

const ITINERARIES = {
  culturalTriangle: {
    id: 'cultural-triangle-classic',
    name: 'The Cultural & Historic Triangle Route',
    title: 'The Cultural & Historic Triangle Route',
    durationDays: 7,
    idealTransportation: ['cars.standard', 'chauffeurHire.sedanCompact'],
    route: ['colombo', 'dambulla', 'sigiriya', 'polonnaruwa', 'kandy'],
    description: 'A step back in time through ancient kingdoms, rock fortresses, cave temples, and the royal city of Kandy.',
    notes: 'Cover shoulders and knees at all sacred ruins.',
    days: [
      'Day 1: Arrive in Colombo; explore Fort, Galle Face Green, and local street markets.',
      'Day 2: Drive to Dambulla; explore the Golden Temple cave complex.',
      'Day 3: Climb the iconic Sigiriya Rock Fortress at sunrise. Enjoy a village tour.',
      'Day 4: Take a day excursion to Polonnaruwa Ancient Kingdom; explore ruins by bicycle.',
      'Day 5: Travel south to Kandy, stopping at a spice garden en route. Evening cultural dance show.',
      'Day 6: Visit the sacred Temple of the Tooth Relic and walk the Royal Botanical Gardens.',
      'Day 7: Return to Colombo / airport for departure.'
    ],
    dayByDay: [
      { day: 1, destination: 'colombo', activity: 'Arrive in Colombo; explore Fort, Galle Face Green, and local street markets.' },
      { day: 2, destination: 'dambulla', activity: 'Drive to Dambulla; explore the Golden Temple cave complex.' },
      { day: 3, destination: 'sigiriya', activity: 'Climb the iconic Sigiriya Rock Fortress at sunrise. Enjoy a village tour.' },
      { day: 4, destination: 'polonnaruwa', activity: 'Take a day excursion to Polonnaruwa Ancient Kingdom; explore ruins by bicycle.' },
      { day: 5, destination: 'kandy', activity: 'Travel south to Kandy, stopping at a spice garden en route. Evening cultural dance show.' },
      { day: 6, destination: 'kandy', activity: 'Visit the sacred Temple of the Tooth Relic and walk the Royal Botanical Gardens.' },
      { day: 7, destination: 'colombo', activity: 'Return to Colombo / airport for departure.' }
    ]
  },
  scenicHighlands: {
    id: 'scenic-highlands-train',
    name: 'Highlands & Tea Plantation Odyssey',
    title: 'Highlands & Tea Plantation Odyssey',
    durationDays: 6,
    idealTransportation: ['train', 'selfDriveRental.hybridSubcompact'],
    route: ['kandy', 'nuwaraEliya', 'hortonPlains', 'ella'],
    description: 'Chilly morning walks, emerald tea plantations, beautiful waterfalls, and the legendary Ella Train ride.',
    notes: 'Book train segments weeks in advance.',
    days: [
      'Day 1: Start in Kandy; explore Kandy lake and local bazaar.',
      'Day 2: Hop on the train or drive up winding hills to Nuwara Eliya. Tea estate factory tour.',
      'Day 3: Early morning hike in Horton Plains to see World\'s End before fog rolls in.',
      'Day 4: Embark on the iconic scenic train ride from Nanu Oya to Ella. Evening relaxing in town.',
      'Day 5: Hike Little Adam\'s Peak, watch trains pass the Nine Arch Bridge, and see Ravana Falls.',
      'Day 6: Morning breakfast overlooking the gap, then proceed to your next coastal loop or return.'
    ],
    dayByDay: [
      { day: 1, destination: 'kandy', activity: 'Start in Kandy; explore Kandy lake and local bazaar.' },
      { day: 2, destination: 'nuwaraEliya', activity: 'Hop on the train or drive up winding hills to Nuwara Eliya. Tea estate factory tour.' },
      { day: 3, destination: 'hortonPlains', activity: 'Early morning hike in Horton Plains to see World\'s End before fog rolls in.' },
      { day: 4, destination: 'ella', activity: 'Embark on the iconic scenic train ride from Nanu Oya to Ella. Evening relaxing in town.' },
      { day: 5, destination: 'ella', activity: 'Hike Little Adam\'s Peak, watch trains pass the Nine Arch Bridge, and see Ravana Falls.' },
      { day: 6, destination: 'ella', activity: 'Morning breakfast overlooking the gap, then proceed to your next coastal loop or return.' }
    ]
  },
  southernLoop: {
    id: 'southern-coastal-safari',
    name: 'Southern Coast, Beaches & Wildlife',
    title: 'Southern Coast, Beaches & Wildlife',
    durationDays: 7,
    idealTransportation: ['bikes.scooter', 'cars.standard'],
    route: ['galle', 'hikkaduwa', 'mirissa', 'tangalle', 'yala'],
    description: 'Colonial forts, golden beaches, surfing, whale watching, and leopards in the wild.',
    notes: 'Safaris launch at 6 AM sharp.',
    days: [
      'Day 1: Arrive at Galle Dutch Fort; explore historical cobblestone streets, boutiques, and sunset ramparts.',
      'Day 2: Snorkel amongst turtles and coral reefs in Hikkaduwa. Try fresh local seafood.',
      'Day 3: Drive to Mirissa. Sunset trek to Coconut Tree Hill; enjoy beachfront dining.',
      'Day 4: Early morning whale watching cruise. Rest of the day relaxing at Secret Beach.',
      'Day 5: Unwind at secluded Hiriketiya beach (great for beginner surfing) and see sea turtles.',
      'Day 6: Travel to Yala; take a late afternoon 4x4 guided wildlife safari.',
      'Day 7: Return loop up the coast road to Colombo or airport transfer.'
    ],
    dayByDay: [
      { day: 1, destination: 'galle', activity: 'Arrive at Galle Dutch Fort; explore historical cobblestone streets, boutiques, and sunset ramparts.' },
      { day: 2, destination: 'hikkaduwa', activity: 'Snorkel amongst turtles and coral reefs in Hikkaduwa. Try fresh local seafood.' },
      { day: 3, destination: 'mirissa', activity: 'Drive to Mirissa. Sunset trek to Coconut Tree Hill; enjoy beachfront dining.' },
      { day: 4, destination: 'mirissa', activity: 'Early morning whale watching cruise. Rest of the day relaxing at Secret Beach.' },
      { day: 5, destination: 'tangalle', activity: 'Unwind at secluded Hiriketiya beach (great for beginner surfing) and see sea turtles.' },
      { day: 6, destination: 'yala', activity: 'Travel to Yala; take a late afternoon 4x4 guided wildlife safari.' },
      { day: 7, destination: 'galle', activity: 'Return loop up the coast road to Colombo or airport transfer.' }
    ]
  }
};

const VEHICLES = {
  cars: {
    standard: { examples: 'Alto, WagonR', city: 14, highway: 18 },
    suv: { examples: 'Toyota Rav4, Honda CRV', city: 10, highway: 14 },
    electric: { examples: 'Nissan Leaf, Hyundai Kona', city: 6, highway: 7, range: '150-250km' },
    hybridBudgetHatchback: { examples: 'Toyota Aqua, Honda Fit', city: 22, highway: 26 },
    standardSedan: { examples: 'Toyota Corolla', city: 12, highway: 16 },
    passengerVan: { examples: 'Toyota HiAce KDH', city: 9, highway: 13 }
  },
  bikes: {
    scooter: { examples: 'Honda Dio', city: 35, outstation: 45 },
    adventure: { examples: 'Honda CRF 250, Royal Enfield Himalayan', city: 25, outstation: 32 },
    budgetCommuter: { examples: 'Bajaj CT100, TVS Metro', city: 55, outstation: 65 },
    classicCruiser: { examples: 'Royal Enfield Classic 350', city: 28, outstation: 35 }
  },
  threeWheelers: {
    petrol: { city: 20, outstation: 25 },
    lpgDiesel: { city: 22, outstation: 28 },
    electric: { range: '80-100km' }
  },
  efficiencyFactors: [
    'AC configurations increase usage by 10-15%',
    'Mountainous hill country climbs lower efficiency drastically',
    'Stop-and-go city gridlock matches city ratings precisely'
  ],
  rideHailing: {
    tuktuk: 100, budgetCar: 120, sedan: 150, vanSuv: 200
  },
  selfDriveRental: {
    budgetHatchback: 3000, hybridSubcompact: 4500, midSizeSuvSedan: 6000
  },
  chauffeurHire: {
    sedanCompact: 7000, suvMiniVan: 10000, largeVanLuxury: 15000
  },
  airportTransfers: {
    biaToColombo: 4000, 
    biaToKandy: 12000, 
    biaToGalleSouth: 15000,
    biaToSigiriya: 16000,
    biaToElla: 23000,
    biaToMirissa: 17000,
    biaToArugamBay: 30000
  },
  fuelPricesLKR: {
    octane92: 371,  
    octane95: 456,
    autoDiesel: 363,
    superDiesel: 468,
    chargingPerKwh: 80
  }
};

const FOOD = {
  vegetarian: 'Vegetarian cooking options are deep-rooted in the culture due to Buddhist and Hindu traditions. Most restaurants offer diverse dhal, jackfruit, beetroot, and analytical vegetable combinations side-by-side with staple rice dishes.',
  budgetGuide: 'Local village diners charge around LKR 250-600 per rice platform, whereas beachfront fusion locations vary from LKR 1,200 to 3,000 per plate.',
  mainDishes: {
    'kottu roti': 'A legendary street dish made from chopped parotta flatbread, vegetables, eggs, spices, and an optional choice of protein.',
    'hoppers (appam)': 'Crisp, bowl-shaped fermented rice flour and coconut milk pancakes prepared in customized rounded mini-pans.'
  }
};

const TRANSPORT = {
  train: {
    overview: 'The railway infrastructure features historic colonial tracks winding through valleys and mountains.',
    booking: 'Reserve observation platform platforms online at least 30 days prior to boarding operations.',
    tips: ['Kandy to Ella is the ultimate segment', 'Store active luggage on overhead compartments safely', 'Keep cameras secure by windows'],
    routes: {
      'Main Line': 'Colombo to Kandy, Nuwara Eliya (Nanu Oya), and Ella.',
      'Coastal Line': 'Colombo to Galle, Hikkaduwa, and Mirissa.'
    }
  },
  tukTuk: {
    overview: 'Three-wheelers provide unmatched local micro-navigation agility throughout city blocks.',
    pricing: 'Standard non-metered hops scale manually; establish prices prior to seating.',
    apps: 'Utilize localized application algorithms like PickMe or Uber to lock down authentic automated meters.',
    tips: ['Confirm active meters match zero on start', 'Carry exact change configurations always']
  },
  bus: {
    overview: 'Public networks span across nearly all interconnecting local sectors across the island footprint.',
    types: 'Standard government transport variants contrast with specialized air-conditioned private luxury minivans.',
    cost: 'Extremely economic, pricing scales around LKR 50-400 across continuous intercity routes.',
    tips: ['Keep loose notes active for conductors', 'Hold terminal structures tightly along turns']
  },
  privateCar: {
    overview: 'Hiring clean private transport with a local designated driver provides total route customization speed.',
    cost: 'Averages LKR 10,000 to 18,000 per day based entirely on engine configurations and distances.',
    tips: ['Drivers act as stellar contextual translators', 'Incorporate driver lodging inside booking terms']
  },
  domestic: {
    flights: 'Cinnamon Air operates continuous premium schedule tracking between urban centers and regional airports.'
  }
};

const PRACTICAL = {
  climate: {
    general: 'Two separate monsoons hit opposing geographical coastal zones sequentially across chronological brackets. The southwest window spans May through September, while northeast shifts run November through February.'
  },
  currency: {
    exchange: 'Banks down within regional airport zones handle conversions smoothly; local ATMs scale across major towns globally.'
  },
  visa: {
    overview: 'Incoming international travellers must generate active authorization online via official global portal endpoints.',
    cost: 'Standard electronic travel authority processing operates around 35 USD for typical tourist entries.',
    freeVisa: 'Specific global passport agreements allow exemptions across periodic legislative revisions.',
    extension: 'Apply via terminal visa offices inside Colombo if staying beyond standard initial limits.'
  },
  safety: {
    overall: 'The country presents an extremely safe environment for global explorers, showing high rankings for hospitality metrics.',
    scams: ['Overpriced gem shop guidance routes', 'Non-metered inner city tuk-tuk transport tracking lines'],
    beaches: 'Observe standard red flag surf alerts due to localized daily undercurrent changes.',
    wildlife: 'Maintain safe distance barriers inside park locations; follow safari tracking guides explicitly.'
  },
  health: {
    vaccinations: 'Standard international traveler shots are recommended before launching journeys.',
    water: 'Utilize purified, filtered, or sealed bottles exclusively during standard stays.',
    mosquitoes: 'Apply repellents dynamically during morning and twilight cycles to hedge against vectors.',
    heat: 'Tropical ambient environments necessitate high systematic hydration intervals regularly.',
    medicalCare: 'Urban centers provide top private hospital settings; localized smaller towns feature clinics.',
    emergency: 'Dial medical lines swiftly for direct fast tracking toward immediate care resources.'
  },
  connectivity: {
    sim: 'Acquire high-speed data SIM units within the terminal hall directly post-immigration check lines.',
    networks: 'Dialog and Mobitel run comprehensive network arrays with high speed 4G and 5G nodes.',
    wifi: 'Guesthouses provide standard local routing; remote sectors feature periodic grid tracking changes.'
  },
  electricity: {
    voltage: 'Operates standard 230V frameworks tracking with 50Hz electrical cycle baselines.',
    plugs: 'Utilizes specialized type G three-prong blocks alongside traditional rounded type D wall sockets.',
    note: 'Many hotels provide embedded universal sockets across updated bed setups.'
  },
  culture: {
    templeEtiquette: ['Remove footwear completely before entering temple perimeters', 'Never pose with your back turned directly to Buddha sculptures'],
    greetings: 'Ayubowan',
    bargaining: 'Acceptable across informal markets; maintain light-hearted conversational tones throughout.',
    photography: 'Request verbal validation before taking portraits of local individuals explicitly.',
    language: 'Sinhala and Tamil operate as official systems; English is spoken broadly across hospitality lines.'
  },
  shopping: {
    what: ['Pure Ceylon Leaf Tea packages', 'Handcrafted regional blue sapphire jewelry settings'],
    where: 'Traditional local bazaars, national manufacturing outlets, and artisan village centers.',
    avoid: 'Avoid unverified individual street gemstone dealers lacking valid regulatory trade credentials.'
  }
};

module.exports = {
  DESTINATIONS,
  ITINERARIES,
  VEHICLES,
  FOOD,
  TRANSPORT,
  PRACTICAL
};