#!/usr/bin/env node

/**
 * Run this script to migrate mock data to Firebase
 * Usage: node scripts/migrate-data.js [--dry-run] [--clear] [--batch-size=10]
 */

// Sample data for migration (since we can't easily import TypeScript in Node.js)
const sampleEvents = [
  {
    title: "Paris Treasure Hunt",
    description:
      "Explore the City of Light and discover hidden treasures around iconic landmarks.",
    type: "treasure-hunt",
    status: "active",
    location: {
      latitude: 48.8566,
      longitude: 2.3522,
      address: "Paris, France",
      venue: "City Center",
    },
    startDate: new Date("2024-03-01T10:00:00Z").toISOString(),
    endDate: new Date("2024-03-01T18:00:00Z").toISOString(),
    maxParticipants: 100,
    currentParticipants: 532,
    participants: [],
    organizer: { id: "event_organizer_1", name: "Paris Adventures" },
    tags: ["urban", "exploration", "landmarks"],
    image:
      "https://images.pexels.com/photos/338515/pexels-photo-338515.jpeg?auto=compress&w=600",
    rewards: {
      coins: 1200,
      experience: 500,
      badges: ["First Prize", "Second Prize", "Third Prize"],
    },
    visibility: "public",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "New York Central Park Hunt",
    description:
      "Navigate through Central Park's scenic paths while hunting for digital treasures.",
    type: "community-event",
    status: "active",
    location: {
      latitude: 40.7829,
      longitude: -73.9654,
      address: "Central Park, New York",
      venue: "Central Park",
    },
    startDate: new Date("2024-03-05T14:00:00Z").toISOString(),
    endDate: new Date("2024-03-05T20:00:00Z").toISOString(),
    maxParticipants: 75,
    currentParticipants: 420,
    participants: [],
    organizer: { id: "event_organizer_2", name: "NYC Explorers" },
    tags: ["nature", "park", "community"],
    image:
      "https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&w=600",
    rewards: {
      coins: 950,
      experience: 400,
      badges: ["First Prize", "Second Prize", "Third Prize"],
    },
    visibility: "public",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    title: "Tokyo Night Run",
    description:
      "Experience Tokyo's neon-lit streets in an exciting night-time treasure hunt.",
    type: "challenge",
    status: "active",
    location: {
      latitude: 35.6762,
      longitude: 139.6503,
      address: "Tokyo, Japan",
      venue: "Shibuya District",
    },
    startDate: new Date("2024-03-10T19:00:00Z").toISOString(),
    endDate: new Date("2024-03-10T23:00:00Z").toISOString(),
    maxParticipants: 50,
    currentParticipants: 300,
    participants: [],
    organizer: { id: "event_organizer_3", name: "Tokyo Treks" },
    tags: ["night", "city", "challenge"],
    image: "https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg",
    rewards: {
      coins: 150000,
      experience: 800,
      badges: ["First Prize", "Second Prize", "Third Prize"],
    },
    visibility: "public",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample user profiles
const sampleUsers = [
  {
    email: "john.doe@example.com",
    displayName: "John Doe",
    photoURL:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
    totalCoins: 25,
    level: 3,
    eventsJoined: 5,
    achievements: ["First Event", "Coin Collector", "Explorer"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    email: "jane.smith@example.com",
    displayName: "Jane Smith",
    photoURL:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
    totalCoins: 42,
    level: 5,
    eventsJoined: 8,
    achievements: [
      "First Event",
      "Coin Collector",
      "Explorer",
      "Social Butterfly",
      "Master Hunter",
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample coins
const sampleCoins = [
  {
    value: 10,
    region: "paris",
    collected: false,
    type: "standard",
    rarity: "common",
    location: { latitude: 48.8566, longitude: 2.3522 },
    collectible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    value: 25,
    region: "new_york",
    collected: false,
    type: "event",
    rarity: "uncommon",
    location: { latitude: 40.7829, longitude: -73.9654 },
    collectible: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function migrateDataToFirebase(options = {}) {
  const { dryRun = false, clearExisting = false, batchSize = 10 } = options;

  console.log("🚀 Starting Firebase data migration...");

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No actual data will be written");
    console.log(`📊 Would migrate:`);
    console.log(`  - ${sampleEvents.length} events`);
    console.log(`  - ${sampleUsers.length} users`);
    console.log(`  - ${sampleCoins.length} coins`);
    return;
  }

  try {
    // Note: This is a placeholder for actual Firebase operations
    // In a real React Native environment, you would use:
    // const { FirebaseService } = require("../services/firebase/FirebaseService");

    console.log("📊 Migration Summary:");
    console.log(`  ✅ Events ready: ${sampleEvents.length}`);
    console.log(`  ✅ Users ready: ${sampleUsers.length}`);
    console.log(`  ✅ Coins ready: ${sampleCoins.length}`);

    console.log("\n🚨 To complete migration:");
    console.log(
      "1. Run this in React Native environment with Firebase initialized"
    );
    console.log(
      "2. Or use the CreateEventModal in the app to add events manually"
    );
    console.log(
      "3. Firebase collections will be created automatically when first document is added"
    );

    // Simulate successful migration
    console.log(
      "\n📱 Use the + button in the app to create events with this data structure!"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes("--dry-run"),
    clearExisting: args.includes("--clear"),
    batchSize: parseInt(
      args.find((arg) => arg.startsWith("--batch-size="))?.split("=")[1] ||
        "10",
      10
    ),
  };

  console.log("🚀 Starting data migration with options:", options);

  try {
    await migrateDataToFirebase(options);
    console.log("✅ Migration setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
