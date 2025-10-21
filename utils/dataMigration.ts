/**
 * Mock Data Migration Script
 * Migrates all mock data to Firebase Firestore with enhanced structure
 */

import { FirebaseService } from "../services/firebase/FirebaseService";

// Mock data removed - using empty arrays
const mockEvents: any[] = [];
const mockEventLocations: any[] = [];
const mockCoins: any[] = [];
const mockUserProfiles: any[] = [];
const mockAchievements: any[] = [];

// Enhanced data structure for future extensibility
interface MigrationOptions {
  clearExisting?: boolean;
  dryRun?: boolean;
  batchSize?: number;
}

class DataMigrationService {
  static async migrateAllData(options: MigrationOptions = {}) {
    const { clearExisting = false, dryRun = false, batchSize = 10 } = options;

    console.log("🚀 Starting mock data migration to Firebase...");

    if (dryRun) {
      console.log("🔍 DRY RUN MODE - No data will be written");
    }

    try {
      // Clear existing data if requested
      if (clearExisting && !dryRun) {
        console.log("🧹 Clearing existing data...");
        await this.clearCollections();
      }

      // Migrate users first (needed for foreign key relationships)
      console.log("👥 Migrating user profiles...");
      await this.migrateUsers(dryRun, batchSize);

      // Migrate events
      console.log("🎯 Migrating events...");
      await this.migrateEvents(dryRun, batchSize);

      // Migrate event locations
      console.log("📍 Migrating event locations...");
      await this.migrateEventLocations(dryRun, batchSize);

      // Migrate coins
      console.log("🪙 Migrating coins...");
      await this.migrateCoins(dryRun, batchSize);

      // Create achievements collection
      console.log("🏆 Creating achievements...");
      await this.createAchievements(dryRun, batchSize);

      // Create additional collections for future use
      console.log("📊 Creating additional collections...");
      await this.createAdditionalCollections(dryRun);

      console.log("✅ Migration completed successfully!");
      return { success: true, message: "All data migrated successfully" };
    } catch (error) {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  }

  private static async clearCollections() {
    const collections = [
      "users",
      "events",
      "eventLocations",
      "coins",
      "achievements",
      "userEvents",
      "userCoins",
      "leaderboards",
      "regions",
    ];

    for (const collection of collections) {
      try {
        await FirebaseService.clearCollection(collection);
        console.log(`🗑️ Cleared ${collection} collection`);
      } catch (error) {
        console.warn(`⚠️ Failed to clear ${collection}:`, error);
      }
    }
  }

  private static async migrateUsers(dryRun: boolean, batchSize: number) {
    const enhancedUsers = mockUserProfiles.map((user: any) => ({
      ...user,
      // Enhanced fields for future use
      profile: {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        bio: "",
        location: {
          country: "",
          city: "",
          coordinates: { latitude: 0, longitude: 0 },
        },
        socialLinks: {
          twitter: "",
          instagram: "",
          website: "",
        },
      },
      stats: {
        level: user.level,
        totalCoins: user.totalCoins,
        eventsJoined: user.eventsJoined,
        eventsCompleted: 0,
        eventsCreated: 0,
        coinsCollected: 0,
        totalDistance: 0,
        daysActive: 0,
        currentStreak: 0,
        longestStreak: 0,
      },
      preferences: {
        notifications: {
          newEvents: true,
          eventReminders: true,
          achievements: true,
          social: true,
        },
        privacy: {
          profileVisible: true,
          showLocation: false,
          showStats: true,
        },
        theme: "auto" as const,
        language: "en",
        units: "metric" as const,
      },
      gaming: {
        achievements: user.achievements,
        titles: [],
        badges: [],
        favoriteEventTypes: [],
        specialities: [],
      },
      social: {
        friends: [],
        following: [],
        followers: [],
        blockedUsers: [],
      },
      subscription: {
        type: "free" as const,
        features: [],
        expiresAt: null,
      },
      deviceInfo: {
        pushToken: "",
        platform: "unknown" as const,
        appVersion: "1.0.0",
        lastLogin: user.updatedAt,
      },
      metadata: {
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastActiveAt: user.updatedAt,
        version: 1,
        migrated: true,
        source: "mock-data",
      },
    }));

    if (dryRun) {
      console.log(`📊 Would migrate ${enhancedUsers.length} users`);
      return;
    }

    for (let i = 0; i < enhancedUsers.length; i += batchSize) {
      const batch = enhancedUsers.slice(i, i + batchSize);
      await Promise.all(
        batch.map((user: any) => FirebaseService.createUser(user))
      );
      console.log(
        `👥 Migrated ${i + batch.length}/${enhancedUsers.length} users`
      );
    }
  }

  private static async migrateEvents(dryRun: boolean, batchSize: number) {
    const enhancedEvents = mockEvents.map((event: any) => ({
      ...event,
      // Enhanced fields for future use
      analytics: {
        views: Math.floor(Math.random() * 1000),
        clicks: Math.floor(Math.random() * 500),
        shares: Math.floor(Math.random() * 50),
        bookmarks: Math.floor(Math.random() * 100),
      },
      moderation: {
        status: "approved" as const,
        moderatedBy: "system",
        moderatedAt: event.createdAt,
        flags: [],
        reports: [],
      },
      weather: {
        forecast: null,
        recommendations: [],
      },
      difficulty: {
        level: Math.floor(Math.random() * 5) + 1,
        physicalIntensity: Math.floor(Math.random() * 5) + 1,
        technicalComplexity: Math.floor(Math.random() * 5) + 1,
        timeCommitment: Math.floor(Math.random() * 300) + 60, // minutes
      },
      accessibility: {
        wheelchairAccessible: Math.random() > 0.5,
        publicTransport: Math.random() > 0.3,
        parking: Math.random() > 0.7,
        familyFriendly: Math.random() > 0.4,
        petFriendly: Math.random() > 0.6,
      },
      costs: {
        entry: Math.random() > 0.8 ? Math.floor(Math.random() * 50) : 0,
        equipment: Math.random() > 0.9 ? Math.floor(Math.random() * 20) : 0,
        transport: Math.random() > 0.7 ? Math.floor(Math.random() * 15) : 0,
        currency: "USD",
      },
      multimedia: {
        images: event.image ? [event.image] : [],
        videos: [],
        audio: [],
        documents: [],
      },
      localization: {
        translations: {},
        supportedLanguages: ["en"],
        defaultLanguage: "en",
      },
      metadata: {
        version: 1,
        migrated: true,
        source: "mock-data",
        featured: Math.random() > 0.8,
        trending: Math.random() > 0.9,
        sponsored: false,
      },
    }));

    if (dryRun) {
      console.log(`📊 Would migrate ${enhancedEvents.length} events`);
      return;
    }

    for (let i = 0; i < enhancedEvents.length; i += batchSize) {
      const batch = enhancedEvents.slice(i, i + batchSize);
      await Promise.all(
        batch.map((event: any) => FirebaseService.createEvent(event as any))
      );
      console.log(
        `🎯 Migrated ${i + batch.length}/${enhancedEvents.length} events`
      );
    }
  }

  private static async migrateEventLocations(
    dryRun: boolean,
    batchSize: number
  ) {
    const enhancedLocations = mockEventLocations.map((location: any) => ({
      ...location,
      // Enhanced fields for future use
      accessibility: {
        wheelchairAccessible: Math.random() > 0.5,
        publicTransport: Math.random() > 0.3,
        parking: Math.random() > 0.7,
      },
      safety: {
        lighting: Math.floor(Math.random() * 5) + 1,
        crowdLevel: Math.floor(Math.random() * 5) + 1,
        securityPresence: Math.random() > 0.5,
        emergencyAccess: Math.random() > 0.8,
      },
      environment: {
        indoor: Math.random() > 0.6,
        weatherDependent: Math.random() > 0.4,
        noiseLevel: Math.floor(Math.random() * 5) + 1,
        surroundings: ["urban", "nature", "historic", "modern"][
          Math.floor(Math.random() * 4)
        ],
      },
      interaction: {
        completionRate: Math.random(),
        averageTime: Math.floor(Math.random() * 30) + 5, // minutes
        difficulty: Math.floor(Math.random() * 5) + 1,
        hints: [],
      },
      analytics: {
        visits: Math.floor(Math.random() * 100),
        completions: Math.floor(Math.random() * 80),
        averageRating: Math.random() * 2 + 3, // 3-5 stars
        reviews: [],
      },
      metadata: {
        version: 1,
        migrated: true,
        source: "mock-data",
      },
    }));

    if (dryRun) {
      console.log(
        `📊 Would migrate ${enhancedLocations.length} event locations`
      );
      return;
    }

    for (let i = 0; i < enhancedLocations.length; i += batchSize) {
      const batch = enhancedLocations.slice(i, i + batchSize);
      await Promise.all(
        batch.map((location: any) =>
          FirebaseService.createEventLocation(location)
        )
      );
      console.log(
        `📍 Migrated ${i + batch.length}/${
          enhancedLocations.length
        } event locations`
      );
    }
  }

  private static async migrateCoins(dryRun: boolean, batchSize: number) {
    const enhancedCoins = mockCoins.map((coin: any) => ({
      ...coin,
      // Enhanced fields for future use
      analytics: {
        discoveryRate: Math.random(),
        collectionRate: Math.random(),
        views: Math.floor(Math.random() * 50),
      },
      behavior: {
        respawnTime: coin.type === "standard" ? 3600 : 86400, // seconds
        maxCollections: coin.type === "rare" ? 1 : -1, // -1 = unlimited
        personalCooldown: 1800, // 30 minutes
      },
      interaction: {
        collectMethod: ["tap", "proximity", "ar-scan"][
          Math.floor(Math.random() * 3)
        ] as "tap" | "proximity" | "ar-scan",
        minDistance: Math.floor(Math.random() * 50) + 10, // meters
        collectDuration: Math.floor(Math.random() * 5) + 1, // seconds
      },
      visual: {
        model: coin.arModel,
        animation: "spin",
        effects: coin.effects || {
          sound: "coin-collect.mp3",
          particle: "sparkles",
          animation: "bounce",
        },
        scale: 1.0,
        opacity: 1.0,
      },
      metadata: {
        version: 1,
        migrated: true,
        source: "mock-data",
        season: null,
        event: null,
      },
    }));

    if (dryRun) {
      console.log(`📊 Would migrate ${enhancedCoins.length} coins`);
      return;
    }

    for (let i = 0; i < enhancedCoins.length; i += batchSize) {
      const batch = enhancedCoins.slice(i, i + batchSize);
      await Promise.all(
        batch.map((coin: any) => FirebaseService.createCoin(coin))
      );
      console.log(
        `🪙 Migrated ${i + batch.length}/${enhancedCoins.length} coins`
      );
    }
  }

  private static async createAchievements(dryRun: boolean, batchSize: number) {
    const enhancedAchievements = mockAchievements.map((achievement: any) => ({
      ...achievement,
      // Enhanced fields for future use
      category: ["events", "coins", "social", "exploration", "special"][
        Math.floor(Math.random() * 5)
      ],
      difficulty: ["easy", "medium", "hard", "expert"][
        Math.floor(Math.random() * 4)
      ],
      conditions: {
        type: achievement.requirement.includes("event")
          ? "events"
          : achievement.requirement.includes("coin")
          ? "coins"
          : "other",
        value: parseInt(achievement.requirement.match(/\d+/)?.[0] || "1", 10),
        timeframe: null, // e.g., "week", "month"
        consecutive: false,
      },
      rewards: {
        coins: achievement.points,
        experience: achievement.points * 2,
        title: null,
        badge: achievement.icon,
      },
      visibility: {
        hidden: false,
        teaser: achievement.description,
        unlockCondition: null,
      },
      metadata: {
        version: 1,
        migrated: true,
        source: "mock-data",
        seasonal: false,
        limited: false,
      },
    }));

    if (dryRun) {
      console.log(
        `📊 Would create ${enhancedAchievements.length} achievements`
      );
      return;
    }

    for (let i = 0; i < enhancedAchievements.length; i += batchSize) {
      const batch = enhancedAchievements.slice(i, i + batchSize);
      await Promise.all(
        batch.map((achievement: any) =>
          FirebaseService.createAchievement(achievement)
        )
      );
      console.log(
        `🏆 Created ${i + batch.length}/${
          enhancedAchievements.length
        } achievements`
      );
    }
  }

  private static async createAdditionalCollections(dryRun: boolean) {
    if (dryRun) {
      console.log("📊 Would create additional collections");
      return;
    }

    // Create regions collection for location-based features
    const regions = [
      {
        id: "paris",
        name: "Paris",
        country: "France",
        bounds: {
          north: 48.9,
          south: 48.8,
          east: 2.4,
          west: 2.2,
        },
        timezone: "Europe/Paris",
        currency: "EUR",
        language: "fr",
        featured: true,
        eventCount: 2,
      },
      {
        id: "new_york",
        name: "New York",
        country: "United States",
        bounds: {
          north: 40.8,
          south: 40.7,
          east: -73.9,
          west: -74.0,
        },
        timezone: "America/New_York",
        currency: "USD",
        language: "en",
        featured: true,
        eventCount: 1,
      },
      {
        id: "tokyo",
        name: "Tokyo",
        country: "Japan",
        bounds: {
          north: 35.7,
          south: 35.6,
          east: 139.8,
          west: 139.6,
        },
        timezone: "Asia/Tokyo",
        currency: "JPY",
        language: "ja",
        featured: true,
        eventCount: 1,
      },
    ];

    await Promise.all(
      regions.map((region) => FirebaseService.createRegion(region))
    );
    console.log(`🌍 Created ${regions.length} regions`);

    // Create leaderboards collection
    const leaderboards = [
      {
        id: "global_coins",
        type: "coins",
        period: "all-time",
        entries: [],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "global_events",
        type: "events",
        period: "all-time",
        entries: [],
        lastUpdated: new Date().toISOString(),
      },
      {
        id: "weekly_coins",
        type: "coins",
        period: "week",
        entries: [],
        lastUpdated: new Date().toISOString(),
      },
    ];

    await Promise.all(
      leaderboards.map((leaderboard) =>
        FirebaseService.createLeaderboard(leaderboard)
      )
    );
    console.log(`🏆 Created ${leaderboards.length} leaderboards`);
  }

  // Utility method to run migration with different options
  static async runMigration() {
    try {
      console.log("🔍 Running migration dry-run first...");
      await this.migrateAllData({ dryRun: true });

      console.log("\n🚀 Starting actual migration...");
      await this.migrateAllData({
        clearExisting: true,
        dryRun: false,
        batchSize: 5,
      });

      console.log("\n✅ Migration completed successfully!");
    } catch (error) {
      console.error("❌ Migration failed:", error);
      throw error;
    }
  }
}

export { DataMigrationService };

// Uncomment the line below to run migration (use with caution)
// DataMigrationService.runMigration();
