require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Tour = require('./models/Tour');
const Hotel = require('./models/Hotel');
const Facility = require('./models/Facility');

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@tourgenie.com';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';

const seedFacilities = [
  { name: 'Airport Pickup & Drop-off', category: 'transport', icon: 'car', description: 'Private transfer between the hotel and the nearest airport.' , extraPrice: 6000 },
  { name: 'Spa Access', category: 'wellness', icon: 'sparkles', description: 'Full-day access to the spa and wellness facilities.', extraPrice: 4500 },
  { name: 'High Tea Service', category: 'dining', icon: 'coffee', description: 'Traditional Sri Lankan high tea served on arrival.', extraPrice: 2500 },
  { name: 'Private Pool Access', category: 'recreation', icon: 'waves', description: 'Access to a private or adults-only pool area.', extraPrice: 3000 },
  { name: 'In-Room Breakfast', category: 'dining', icon: 'utensils', description: 'Breakfast served in-room instead of the restaurant.', extraPrice: 1500 },
  { name: 'Late Checkout (until 6pm)', category: 'general', icon: 'clock', description: 'Extend checkout time without an extra night charge.', extraPrice: 2000 },
  { name: 'Guided Nature Walk', category: 'recreation', icon: 'footprints', description: 'A guided walk through the property grounds or nearby trails.', extraPrice: 0 },
  { name: 'Free Wi-Fi Upgrade', category: 'business', icon: 'wifi', description: 'High-speed fibre Wi-Fi for the duration of the stay.', extraPrice: 0 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding');

    if (!process.env.SEED_ADMIN_PASSWORD) {
      console.warn(
        '⚠️  SEED_ADMIN_PASSWORD not set — using the default demo password.\n' +
        '   Set SEED_ADMIN_PASSWORD (and optionally SEED_ADMIN_EMAIL) in your .env\n' +
        '   before seeding any environment that is publicly reachable.',
      );
    }

    // Do not delete Users, Tours, or Hotels as it wipes existing data!
    await Facility.deleteMany();

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    const existingTours = await Tour.countDocuments();
    if (existingTours === 0) {
      await Tour.create({
        title: 'Cultural Heritage Tour',
        location: 'Cultural Triangle, Sri Lanka',
        description: 'Explore the ancient wonders of Sri Lanka.',
        duration: '3 Days',
        rating: 4.8,
        price: 25000,
        startLat: 7.8731,
        startLng: 80.7718,
        startName: 'Colombo Fort',
        coverImage: '/tours/Sigiriya-1784648461170-751429940.jpg',
        photos: ['/tours/Sigiriya-1784648461170-751429940.jpg'],
        tags: ['Cultural', 'Historic'],
        stops: [
          {
            stopName: 'Sigiriya Rock Fortress',
            lat: 7.957,
            lng: 80.760,
            triggerRadius: 100,
            description: 'An ancient palace and fortress complex with significant archaeological importance.',
            imageUrl: '/tours/Sigiriya_2-1784648461165-726700345.jpg',
            arrivalOffsetMinutes: 120,
            durationMinutes: 180
          },
          {
            stopName: 'Polonnaruwa Ancient City',
            lat: 7.940,
            lng: 81.000,
            triggerRadius: 100,
            description: "The second most ancient of Sri Lanka's kingdoms.",
            imageUrl: '/tours/Polonnaruwa-1784648461173-728573553.jpg',
            arrivalOffsetMinutes: 240,
            durationMinutes: 120
          },
          {
            stopName: 'Anuradhapura Sacred City',
            lat: 8.311,
            lng: 80.403,
            triggerRadius: 100,
            description: 'One of the ancient capitals of Sri Lanka, famous for its well-preserved ruins.',
            imageUrl: '/tours/Anuradhapura-1784648461176-855888163.jpg',
            arrivalOffsetMinutes: 360,
            durationMinutes: 150
          }
        ]
      });
      console.log('✅ Sample Tour seeded successfully');
    }
    // Check if admin exists to avoid duplicate key errors or wiping other users
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin User',
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
      });
    }


    const facilities = await Facility.insertMany(seedFacilities);
    const facilityIds = facilities.map((f) => f._id);


    console.log(`✅ Database seeded successfully! (${facilities.length} facilities,)`);
    console.log(`✅ Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seed();
