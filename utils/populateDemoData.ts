import { FirebaseService } from "../services/firebase/FirebaseService";
import { EventType, EventStatus } from "../types";
import { computeEconomy, distributeCoinValues } from "./tokenEconomy";

// Demo data configuration
const DEMO_CONFIG = {
  TOTAL_EVENTS: 8, // Reduced for in-app generation
  TOTAL_USERS: 20, // Reduced for in-app generation
  BASE_ENTRY_FEE: 10, // Minimum tokens to join (10€ = 10 tokens) - UPDATED
  LATE_FEE_PENALTY: 10,
  BONUS_MULTIPLIER: 1.5,
  COINS_PER_EVENT: { min: 5, max: 20 }, // UPDATED: 10 tokens = 5 coins, so 10-40 tokens = 5-20 coins
  PARTICIPANTS_PER_EVENT: { min: 2, max: 8 },
  COIN_VALUE_RANGE: { min: 5, max: 25 },
  EVENT_DURATION_HOURS: { min: 2, max: 4 },
  // Token economy: 10 tokens entry = 5 virtual coins generated - UPDATED
  TOKENS_TO_COINS_RATIO: 5 / 10, // 10 tokens = 5 coins - UPDATED
};

// Realistic locations for AR coin hunts (NYC area for testing)
const HUNT_LOCATIONS = [
  {
    name: "Central Park",
    coords: { latitude: 40.7829, longitude: -73.9654 },
    description: "Iconic urban park perfect for AR adventures",
    terrain: "Urban",
    difficulty: "Easy",
  },
  {
    name: "Brooklyn Bridge Park",
    coords: { latitude: 40.7021, longitude: -73.9967 },
    description: "Waterfront park under iconic bridge",
    terrain: "Park",
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
    name: "Neighborhood Explorer",
    description:
      "Discover hidden gems in your local area. Each coin reveals interesting facts about the location!",
    type: "Flash Hunt",
    huntType: "community-event",
  },
];

// Predefined working Unsplash image URLs for events
const EVENT_IMAGES = [
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
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", // Mountain landscape 2
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&q=80", // City downtown 2
  "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=80", // City skyline 2
  "https://images.unsplash.com/photo-1516483638261-f4dbbd436418?w=400&q=80", // Forest path 2
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80", // Waterfront city 2
];

function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateNearbyCoords(
  centerLat: number,
  centerLng: number,
  radiusMeters = 500
) {
  const radiusInDegrees = radiusMeters / 111320;
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusInDegrees;

  return {
    latitude: centerLat + distance * Math.cos(angle),
    longitude: centerLng + distance * Math.sin(angle),
  };
}

function calculatePrizePool(
  participants: number,
  baseFee: number,
  collectedTokens: number
) {
  const entryFees = participants * baseFee;
  const totalPrize =
    Math.floor(entryFees * DEMO_CONFIG.BONUS_MULTIPLIER) + collectedTokens;
  return totalPrize;
}

function generateEventStatus(): EventStatus {
  const rand = Math.random();
  if (rand < 0.5) {
    return "active";
  }
  if (rand < 0.75) {
    return "upcoming";
  }
  return "completed";
}

function generateEventDates(status: string) {
  const now = new Date();

  if (status === "completed") {
    const endDate = new Date(
      now.getTime() - getRandomInt(1, 3) * 24 * 60 * 60 * 1000
    );
    const duration = getRandomInt(2, 4) * 60 * 60 * 1000;
    const startDate = new Date(endDate.getTime() - duration);
    return { startDate, endDate };
  }

  if (status === "active") {
    const startDate = new Date(
      now.getTime() - getRandomInt(30, 60) * 60 * 1000
    );
    const duration = getRandomInt(60, 180) * 60 * 1000;
    const endDate = new Date(now.getTime() + duration);
    return { startDate, endDate };
  }

  const startDate = new Date(
    now.getTime() + getRandomInt(1, 7) * 24 * 60 * 60 * 1000
  );
  const duration = getRandomInt(2, 4) * 60 * 60 * 1000;
  const endDate = new Date(startDate.getTime() + duration);
  return { startDate, endDate };
}

export async function populateDemoData() {
  console.log("🚀 Starting in-app demo data population...");

  try {
    // Create demo users first
    console.log("👥 Creating demo users...");
    const users = [];
    for (let i = 0; i < DEMO_CONFIG.TOTAL_USERS; i++) {
      const userId = `demo-user-${Date.now()}-${i}`;
      const userData = {
        id: userId,
        name: `Demo Player ${i + 1}`,
        email: `player${i + 1}@demo.com`,
        level: getRandomInt(1, 5),
        totalCoins: getRandomInt(200, 800),
        joinedEvents: [],
        collectedCoins: [],
        preferences: {
          notifications: Math.random() > 0.3,
          theme: Math.random() > 0.5 ? "dark" : "light",
          language: "en",
        },
        stats: {
          eventsJoined: 0,
          coinsCollected: 0,
          totalDistance: getRandomInt(500, 2000),
          daysActive: getRandomInt(1, 15),
        },
      };

      const firestoreUserId = await FirebaseService.createUser(userData);
      // Use the actual Firestore document ID for future operations
      const userWithId = { ...userData, firestoreId: firestoreUserId };
      users.push(userWithId);
      console.log(
        `  ✓ Created user: ${userData.name} (ID: ${firestoreUserId})`
      );
    }

    // Create demo events
    console.log("🎯 Creating demo events...");
    const events = [];

    for (let i = 0; i < DEMO_CONFIG.TOTAL_EVENTS; i++) {
      const location = getRandomElement(HUNT_LOCATIONS);
      const template = getRandomElement(HUNT_TEMPLATES);
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

      // Calculate entry fee (allow some events to have higher entry for more coins)
      const baseFee =
        Math.random() > 0.7
          ? DEMO_CONFIG.BASE_ENTRY_FEE * getRandomInt(2, 4) // Higher entry fee for premium events (20-40 tokens)
          : DEMO_CONFIG.BASE_ENTRY_FEE; // Minimum 10 tokens

      // Use centralized economy computation
      const numCoins = Math.max(3, Math.min(8, Math.floor(baseFee / 3))); // 3-8 coins depending on entry fee
      const economy = computeEconomy({
        participants: participants.length,
        tokensRequired: baseFee,
      });
      const initialPrizePool = economy.prizePoolBase;
      const targetTokenValue = economy.coinTokenTotal; // allocate coin token total from economy

      const eventData = {
        name: `${template.name} at ${location.name}`,
        title: `${template.name} at ${location.name}`, // Add title field
        description: template.description,
        type: template.huntType as EventType,
        status: status,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: `${location.name}, USA`,
          venue: location.name,
        },
        coordinate: location.coords,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        maxParticipants: getRandomInt(15, 30),
        currentParticipants: participants.length,
        participants: participants.map((u) => u.firestoreId),
        organizer: {
          id: "admin",
          name: "AR Coin Hunt Team",
        },
        tags: ["ar", "coins", "hunt", location.terrain.toLowerCase()],
        image: getRandomElement(EVENT_IMAGES),
        rewards: {
          coins: initialPrizePool,
          experience: getRandomInt(30, 100),
        },
        entryFee: baseFee, // Add entry fee to event data
        minCoins: numCoins,
        requirements: {
          minLevel: 1,
        },
        visibility: "public" as const,
        huntDetails: {
          coinsAvailable: numCoins,
          coinsRemaining: numCoins, // Track remaining coins
          tokensRequired: baseFee, // Minimum tokens to join
          tokensCollected: 0, // Track collected tokens
          difficulty: location.difficulty as "Easy" | "Medium" | "Hard",
          terrain: location.terrain as
            | "Urban"
            | "Park"
            | "Forest"
            | "Beach"
            | "Mountain"
            | "Desert"
            | "Historical",
          range: getRandomInt(300, 1000),
          totalPrizePool: initialPrizePool,
          huntType: template.type as
            | "Flash Hunt"
            | "Adventure Hunt"
            | "Epic Journey Hunt",
        },
        terrain: location.terrain,
        difficulty: location.difficulty,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const eventId = await FirebaseService.createEvent(eventData);
      console.log(
        `  ✓ Created event: ${eventData.name} (${status}) - ${participants.length} participants, ${baseFee} token entry fee, ${numCoins} coins available`
      );

      // Create coins for the event with flexible token distribution
      const coins = [];
      const values = distributeCoinValues(targetTokenValue, numCoins);
      let totalTokenValue = 0;

      for (let j = 0; j < numCoins; j++) {
        const coinLocation = generateNearbyCoords(
          location.coords.latitude,
          location.coords.longitude,
          200
        );
        const coinValue = values[j];
        totalTokenValue += coinValue;

        const coinData = {
          name: `Coin ${j + 1}`,
          description: `Treasure coin #${j + 1} in ${location.name}`,
          value: coinValue,
          type: "event",
          rarity:
            coinValue >= 25 ? "rare" : Math.random() > 0.8 ? "rare" : "common",
          eventId: eventId,
          createdBy: "admin",
          location: coinLocation,
          coordinate: coinLocation,
          region: location.name.toLowerCase().replace(/\s+/g, "-"),
          collectible: true,
          collected: false,
          collectedBy: null,
          collectedAt: null,
          image: `https://api.dicebear.com/7.x/shapes/svg?seed=coin-${j}`,
          arModel: "coin",
          requirements: {
            level: 1,
          },
        };

        const coinId = await FirebaseService.createCoin(coinData);
        coins.push({ id: coinId, ...coinData });
      }

      console.log(
        `    - Created ${numCoins} coins with total value: ${totalTokenValue} tokens`
      );

      // Simulate coin collection for ongoing/completed events
      let collectedTokens = 0;
      let remainingCoins = numCoins;
      if (status !== "upcoming") {
        const coinsToCollect = Math.floor(
          numCoins * (status === "completed" ? 0.7 : 0.4)
        );
        const coinsToCollectList = coins
          .sort(() => Math.random() - 0.5)
          .slice(0, coinsToCollect);

        for (const coin of coinsToCollectList) {
          const collector = getRandomElement(participants);

          // Update coin as collected
          await FirebaseService.collectCoin(coin.id, collector.firestoreId);
          collectedTokens += coin.value;
          remainingCoins--;

          // Update user collected coins array
          const userData = await FirebaseService.getUserProfile(
            collector.firestoreId
          );
          if (userData) {
            const currentCollectedCoins =
              (userData as any).collectedCoins || [];
            await FirebaseService.updateUserProfile(collector.firestoreId, {
              collectedCoins: [...currentCollectedCoins, coin.id],
            });
          }
        }

        console.log(
          `    - ${coinsToCollect} coins collected out of ${numCoins} (${collectedTokens} tokens) - ${remainingCoins} coins remaining`
        );

        // Update event prize pool and remaining coins
        if (collectedTokens > 0) {
          const finalPrizePool = calculatePrizePool(
            participants.length,
            baseFee, // Use only base fee for prize pool calculation
            collectedTokens
          );
          await FirebaseService.updateEvent(eventId, {
            rewards: {
              ...eventData.rewards,
              coins: finalPrizePool,
            },
            huntDetails: {
              ...eventData.huntDetails,
              totalPrizePool: finalPrizePool,
              coinsRemaining: remainingCoins,
              tokensCollected: collectedTokens,
            },
          });
          console.log(
            `    - Updated prize pool: ${initialPrizePool} → ${finalPrizePool} coins, ${remainingCoins} coins remaining`
          );
        }
      }

      // Update user participation
      for (const user of participants) {
        await FirebaseService.updateUserProfile(user.firestoreId, {
          joinedEvents: [...(user.joinedEvents || []), eventId],
        });
      }

      events.push({ eventId, eventData, coins, collectedTokens });
    }

    // Summary
    const totalEvents = events.length;
    const totalCoins = events.reduce((sum, e) => sum + e.coins.length, 0);
    const totalCollectedTokens = events.reduce(
      (sum, e) => sum + e.collectedTokens,
      0
    );
    const totalPrizePool = events.reduce(
      (sum, e) => sum + (e.eventData.huntDetails?.totalPrizePool || 0),
      0
    );

    console.log("\n🎉 Demo data population complete!");
    console.log(`📊 Created ${DEMO_CONFIG.TOTAL_USERS} users`);
    console.log(`🎯 Created ${totalEvents} events`);
    console.log(`🪙 Created ${totalCoins} coins total`);
    console.log(`💰 Total prize pool: ${totalPrizePool} tokens`);
    console.log(`✅ Total tokens collected: ${totalCollectedTokens}`);
    console.log(
      "💡 Token Economy: Minimum 10 tokens entry fee, flexible coin distribution based on token values"
    );

    console.log(
      "\n🚀 Demo data ready! The app now has realistic AR coin hunt scenarios with profit-generating token economy."
    );
    console.log(
      "💡 Entry fees create prize pools, coins are collected in AR for token rewards"
    );
    console.log(
      "💡 Tip: Look for events with remaining coins count displayed for ongoing hunts!"
    );

    return {
      success: true,
      stats: {
        users: DEMO_CONFIG.TOTAL_USERS,
        events: totalEvents,
        coins: totalCoins,
        totalPrizePool,
        collectedTokens: totalCollectedTokens,
      },
    };
  } catch (error) {
    console.error("❌ Error populating demo data:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
