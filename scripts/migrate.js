#!/usr/bin/env node

/**
 * Firebase Migration Script
 * Run with: node scripts/migrate.js
 *
 * This script populates Firebase Firestore with sample data for:
 * - events
 * - users
 * - coins
 * - eventLocations
 * - achievements
 */

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin SDK with Application Default Credentials
const googleServices = require("../android/app/google-services.json");

try {
  admin.initializeApp({
    projectId: googleServices.project_info.project_id,
  });
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error.message);
  console.log(
    "💡 Note: For full migration functionality, you need to set up a Firebase service account key."
  );
  console.log(
    "💡 For now, you can use the in-app migration via Profile Settings."
  );
  process.exit(1);
}

const db = admin.firestore();

// Sample data
const sampleEvents = [
  {
    id: "event_1",
    title: "AR Treasure Hunt Downtown",
    description:
      "Explore downtown landmarks using AR technology to find hidden treasures and earn rewards!",
    category: "Adventure",
    difficulty: "Medium",
    startDate: new Date("2024-02-15T10:00:00Z"),
    endDate: new Date("2024-02-15T16:00:00Z"),
    location: {
      name: "Downtown Central Park",
      address: "123 Central Park Ave, City Center",
      latitude: 40.7829,
      longitude: -73.9654,
    },
    maxParticipants: 50,
    currentParticipants: 23,
    rewards: {
      coins: 100,
      badges: ["Explorer", "First Timer"],
    },
    status: "active",
    visibility: "public",
    createdBy: "user_1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "event_2",
    title: "Museum AR Experience",
    description:
      "Discover ancient artifacts through an immersive AR journey at the Natural History Museum.",
    category: "Educational",
    difficulty: "Easy",
    startDate: new Date("2024-02-20T14:00:00Z"),
    endDate: new Date("2024-02-20T17:00:00Z"),
    location: {
      name: "Natural History Museum",
      address: "456 Museum Boulevard, Cultural District",
      latitude: 40.7794,
      longitude: -73.9632,
    },
    maxParticipants: 30,
    currentParticipants: 18,
    rewards: {
      coins: 75,
      badges: ["History Buff", "Museum Explorer"],
    },
    status: "active",
    visibility: "public",
    createdBy: "user_2",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "event_3",
    title: "AR Scavenger Hunt Competition",
    description:
      "Compete with other players in a city-wide AR scavenger hunt. Find clues, solve puzzles, and win prizes!",
    category: "Competition",
    difficulty: "Hard",
    startDate: new Date("2024-02-25T09:00:00Z"),
    endDate: new Date("2024-02-25T18:00:00Z"),
    location: {
      name: "City Plaza",
      address: "789 Main Street, City Plaza",
      latitude: 40.7505,
      longitude: -73.9934,
    },
    maxParticipants: 100,
    currentParticipants: 67,
    rewards: {
      coins: 200,
      badges: ["Champion", "Speed Runner", "Puzzle Master"],
    },
    status: "active",
    visibility: "public",
    createdBy: "user_1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const sampleUsers = [
  {
    id: "user_1",
    name: "Alex Chen",
    email: "alex.chen@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=alex",
    level: 5,
    totalCoins: 450,
    joinedEvents: ["event_1", "event_3"],
    achievements: ["Explorer", "First Timer", "Champion"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "user_2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=sarah",
    level: 3,
    totalCoins: 275,
    joinedEvents: ["event_2"],
    achievements: ["History Buff", "Museum Explorer"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const sampleCoins = [
  {
    id: "coin_1",
    userId: "user_1",
    eventId: "event_1",
    amount: 100,
    reason: "Event completion",
    location: {
      latitude: 40.7829,
      longitude: -73.9654,
    },
    collectedAt: new Date("2024-02-15T15:30:00Z"),
    createdAt: new Date(),
  },
  {
    id: "coin_2",
    userId: "user_1",
    eventId: "event_3",
    amount: 200,
    reason: "Competition winner",
    location: {
      latitude: 40.7505,
      longitude: -73.9934,
    },
    collectedAt: new Date("2024-02-25T17:45:00Z"),
    createdAt: new Date(),
  },
  {
    id: "coin_3",
    userId: "user_2",
    eventId: "event_2",
    amount: 75,
    reason: "Event completion",
    location: {
      latitude: 40.7794,
      longitude: -73.9632,
    },
    collectedAt: new Date("2024-02-20T16:20:00Z"),
    createdAt: new Date(),
  },
];

async function migrateData() {
  try {
    console.log("🚀 Starting Firebase migration...\n");

    // Migrate Events
    console.log("📅 Creating events collection...");
    for (const event of sampleEvents) {
      await db.collection("events").doc(event.id).set(event);
      console.log(`✅ Created event: ${event.title}`);
    }

    // Migrate Users
    console.log("\n👥 Creating users collection...");
    for (const user of sampleUsers) {
      await db.collection("users").doc(user.id).set(user);
      console.log(`✅ Created user: ${user.name}`);
    }

    // Migrate Coins
    console.log("\n🪙 Creating coins collection...");
    for (const coin of sampleCoins) {
      await db.collection("coins").doc(coin.id).set(coin);
      console.log(
        `✅ Created coin: ${coin.id} (${coin.amount} coins for ${coin.userId})`
      );
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   • ${sampleEvents.length} events created`);
    console.log(`   • ${sampleUsers.length} users created`);
    console.log(`   • ${sampleCoins.length} coin records created`);

    console.log("\n🔗 Collections created in Firebase Firestore:");
    console.log("   • events");
    console.log("   • users");
    console.log("   • coins");

    console.log("\n✨ You can now see the data in your Firebase Console!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log("\n🎯 Migration script completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = { migrateData };
