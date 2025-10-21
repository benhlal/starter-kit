const admin = require("firebase-admin");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// Sample images - high quality, working Unsplash URLs for AR coin hunt events
const sampleImages = [
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&q=80", // NYC streets
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", // Mountain landscape
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=80", // City downtown
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80", // City skyline
  "https://images.unsplash.com/photo-1516483638261-f4dbbd436418?w=400&q=80", // Forest path
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", // Waterfront city
  "https://images.unsplash.com/photo-1554223090-74785ad8b2c3?w=400&q=80", // Marina/harbor
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&q=80", // Urban bridge
  "https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=400&q=80", // City park
  "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&q=80", // City exploration
  "https://images.unsplash.com/photo-1542931565-e8bdd762a97b?w=400&q=80", // Tech/AR themed
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80", // Modern city
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", // Urban lifestyle
  "https://images.unsplash.com/photo-1494522358652-f30e61a60313?w=400&q=80", // Adventure/treasure hunt
  "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1f?w=400&q=80", // Urban adventure
  "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=80", // City night
  "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&q=80", // Urban exploration
  "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&q=80", // City lights
  "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400&q=80", // Mountain trail
  "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&q=80", // Beach adventure
];

// Demo data configuration
const DEMO_CONFIG = {
  TOTAL_EVENTS: 15,
  TOTAL_USERS: 50,
  BASE_ENTRY_FEE: 5, // Base coins to join
  LATE_FEE_PENALTY: 10, // Extra for joining ongoing events
  BONUS_MULTIPLIER: 1.5, // Prize pool multiplier
  COINS_PER_EVENT: { min: 8, max: 20 },
  PARTICIPANTS_PER_EVENT: { min: 3, max: 15 },
  COIN_VALUE_RANGE: { min: 5, max: 25 },
  EVENT_DURATION_HOURS: { min: 2, max: 6 },
};

// Realistic locations for AR coin hunts
const HUNT_LOCATIONS = [
  {
    name: "Central Park",
    coords: { latitude: 40.7829, longitude: -73.9654 },
    description: "Iconic urban park perfect for AR adventures",
    terrain: "Urban",
    difficulty: "Easy",
  },
  {
    name: "Golden Gate Park",
    coords: { latitude: 37.7694, longitude: -122.4862 },
    description: "Large park with diverse landscapes",
    terrain: "Park",
    difficulty: "Medium",
  },
  {
    name: "Venice Beach Boardwalk",
    coords: { latitude: 33.985, longitude: -118.4695 },
    description: "Vibrant beach boardwalk with street performers",
    terrain: "Beach",
    difficulty: "Easy",
  },
  {
    name: "Rockefeller Center",
    coords: { latitude: 40.758, longitude: -73.9855 },
    description: "Historic urban landmark with ice rink",
    terrain: "Urban",
    difficulty: "Medium",
  },
  {
    name: "Griffith Observatory",
    coords: { latitude: 34.1184, longitude: -118.3004 },
    description: "Hilltop observatory with city views",
    terrain: "Mountain",
    difficulty: "Hard",
  },
  {
    name: "Brooklyn Bridge Park",
    coords: { latitude: 40.7021, longitude: -73.9967 },
    description: "Waterfront park under iconic bridge",
    terrain: "Park",
    difficulty: "Easy",
  },
  {
    name: "Santa Monica Pier",
    coords: { latitude: 34.0086, longitude: -118.4987 },
    description: "Classic pier with amusement park",
    terrain: "Beach",
    difficulty: "Easy",
  },
  {
    name: "High Line Park",
    coords: { latitude: 40.748, longitude: -74.0048 },
    description: "Elevated park on old railway tracks",
    terrain: "Urban",
    difficulty: "Medium",
  },
];

// Event templates for AR coin hunts
const HUNT_TEMPLATES = [
  {
    name: "Mystery Treasure Hunt",
    description:
      "Follow clues to find hidden treasures scattered throughout the area. Each coin tells part of the story!",
    type: "Flash Hunt",
    huntType: "treasure-hunt",
  },
  {
    name: "Speed Coin Rush",
    description:
      "Race against time to collect as many coins as possible. First to collect them all wins bonus prizes!",
    type: "Adventure Hunt",
    huntType: "challenge",
  },
  {
    name: "Epic Journey Quest",
    description:
      "Embark on a grand adventure collecting coins along a scenic route. Perfect for explorers!",
    type: "Epic Journey Hunt",
    huntType: "treasure-hunt",
  },
  {
    name: "Neighborhood Explorer",
    description:
      "Discover hidden gems in your local area. Each coin reveals interesting facts about the location!",
    type: "Flash Hunt",
    huntType: "community-event",
  },
  {
    name: "Photo Scavenger Hunt",
    description:
      "Find coins near interesting photo opportunities. Capture memories while collecting treasures!",
    type: "Adventure Hunt",
    huntType: "social",
  },
];

// Utility functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNearbyCoords(centerLat, centerLng, radiusMeters = 500) {
  // Generate random coordinates within radius
  const radiusInDegrees = radiusMeters / 111320; // Rough conversion
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;

  return {
    latitude: centerLat + distance * Math.cos(angle),
    longitude: centerLng + distance * Math.sin(angle),
  };
}

function calculatePrizePool(participants, baseFee, collectedTokens) {
  // Prize pool = (participants × baseFee × bonus) + collectedTokens
  const entryFees = participants * baseFee;
  const totalPrize =
    Math.floor(entryFees * DEMO_CONFIG.BONUS_MULTIPLIER) + collectedTokens;
  return totalPrize;
}

function generateEventStatus() {
  const rand = Math.random();
  if (rand < 0.4) return "ongoing"; // 40% ongoing
  if (rand < 0.7) return "upcoming"; // 30% upcoming
  return "completed"; // 30% completed
}

function generateEventDates(status) {
  const now = new Date();

  if (status === "completed") {
    // Completed: ended 1-7 days ago, lasted 2-6 hours
    const endDate = new Date(
      now.getTime() - getRandomInt(1, 7) * 24 * 60 * 60 * 1000
    );
    const duration =
      getRandomInt(
        DEMO_CONFIG.EVENT_DURATION_HOURS.min,
        DEMO_CONFIG.EVENT_DURATION_HOURS.max
      ) *
      60 *
      60 *
      1000;
    const startDate = new Date(endDate.getTime() - duration);
    return { startDate, endDate };
  }

  if (status === "ongoing") {
    // Ongoing: started 30min-2hours ago, ends in 1-4 hours
    const startDate = new Date(
      now.getTime() - getRandomInt(30, 120) * 60 * 1000
    );
    const duration = getRandomInt(60, 240) * 60 * 1000; // 1-4 hours from now
    const endDate = new Date(now.getTime() + duration);
    return { startDate, endDate };
  }

  // Upcoming: starts in 1-14 days, lasts 2-6 hours
  const startDate = new Date(
    now.getTime() + getRandomInt(1, 14) * 24 * 60 * 60 * 1000
  );
  const duration =
    getRandomInt(
      DEMO_CONFIG.EVENT_DURATION_HOURS.min,
      DEMO_CONFIG.EVENT_DURATION_HOURS.max
    ) *
    60 *
    60 *
    1000;
  const endDate = new Date(startDate.getTime() + duration);
  return { startDate, endDate };
}

async function createDemoUsers() {
  console.log("Creating demo users...");

  const users = [];
  for (let i = 0; i < DEMO_CONFIG.TOTAL_USERS; i++) {
    const userId = `demo-user-${i + 1}`;
    const userData = {
      id: userId,
      name: `Demo Player ${i + 1}`,
      email: `player${i + 1}@demo.com`,
      profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
      level: getRandomInt(1, 10),
      totalCoins: getRandomInt(500, 2000),
      joinedEvents: [],
      collectedCoins: [],
      location: generateNearbyCoords(40.7128, -74.006, 50000), // Within NYC area
      preferences: {
        notifications: Math.random() > 0.3,
        theme: Math.random() > 0.5 ? "dark" : "light",
        language: "en",
      },
      stats: {
        eventsJoined: 0,
        coinsCollected: 0,
        totalDistance: getRandomInt(1000, 10000),
        daysActive: getRandomInt(1, 30),
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("users").doc(userId).set(userData);
    users.push(userData);
  }

  console.log(`Created ${users.length} demo users`);
  return users;
}

async function createDemoEvent(location, template, users) {
  const status = generateEventStatus();
  const { startDate, endDate } = generateEventDates(status);

  // Select random participants
  const numParticipants = getRandomInt(
    DEMO_CONFIG.PARTICIPANTS_PER_EVENT.min,
    Math.min(DEMO_CONFIG.PARTICIPANTS_PER_EVENT.max, users.length)
  );
  const participants = users
    .sort(() => Math.random() - 0.5)
    .slice(0, numParticipants);

  // Calculate prize pool based on participants
  const baseFee = DEMO_CONFIG.BASE_ENTRY_FEE;
  const lateFeePenalty =
    status === "ongoing" ? DEMO_CONFIG.LATE_FEE_PENALTY : 0;
  const totalEntryFees = participants.length * (baseFee + lateFeePenalty);
  const prizePool = calculatePrizePool(
    participants.length,
    baseFee + lateFeePenalty,
    0
  );

  // Create event data
  const eventData = {
    name: `${template.name} at ${location.name}`,
    description: template.description,
    type: template.huntType,
    status: status,
    location: {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      address: `${location.name}, USA`,
      venue: location.name,
    },
    coordinate: location.coords,
    startDate: admin.firestore.Timestamp.fromDate(startDate),
    endDate: admin.firestore.Timestamp.fromDate(endDate),
    maxParticipants: getRandomInt(20, 50),
    currentParticipants: participants.length,
    participants: participants.map((u) => u.id),
    organizer: {
      id: "admin",
      name: "AR Coin Hunt Team",
    },
    tags: ["ar", "coins", "hunt", location.terrain.toLowerCase()],
    image: getRandomElement(sampleImages),
    rewards: {
      coins: prizePool,
      experience: getRandomInt(50, 200),
      badges: ["Explorer", "Collector"],
    },
    minCoins: getRandomInt(
      DEMO_CONFIG.COINS_PER_EVENT.min,
      DEMO_CONFIG.COINS_PER_EVENT.max
    ),
    requirements: {
      minLevel: getRandomInt(1, 3),
    },
    visibility: "public",
    huntDetails: {
      coinsAvailable: getRandomInt(
        DEMO_CONFIG.COINS_PER_EVENT.min,
        DEMO_CONFIG.COINS_PER_EVENT.max
      ),
      difficulty: location.difficulty,
      terrain: location.terrain,
      range: getRandomInt(500, 2000), // meters
      totalPrizePool: prizePool,
      huntType: template.type,
    },
    terrain: location.terrain,
    difficulty: location.difficulty,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Create event
  const eventRef = await db.collection("events").add(eventData);
  const eventId = eventRef.id;

  console.log(
    `Created event: ${eventData.name} (${status}) - ${participants.length} participants, ${prizePool} coin prize pool`
  );

  // Create coins for the event
  const numCoins = eventData.huntDetails.coinsAvailable;
  const coins = [];

  for (let i = 0; i < numCoins; i++) {
    const coinLocation = generateNearbyCoords(
      location.coords.latitude,
      location.coords.longitude,
      300 // Within 300m of event center
    );

    const coinData = {
      name: `Coin ${i + 1}`,
      description: `Treasure coin #${i + 1} in ${location.name}`,
      value: getRandomInt(
        DEMO_CONFIG.COIN_VALUE_RANGE.min,
        DEMO_CONFIG.COIN_VALUE_RANGE.max
      ),
      type: "event",
      rarity: Math.random() > 0.8 ? "rare" : "common",
      eventId: eventId,
      createdBy: "admin",
      location: coinLocation,
      coordinate: coinLocation,
      region: location.name.toLowerCase().replace(/\s+/g, "-"),
      collectible: true,
      collected: false,
      collectedBy: null,
      collectedAt: null,
      image: `https://api.dicebear.com/7.x/shapes/svg?seed=coin-${i}`,
      arModel: "coin",
      effects: {
        sound: "coin_collect.mp3",
        particle: "sparkle",
      },
      requirements: {
        level: 1,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const coinRef = await db.collection("coins").add(coinData);
    coins.push({ id: coinRef.id, ...coinData });
  }

  // Simulate coin collection for ongoing/completed events
  if (status !== "upcoming") {
    const coinsToCollect = Math.floor(
      numCoins * (status === "completed" ? 0.7 : 0.4)
    ); // 70% collected for completed, 40% for ongoing
    const coinsToCollectList = coins
      .sort(() => Math.random() - 0.5)
      .slice(0, coinsToCollect);

    for (const coin of coinsToCollectList) {
      const collector = getRandomElement(participants);
      await db.collection("coins").doc(coin.id).update({
        collected: true,
        collectedBy: collector.id,
        collectedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Update user stats
      await db
        .collection("users")
        .doc(collector.id)
        .update({
          totalCoins: admin.firestore.FieldValue.increment(coin.value),
          collectedCoins: admin.firestore.FieldValue.arrayUnion(coin.id),
        });
    }

    console.log(`  - ${coinsToCollect} coins collected out of ${numCoins}`);
  }

  // Update user participation
  for (const user of participants) {
    await db
      .collection("users")
      .doc(user.id)
      .update({
        joinedEvents: admin.firestore.FieldValue.arrayUnion(eventId),
      });
  }

  return { eventId, eventData, coins };
}

async function populateDemoData() {
  console.log("Starting AR Coin Hunt demo data population...");
  console.log("Configuration:", DEMO_CONFIG);

  try {
    // Clear existing data
    console.log("Clearing existing demo data...");
    await db
      .collection("events")
      .get()
      .then((snapshot) => {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        return batch.commit();
      });
    await db
      .collection("coins")
      .get()
      .then((snapshot) => {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        return batch.commit();
      });
    await db
      .collection("users")
      .get()
      .then((snapshot) => {
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        return batch.commit();
      });

    // Create demo users
    const users = await createDemoUsers();

    // Create demo events
    console.log("Creating demo events...");
    const events = [];

    for (let i = 0; i < DEMO_CONFIG.TOTAL_EVENTS; i++) {
      const location = getRandomElement(HUNT_LOCATIONS);
      const template = getRandomElement(HUNT_TEMPLATES);

      const eventResult = await createDemoEvent(location, template, users);
      events.push(eventResult);
    }

    // Summary
    console.log("\n🎉 Demo data population complete!");
    console.log(`📊 Created ${DEMO_CONFIG.TOTAL_USERS} users`);
    console.log(`🎯 Created ${DEMO_CONFIG.TOTAL_EVENTS} events`);
    console.log(
      `🪙 Created ${events.reduce(
        (sum, e) => sum + e.coins.length,
        0
      )} coins total`
    );

    // Calculate some stats
    const totalPrizePool = events.reduce(
      (sum, e) => sum + e.eventData.rewards.coins,
      0
    );
    const totalCoinsCollected = events.reduce((sum, e) => {
      return sum + e.coins.filter((c) => c.collected).length;
    }, 0);

    console.log(`💰 Total prize pool: ${totalPrizePool} coins`);
    console.log(`✅ Total coins collected: ${totalCoinsCollected}`);

    console.log(
      "\n🚀 Demo data ready! You can now test the app with realistic AR coin hunt scenarios."
    );
  } catch (error) {
    console.error("Error populating demo data:", error);
    process.exit(1);
  }
}

populateDemoData();
